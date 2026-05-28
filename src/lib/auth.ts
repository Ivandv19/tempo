import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { Resend } from "resend";
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
		RESEND_API_KEY?: string;
		RESEND_FROM?: string;
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
			updateAge: 60 * 60 * 8,
			cookieCache: {
				enabled: true,
				maxAge: 60 * 60 * 8,
				strategy: "compact",
			},
			storeSessionInDatabase: true,
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
							await kv.put(key, JSON.stringify(value), {
								expirationTtl: safeTtl,
							});
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
			autoSignIn: false,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				if (!env?.RESEND_API_KEY) {
					console.error("[Auth] RESEND_API_KEY no configurada");
					return;
				}
				try {
					const resend = new Resend(env.RESEND_API_KEY);
					const result = await resend.emails.send({
						from: env.RESEND_FROM || "Tempo <noreply@mgdc.site>",
						to: user.email,
						subject: "Restablece tu contraseña / Reset your password",
						text: `${url}`,
					});
					console.log("[Auth] Reset email sent to", user.email, result);
				} catch (error) {
					console.error("[Auth] Error sending reset email:", error);
				}
			},
			password: {
				hash: async (password) => {
					if (password.length < 8) {
						throw new Error(
							"La contraseña debe tener al menos 8 caracteres",
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

		emailVerification: {
			autoSignInAfterVerification: true,
			sendOnSignUp: false,
			sendOnSignIn: true,
			sendVerificationEmail: async ({ user, url, token: _token }, _request) => {
				console.log("[Auth] sendVerificationEmail CALLED for", user?.email);
				if (!env?.RESEND_API_KEY) {
					console.error("[Auth] RESEND_API_KEY no configurada");
					return;
				}
				try {
					const resend = new Resend(env.RESEND_API_KEY);
					const result = await resend.emails.send({
						from: env.RESEND_FROM || "Tempo <noreply@mgdc.site>",
						to: user.email,
						subject: "Verifica tu correo / Verify your email",
						text: `${url}`,
					});
					console.log("[Auth] Verification email sent to", user.email, result);
				} catch (error) {
					console.error("[Auth] Error sending verification email:", error);
				}
			},
		},

		trustedOrigins: ["http://localhost:4321", "https://tempo.mgdc.site"],

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
						throw new Error(
							"Error de configuración: TURNSTILE_SECRET_KEY no está definida",
						);
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
