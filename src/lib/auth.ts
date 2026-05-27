import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
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

const authInstances = new Map<string, ReturnType<typeof betterAuth>>();

const checkHashService = async (url: string): Promise<boolean> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 2000);

	try {
		const res = await fetch(`${url}/health`, {
			signal: controller.signal,
		});
		clearTimeout(timeout);
		return res.ok;
	} catch {
		clearTimeout(timeout);
		return false;
	}
};

const fetchWithTimeout = async (
	url: string,
	options: RequestInit,
	timeoutMs = 5000,
): Promise<Response> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, { ...options, signal: controller.signal });
		clearTimeout(timeout);
		return res;
	} catch {
		clearTimeout(timeout);
		throw new Error("Servicio de autenticación no disponible");
	}
};

export const auth = (
	db: D1Database,
	kv: KVNamespace | null,
	env?: {
		BETTER_AUTH_SECRET?: string;
		BETTER_AUTH_URL?: string;
		TURNSTILE_SECRET_KEY?: string;
		HASH_SERVICE_URL?: string;
		HASH_SERVICE_API_KEY?: string;
	},
) => {
	if (!db) {
		throw new Error("Se requiere base de datos (D1) para autenticación");
	}

	const cacheKey = `${env?.BETTER_AUTH_URL || "local"}-${env?.BETTER_AUTH_SECRET?.substring(0, 5) || "no-secret"}-${env?.TURNSTILE_SECRET_KEY?.substring(0, 5) || "no-turnstile"}`;

	if (authInstances.has(cacheKey)) {
		return authInstances.get(cacheKey) as ReturnType<typeof betterAuth>;
	}

	if (authInstances.size >= 10) {
		const oldestKey = authInstances.keys().next().value;
		if (oldestKey) {
			authInstances.delete(oldestKey);
			console.warn(
				`🧹 Límite de cache alcanzado, eliminado entorno más antiguo: ${oldestKey}`,
			);
		}
	}

	const d1 = drizzle(db, { schema });

	const authInstance = betterAuth({
		database: drizzleAdapter(d1, {
			provider: "sqlite",
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
		}),
		secret: env?.BETTER_AUTH_SECRET,
		baseURL: env?.BETTER_AUTH_URL,

		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60,
				strategy: "compact",
			},
		},

		secondaryStorage: kv
			? {
					get: async (key: string) => {
						const value = await kv.get(key);
						return value ? JSON.parse(value) : null;
					},
					set: async (key: string, value: unknown, ttl?: number) => {
						if (ttl !== undefined) {
							const safeTtl = Math.max(60, ttl);
							await kv.put(key, JSON.stringify(value), { expirationTtl: safeTtl });
						} else {
							await kv.put(key, JSON.stringify(value));
						}
					},
					delete: async (key: string) => {
						await kv.delete(key);
					},
				}
			: undefined,

		emailAndPassword: {
			enabled: true,
			password: {
				hash: async (password) => {
					const isStrong =
						password.length >= 8 &&
						/[A-Z]/.test(password) &&
						/[a-z]/.test(password) &&
						(/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password));

					if (!isStrong) {
						throw new Error(
							"La contraseña no cumple con los requisitos de seguridad (mínimo 8 caracteres, mayúsculas y números)",
						);
					}

					const healthy = await checkHashService(env?.HASH_SERVICE_URL || "");
					if (!healthy) {
						throw new Error("Servicio de autenticación no disponible");
					}

					const response = await fetchWithTimeout(
						`${env?.HASH_SERVICE_URL}/hash`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"x-api-key": env?.HASH_SERVICE_API_KEY || "",
							},
							body: JSON.stringify({ password }),
						},
					);

					const jsonRes: HashResponse = await response.json();
					return jsonRes.data.hash;
				},
				verify: async ({ hash, password }) => {
					const healthy = await checkHashService(env?.HASH_SERVICE_URL || "");
					if (!healthy) {
						throw new Error("Servicio de autenticación no disponible");
					}

					const response = await fetchWithTimeout(
						`${env?.HASH_SERVICE_URL}/verify`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"x-api-key": env?.HASH_SERVICE_API_KEY || "",
							},
							body: JSON.stringify({ password, hash }),
						},
					);
					const jsonRes: VerifyResponse = await response.json();
					return jsonRes.data.match;
				},
			},
		},

		trustedOrigins: [
			"http://localhost:4321",
			"https://tempo.mgdc.site",
		],

		hooks: {
			before: async (context) => {
				if (!context.request) return;

				const url = new URL(context.request.url);
				const path = url.pathname;

				if (
					path.endsWith("/sign-up/email") ||
					path.endsWith("/sign-in/email")
				) {
					const token = context.request.headers.get("x-turnstile-token");
					const secret = env?.TURNSTILE_SECRET_KEY;

					if (!secret) {
						if (env?.BETTER_AUTH_URL?.includes("localhost")) {
							return;
						}
						throw new Error("Error de configuración: TURNSTILE_SECRET_KEY no está definida");
					}

					if (!token) {
						throw new Error("Se requiere verificación de seguridad");
					}

					const result = await fetch(
						"https://challenges.cloudflare.com/turnstile/v0/siteverify",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/x-www-form-urlencoded",
							},
							body: `secret=${secret}&response=${token}`,
						},
					);

					const outcome: { success: boolean } = await result.json();
					if (!outcome.success) {
						throw new Error(
							"La verificación de seguridad falló. Intenta de nuevo.",
						);
					}
				}
			},
		},
	});

	authInstances.set(cacheKey, authInstance);

	return authInstance;
};
