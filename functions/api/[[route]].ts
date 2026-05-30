import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/cloudflare-pages";
import { z } from "zod";
import { auth } from "../../src/lib/auth";
import type {
	BreakResponse,
	CategoriaResponse,
	PomodoroResponse,
	StatsResponse,
	TareaResponse,
} from "../../src/lib/validations";
import {
	actualizarTareaSchema,
	breakResponse as breakResponseSchema,
	categoriaResponse as categoriaResponseSchema,
	crearBreakSchema,
	crearPomodoroSchema,
	crearTareaSchema,
	idParamSchema,
	listarPomodorosQuery,
	listarTareasQuery,
	pomodoroResponse as pomodoroResponseSchema,
	statsQuery,
	statsResponse as statsResponseSchema,
	tareaDetalleResponse as tareaDetalleResponseSchema,
	tareaResponse as tareaResponseSchema,
} from "../../src/lib/validations";

type Bindings = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	TURNSTILE_SECRET_KEY: string;
	HASH_SERVICE_URL: string;
	HASH_SERVICE_API_KEY: string;
	RESEND_API_KEY: string;
	RESEND_FROM?: string;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>().basePath("/api");

// ─── Helpers ───────────────────────────────────────────────────

const errorSchema = z.object({
	error: z.union([z.string(), z.record(z.any())]),
});
const successSchema = z.object({ success: z.literal(true) });

function dataResponse<T extends z.ZodType>(schema: T, name: string) {
	return z.object({ data: schema }).openapi(name);
}

const checkRateLimit = async (
	kv: KVNamespace,
	ip: string,
	maxAttempts = 20,
	windowMinutes = 5,
) => {
	const key = `rate-limit:login:${ip}`;
	const now = Date.now();
	const data = await kv.get<{ attempts: number; resetAt: number }>(key, "json");

	if (!data || now > data.resetAt) {
		await kv.put(
			key,
			JSON.stringify({ attempts: 1, resetAt: now + windowMinutes * 60 * 1000 }),
			{ expirationTtl: windowMinutes * 60 },
		);
		return true;
	}

	if (data.attempts >= maxAttempts) return false;

	await kv.put(
		key,
		JSON.stringify({ attempts: data.attempts + 1, resetAt: data.resetAt }),
		{ expirationTtl: Math.ceil((data.resetAt - now) / 1000) },
	);
	return true;
};

const getSession = async (c: {
	env: Bindings;
	req: { raw: { headers: Headers } };
}) => {
	return await auth(c.env.DB, c.env.LUCIA_KV, c.env).api.getSession({
		headers: c.req.raw.headers,
	});
};

// ─── CATEGORÍAS ─────────────────────────────────────────────────

app.openapi(
	createRoute({
		method: "get",
		path: "/categorias",
		tags: ["Categorías"],
		description: "Listar todas las categorías del usuario autenticado",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: dataResponse(
							z.array(categoriaResponseSchema),
							"CategoriasResponse",
						),
					},
				},
				description: "Lista de categorías del usuario",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { results } = await c.env.DB.prepare(
			"SELECT id, nombre FROM categoria WHERE user_id = ? ORDER BY id",
		)
			.bind(session.user.id)
			.all<CategoriaResponse>();

		return c.json({ data: results });
	},
);

app.openapi(
	createRoute({
		method: "post",
		path: "/categorias/seed",
		tags: ["Categorías"],
		description:
			"Crear las tres categorías por defecto (Trabajo, Estudio, Personal)",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: dataResponse(
							z.array(categoriaResponseSchema),
							"CategoriasSeedResponse",
						),
					},
				},
				description: "Categorías por defecto creadas",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const defaults = [
			{ nombre: "Trabajo", userId: session.user.id },
			{ nombre: "Estudio", userId: session.user.id },
			{ nombre: "Personal", userId: session.user.id },
		];

		await c.env.DB.prepare(
			"INSERT INTO categoria (nombre, user_id) VALUES (?, ?), (?, ?), (?, ?)",
		)
			.bind(
				defaults[0].nombre,
				defaults[0].userId,
				defaults[1].nombre,
				defaults[1].userId,
				defaults[2].nombre,
				defaults[2].userId,
			)
			.run();

		const { results } = await c.env.DB.prepare(
			"SELECT id, nombre, user_id FROM categoria WHERE user_id = ? ORDER BY id DESC LIMIT 3",
		)
			.bind(session.user.id)
			.all();

		return c.json({ data: results });
	},
);

// ─── TAREAS ─────────────────────────────────────────────────────

app.openapi(
	createRoute({
		method: "get",
		path: "/tareas",
		tags: ["Tareas"],
		description: "Listar tareas del usuario con filtro opcional por estado",
		request: { query: listarTareasQuery },
		responses: {
			200: {
				content: {
					"application/json": {
						schema: dataResponse(
							z.array(tareaResponseSchema),
							"TareasResponse",
						),
					},
				},
				description: "Lista de tareas del usuario",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { estado } = c.req.valid("query");

		let query =
			"SELECT id, nombre, categoria_id as categoriaId, estado, created_at as createdAt, completed_at as completedAt FROM tarea WHERE user_id = ?";
		const params: (string | number)[] = [session.user.id];

		if (estado) {
			query += " AND estado = ?";
			params.push(estado);
		}

		query += " ORDER BY created_at DESC";

		const { results } = await c.env.DB.prepare(query)
			.bind(...params)
			.all<TareaResponse>();

		return c.json({ data: results });
	},
);

app.openapi(
	createRoute({
		method: "get",
		path: "/tareas/{id}",
		tags: ["Tareas"],
		description:
			"Obtener detalle de una tarea con sus pomodoros y estadísticas",
		request: { params: z.object({ id: idParamSchema }) },
		responses: {
			200: {
				content: {
					"application/json": {
						schema: dataResponse(
							tareaDetalleResponseSchema,
							"TareaDetalleResponse",
						),
					},
				},
				description: "Detalle de tarea con pomodoros y estadísticas",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
			404: {
				content: { "application/json": { schema: errorSchema } },
				description: "Tarea no encontrada",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { id } = c.req.valid("param");

		const tarea = await c.env.DB.prepare(
			"SELECT id, nombre, categoria_id as categoriaId, estado, created_at as createdAt, completed_at as completedAt FROM tarea WHERE id = ? AND user_id = ?",
		)
			.bind(id, session.user.id)
			.first<TareaResponse>();

		if (!tarea) return c.json({ error: "Tarea no encontrada" }, 404);

		const pomodoros = await c.env.DB.prepare(
			"SELECT id, status, minutes_planned as minutesPlanned, minutes_actual as minutesActual, created_at as createdAt FROM pomodoro WHERE tarea_id = ? ORDER BY created_at",
		)
			.bind(id)
			.all();

		const stats = await c.env.DB.prepare(
			"SELECT COUNT(*) as total, COALESCE(SUM(minutes_actual), 0) as totalTime FROM pomodoro WHERE tarea_id = ? AND status IN ('completed', 'completed_early')",
		)
			.bind(id)
			.first<StatsResponse>();

		return c.json({ data: { ...tarea, pomodoros: pomodoros.results, stats } });
	},
);

app.openapi(
	createRoute({
		method: "post",
		path: "/tareas",
		tags: ["Tareas"],
		description: "Crear una nueva tarea",
		request: {
			body: { content: { "application/json": { schema: crearTareaSchema } } },
		},
		responses: {
			201: {
				content: {
					"application/json": {
						schema: dataResponse(tareaResponseSchema, "TareaCreadaResponse"),
					},
				},
				description: "Tarea creada",
			},
			400: {
				content: { "application/json": { schema: errorSchema } },
				description: "Datos inválidos",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { nombre, categoriaId } = c.req.valid("json");

		const result = await c.env.DB.prepare(
			"INSERT INTO tarea (nombre, categoria_id, user_id, created_at) VALUES (?, ?, ?, ?)",
		)
			.bind(nombre, categoriaId || null, session.user.id, Date.now())
			.run();

		return c.json(
			{
				data: {
					id: result.meta.last_row_id,
					nombre,
					categoriaId: categoriaId ?? null,
					estado: "pending" as const,
					createdAt: Date.now(),
					completedAt: null,
				},
			},
			201,
		);
	},
);

app.openapi(
	createRoute({
		method: "patch",
		path: "/tareas/{id}",
		tags: ["Tareas"],
		description:
			"Actualizar parcialmente una tarea (nombre, categoría o estado)",
		request: {
			params: z.object({ id: idParamSchema }),
			body: {
				content: { "application/json": { schema: actualizarTareaSchema } },
			},
		},
		responses: {
			200: {
				content: { "application/json": { schema: successSchema } },
				description: "Tarea actualizada",
			},
			400: {
				content: { "application/json": { schema: errorSchema } },
				description: "Datos inválidos",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { id } = c.req.valid("param");
		const data = c.req.valid("json");

		const sets: string[] = [];
		const params: (string | number | null)[] = [];

		if (data.nombre !== undefined) {
			sets.push("nombre = ?");
			params.push(data.nombre);
		}
		if (data.categoriaId !== undefined) {
			sets.push("categoria_id = ?");
			params.push(data.categoriaId);
		}
		if (data.estado !== undefined) {
			sets.push("estado = ?");
			params.push(data.estado);
			if (data.estado === "done") {
				sets.push("completed_at = ?");
				params.push(Date.now());
			}
		}

		if (sets.length === 0)
			return c.json({ error: "Sin campos para actualizar" }, 400);

		params.push(id, session.user.id);

		await c.env.DB.prepare(
			`UPDATE tarea SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`,
		)
			.bind(...params)
			.run();

		return c.json({ success: true });
	},
);

app.openapi(
	createRoute({
		method: "delete",
		path: "/tareas/{id}",
		tags: ["Tareas"],
		description: "Eliminar una tarea y sus pomodoros asociados",
		request: { params: z.object({ id: idParamSchema }) },
		responses: {
			200: {
				content: { "application/json": { schema: successSchema } },
				description: "Tarea eliminada",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { id } = c.req.valid("param");

		await c.env.DB.prepare("DELETE FROM pomodoro WHERE tarea_id = ?")
			.bind(id)
			.run();
		await c.env.DB.prepare("DELETE FROM tarea WHERE id = ? AND user_id = ?")
			.bind(id, session.user.id)
			.run();

		return c.json({ success: true });
	},
);

// ─── POMODOROS ──────────────────────────────────────────────────

app.openapi(
	createRoute({
		method: "post",
		path: "/pomodoros",
		tags: ["Pomodoros"],
		description: "Registrar un pomodoro completado o interrumpido",
		request: {
			body: {
				content: { "application/json": { schema: crearPomodoroSchema } },
			},
		},
		responses: {
			201: {
				content: {
					"application/json": {
						schema: dataResponse(
							pomodoroResponseSchema,
							"PomodoroCreadoResponse",
						),
					},
				},
				description: "Pomodoro registrado",
			},
			400: {
				content: { "application/json": { schema: errorSchema } },
				description: "Datos inválidos",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { tareaId, status, minutesActual } = c.req.valid("json");

		const result = await c.env.DB.prepare(
			"INSERT INTO pomodoro (tarea_id, status, minutes_planned, minutes_actual, created_at) VALUES (?, ?, 25, ?, ?)",
		)
			.bind(tareaId, status, minutesActual || null, Date.now())
			.run();

		return c.json(
			{
				data: {
					id: result.meta.last_row_id,
					tareaId,
					status,
					minutesPlanned: 25,
					minutesActual: minutesActual ?? null,
					createdAt: Date.now(),
				},
			},
			201,
		);
	},
);

app.openapi(
	createRoute({
		method: "get",
		path: "/pomodoros",
		tags: ["Pomodoros"],
		description: "Listar pomodoros del día (opcionalmente filtrar por fecha)",
		request: { query: listarPomodorosQuery },
		responses: {
			200: {
				content: {
					"application/json": {
						schema: dataResponse(
							z.array(pomodoroResponseSchema),
							"PomodorosResponse",
						),
					},
				},
				description: "Pomodoros del día",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { fecha: fechaQuery } = c.req.valid("query");
		const fecha = fechaQuery || new Date().toISOString().split("T")[0];
		const inicioDelDia = new Date(fecha).getTime();
		const finDelDia = inicioDelDia + 86400000;

		const { results } = await c.env.DB.prepare(
			"SELECT p.id, p.tarea_id as tareaId, p.status, p.minutes_planned as minutesPlanned, p.minutes_actual as minutesActual, p.created_at as createdAt, t.nombre as tareaNombre FROM pomodoro p JOIN tarea t ON t.id = p.tarea_id WHERE t.user_id = ? AND p.created_at >= ? AND p.created_at < ? ORDER BY p.created_at DESC",
		)
			.bind(session.user.id, inicioDelDia, finDelDia)
			.all<PomodoroResponse>();

		return c.json({ data: results });
	},
);

app.openapi(
	createRoute({
		method: "get",
		path: "/pomodoros/stats",
		tags: ["Pomodoros"],
		description:
			"Obtener estadísticas de pomodoros del día (total y tiempo acumulado)",
		request: { query: statsQuery },
		responses: {
			200: {
				content: {
					"application/json": {
						schema: dataResponse(statsResponseSchema, "StatsResponse"),
					},
				},
				description: "Estadísticas de pomodoros del día",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { fecha: fechaQuery } = c.req.valid("query");
		const fecha = fechaQuery || new Date().toISOString().split("T")[0];
		const inicioDelDia = new Date(fecha).getTime();
		const finDelDia = inicioDelDia + 86400000;

		const stats = await c.env.DB.prepare(
			"SELECT COUNT(*) as total, COALESCE(SUM(minutes_actual), 0) as totalTime FROM pomodoro WHERE tarea_id IN (SELECT id FROM tarea WHERE user_id = ?) AND created_at >= ? AND created_at < ? AND status IN ('completed', 'completed_early')",
		)
			.bind(session.user.id, inicioDelDia, finDelDia)
			.first<StatsResponse>();

		return c.json({ data: stats });
	},
);

// ─── BREAKS ─────────────────────────────────────────────────────

app.openapi(
	createRoute({
		method: "post",
		path: "/breaks",
		tags: ["Descansos"],
		description: "Registrar un descanso completado o saltado",
		request: {
			body: { content: { "application/json": { schema: crearBreakSchema } } },
		},
		responses: {
			201: {
				content: {
					"application/json": {
						schema: dataResponse(breakResponseSchema, "BreakCreadoResponse"),
					},
				},
				description: "Break registrado",
			},
			400: {
				content: { "application/json": { schema: errorSchema } },
				description: "Datos inválidos",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { tipo, status, minutesActual } = c.req.valid("json");
		const minutesPlanned = tipo === "long" ? 15 : 5;

		const result = await c.env.DB.prepare(
			"INSERT INTO break (user_id, tipo, status, minutes_planned, minutes_actual, created_at) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind(
				session.user.id,
				tipo,
				status,
				minutesPlanned,
				minutesActual || null,
				Date.now(),
			)
			.run();

		return c.json(
			{
				data: {
					id: result.meta.last_row_id,
					tipo,
					status,
					minutesPlanned,
					minutesActual: minutesActual ?? null,
					createdAt: Date.now(),
					completedAt: null,
				},
			},
			201,
		);
	},
);

app.openapi(
	createRoute({
		method: "get",
		path: "/breaks",
		tags: ["Descansos"],
		description: "Listar descansos del día (opcionalmente filtrar por fecha)",
		request: { query: listarPomodorosQuery },
		responses: {
			200: {
				content: {
					"application/json": {
						schema: dataResponse(
							z.array(breakResponseSchema),
							"BreaksResponse",
						),
					},
				},
				description: "Breaks del día",
			},
			401: {
				content: { "application/json": { schema: errorSchema } },
				description: "No autenticado",
			},
		},
	}),
	async (c) => {
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		const { fecha: fechaQuery } = c.req.valid("query");
		const fecha = fechaQuery || new Date().toISOString().split("T")[0];
		const inicioDelDia = new Date(fecha).getTime();
		const finDelDia = inicioDelDia + 86400000;

		const { results } = await c.env.DB.prepare(
			"SELECT id, tipo, status, minutes_planned as minutesPlanned, minutes_actual as minutesActual, created_at as createdAt, completed_at as completedAt FROM break WHERE user_id = ? AND created_at >= ? AND created_at < ? ORDER BY created_at",
		)
			.bind(session.user.id, inicioDelDia, finDelDia)
			.all<BreakResponse>();

		return c.json({ data: results });
	},
);

// ─── OPENAPI DOC ────────────────────────────────────────────────

app.doc("/openapi", {
	openapi: "3.0.0",
	info: {
		title: "Tempo API",
		version: "1.0.0",
		description: "API de la aplicación Tempo Pomodoro",
	},
	servers: [
		{ url: "https://tempo.mgdc.site", description: "Producción" },
		{ url: "http://localhost:4321", description: "Local" },
	],
});

app.get("/docs", swaggerUI({ url: "/api/openapi" }));

// ─── BETTER AUTH ────────────────────────────────────────────────

app.all("*", async (c) => {
	const path = c.req.path;
	if (path.includes("/sign-in/email") || path.includes("/sign-up/email")) {
		const kv = c.env.LUCIA_KV;
		if (kv) {
			const ip = c.req.header("cf-connecting-ip") || "unknown";
			const allowed = await checkRateLimit(kv, ip);
			if (!allowed) {
				const lang = c.req.header("Accept-Language")?.startsWith("en")
					? "en"
					: "es";
				return c.json(
					{
						error:
							lang === "es"
								? "Demasiados intentos. Intente de nuevo en 5 minutos."
								: "Too many attempts. Please try again in 5 minutes.",
					},
					429,
				);
			}
		}
	}

	const turnstileToken = c.req.header("x-turnstile-token");
	const authInstance = auth(c.env.DB, c.env.LUCIA_KV, c.env);

	let requestHandler = c.req.raw;
	if (turnstileToken) {
		const headers = new Headers(c.req.raw.headers);
		if (!headers.has("x-turnstile-token")) {
			headers.set("x-turnstile-token", turnstileToken);
		}
		requestHandler = new Request(c.req.raw, { headers });
	}

	return authInstance.handler(requestHandler);
});

export const onRequest = handle(app);
