/// <reference path="../.astro/types.d.ts" />

// Definición de tipos para Cloudflare Workers
type D1Database = import("@cloudflare/workers-types").D1Database;
type KVNamespace = import("@cloudflare/workers-types").KVNamespace;

/**
 * Definición de las variables de entorno para Cloudflare
 */
type ENV = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	TURNSTILE_SECRET_KEY: string;
	HASH_SERVICE_URL: string;
	HASH_SERVICE_API_KEY: string;
	PUBLIC_TURNSTILE_SITE_KEY: string;
	RESEND_API_KEY: string;
	RESEND_FROM?: string;
};

/**
 * Espacio de nombres Global para Astro
 * Define el tipado de Astro.locals para tener autocompletado y seguridad de tipos
 */
declare namespace App {
	interface Locals {
		// Datos del usuario y sesión inyectados por el middleware de autenticación
		user: import("better-auth").User | null;
		session: import("better-auth").Session | null;

		// Contexto de ejecución de Cloudflare
		runtime: import("@astrojs/cloudflare").Runtime<ENV> & {
			data: {
				user: import("better-auth").User | null;
				session: import("better-auth").Session | null;
			};
		};
	}
}
