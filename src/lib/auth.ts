import type { KVNamespace, D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

interface HashResponse {
  data: { hash: string };
}
interface VerifyResponse {
  data: { match: boolean };
}

/**
 * Sistema de Cache de Instancias
 * Cloudflare Workers puede reutilizar procesos calientes (warm starts).
 * Guardamos las instancias en un Map para evitar recrearlas en cada petición,
 * pero usamos una clave basada en el entorno para mayor seguridad.
 */
const authInstances = new Map<string, ReturnType<typeof betterAuth>>();

/**
 * Configuración central de Better Auth para el servidor.
 * Maneja la conexión con D1 (Base de Datos), KV (Sesiones secundarias/Rate Limit)
 * y la lógica de hashing y verificación de Turnstile.
 */
export const auth = (db: D1Database, kv: KVNamespace | null, env?: {
    BETTER_AUTH_SECRET?: string,
    BETTER_AUTH_URL?: string,
    TURNSTILE_SECRET_KEY?: string,
    HASH_SERVICE_URL?: string,
    HASH_SERVICE_API_KEY?: string
}) => {
    // Verificación de integridad: Better Auth necesita una base de datos D1
    if (!db) {
        throw new Error("Se requiere base de datos (D1) para autenticación");
    }

    /**
     * Generación de Clave Única para la Cache
     * Incluye fragmentos de los secretos para que, si cambian en el dashboard de Cloudflare,
     * la cache se invalide automáticamente y se genere una instancia fresca.
     */
    const cacheKey = `${env?.BETTER_AUTH_URL || 'local'}-${env?.BETTER_AUTH_SECRET?.substring(0, 5) || 'no-secret'}-${env?.TURNSTILE_SECRET_KEY?.substring(0, 5) || 'no-turnstile'}`;

    // Intentar recuperar de la cache para mejorar el tiempo de respuesta (Warm Start)
    if (authInstances.has(cacheKey)) {
        // console.log(`[Auth] Reusando instancia para cacheKey: ${cacheKey.replace(/-[^-]+$/, '-*****')}`);
        return authInstances.get(cacheKey) as ReturnType<typeof betterAuth>;
    }

    // console.log(`[Auth] Creando nueva instancia. URL: ${env?.BETTER_AUTH_URL || 'n/a'}`);

    /**
     * Gestión de Memoria (Evicción LRU Simple)
     * Si acumulamos demasiadas instancias (por cambios frecuentes de entorno),
     * eliminamos la más antigua para prevenir memory leaks en el worker.
     */
    if (authInstances.size >= 10) {
        const oldestKey = authInstances.keys().next().value;
        if (oldestKey) {
            authInstances.delete(oldestKey);
            console.warn(`🧹 Límite de cache alcanzado, eliminado entorno más antiguo: ${oldestKey}`);
        }
    }

    // Inicializar Drizzle con el esquema del proyecto
    const d1 = drizzle(db, { schema });

    /**
     * Inicialización Principal de Better Auth
     */
    const authInstance = betterAuth({
        database: drizzleAdapter(d1, {
            provider: "sqlite",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
            }
        }),
        secret: env?.BETTER_AUTH_SECRET,
        baseURL: env?.BETTER_AUTH_URL,

        // Configuración de almacenamiento secundario (usando Cloudflare KV)
        secondaryStorage: kv ? {
            get: async (key: string) => {
                const value = await kv.get(key);
                return value ? JSON.parse(value) : null;
            },
            set: async (key: string, value: unknown, ttl?: number) => {
                if (ttl) {
                    await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
                } else {
                    await kv.put(key, JSON.stringify(value));
                }
            },
            delete: async (key: string) => {
                await kv.delete(key);
            }
        } : undefined,

        // Configuración de Email y Contraseña con Hashing Externo
        emailAndPassword: {
            enabled: true,
            password: {
                /**
                 * Hashing de contraseñas vía microservicio externo.
                 * Esto permite centralizar la seguridad de las claves.
                 */
                hash: async (password) => {
                    // Validación de fortaleza en el servidor (Seguridad extra)
                    const isStrong = password.length >= 8 &&
                        /[A-Z]/.test(password) &&
                        /[a-z]/.test(password) &&
                        (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password));

                    if (!isStrong) {
                        throw new Error("La contraseña no cumple con los requisitos de seguridad (mínimo 8 caracteres, mayúsculas y números)");
                    }

                    const response = await fetch(`${env?.HASH_SERVICE_URL}/hash`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": env?.HASH_SERVICE_API_KEY || "",
                        },
                        body: JSON.stringify({ password }),
                    });
                    const jsonRes: HashResponse = await response.json();
                    return jsonRes.data.hash;
                },
                /**
                 * Verificación de contraseñas vía microservicio externo.
                 */
                verify: async ({ hash, password }) => {
                    const response = await fetch(`${env?.HASH_SERVICE_URL}/verify`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": env?.HASH_SERVICE_API_KEY || "",
                        },
                        body: JSON.stringify({ password, hash }),
                    });
                    const jsonRes: VerifyResponse = await response.json();
                    return jsonRes.data.match;
                }
            }
        },

        // Orígenes de confianza para CORS y redirects
        trustedOrigins: [
            "http://localhost:4321",
            "https://sinx-pomodoro.mgdc.site"
        ],

        /**
         * Hooks de Ciclo de Vida
         * Usamos 'before' para interceptar peticiones críticas y validar el CAPTCHA.
         */
        hooks: {
            before: async (context) => {
                if (!context.request) return;

                const url = new URL(context.request.url);
                const path = url.pathname;

                /**
                 * Validación de Turnstile (Anti-Bot)
                 * Solo se requiere en el registro y en el inicio de sesión.
                 */
                if (path.endsWith("/sign-up/email") || path.endsWith("/sign-in/email")) {
                    const token = context.request.headers.get("x-turnstile-token");
                    const secret = env?.TURNSTILE_SECRET_KEY;

                    if (!secret) {
                        console.error("Falta TURNSTILE_SECRET_KEY en el entorno");
                        return;
                    }

                    if (!token) {
                        throw new Error("Se requiere verificación de seguridad");
                    }

                    // Petición a Cloudflare para verificar la validez del token
                    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: `secret=${secret}&response=${token}`,
                    });

                    const outcome: { success: boolean } = await result.json();
                    if (!outcome.success) {
                        throw new Error("La verificación de seguridad falló. Intenta de nuevo.");
                    }
                }
            }
        }
    });

    // Guardar la instancia en la cache para futuras peticiones
    authInstances.set(cacheKey, authInstance);

    return authInstance;
};
