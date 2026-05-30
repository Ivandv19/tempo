import { z } from "@hono/zod-openapi";
import {
	ESTADOS_BREAK,
	ESTADOS_POMODORO,
	ESTADOS_TAREA,
	TIPOS_BREAK,
} from "./constants";

// ─── Auth ────────────────────────────────────────────────

export const signupSchema = z
	.object({
		email: z.string().email("Email inválido"),
		password: z
			.string()
			.min(8, "Mínimo 8 caracteres")
			.regex(/[A-Z]/, "Debe contener mayúsculas")
			.regex(/[a-z]/, "Debe contener minúsculas")
			.regex(/[0-9]/, "Debe contener al menos un número"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Las contraseñas no coinciden",
		path: ["confirmPassword"],
	});

export const loginSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(1, "Contraseña requerida"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ─── Compartidos ──────────────────────────────────────────

export const idParamSchema = z.coerce
	.number()
	.int()
	.positive("ID inválido")
	.openapi({ description: "ID numérico" });

// ─── Request Body ─────────────────────────────────────────

export const crearTareaSchema = z.object({
	nombre: z
		.string()
		.min(1, "El nombre es requerido")
		.max(100)
		.openapi({ description: "Nombre de la tarea" }),
	categoriaId: z
		.number()
		.int()
		.positive()
		.openapi({ description: "ID de la categoría" })
		.optional(),
});

export const actualizarTareaSchema = z.object({
	nombre: z
		.string()
		.min(1, "El nombre debe tener al menos 1 caracter")
		.max(100)
		.openapi({ description: "Nombre de la tarea" })
		.optional(),
	categoriaId: z
		.number()
		.int()
		.positive()
		.openapi({ description: "ID de la categoría" })
		.optional(),
	estado: z
		.enum(ESTADOS_TAREA)
		.openapi({ description: "Estado de la tarea" })
		.optional(),
});

export const crearPomodoroSchema = z.object({
	tareaId: z
		.number()
		.int()
		.positive("Debe seleccionar una tarea")
		.openapi({ description: "ID de la tarea" }),
	status: z
		.enum(ESTADOS_POMODORO)
		.openapi({ description: "Estado del pomodoro" }),
	minutesActual: z
		.number()
		.int()
		.min(0)
		.max(25)
		.openapi({ description: "Minutos reales trabajados" })
		.optional(),
});

export const crearBreakSchema = z.object({
	tipo: z.enum(TIPOS_BREAK).openapi({ description: "Tipo de descanso" }),
	status: z.enum(ESTADOS_BREAK).openapi({ description: "Estado del descanso" }),
	minutesActual: z
		.number()
		.int()
		.min(0)
		.openapi({ description: "Minutos reales de descanso" })
		.optional(),
});

// ─── Query Params ─────────────────────────────────────────

export const listarTareasQuery = z.object({
	estado: z
		.enum(ESTADOS_TAREA)
		.openapi({ description: "Filtrar por estado" })
		.optional(),
	fecha: z
		.string()
		.openapi({ description: "Fecha en formato YYYY-MM-DD" })
		.optional(),
});

export const listarPomodorosQuery = z.object({
	fecha: z
		.string()
		.openapi({ description: "Fecha en formato YYYY-MM-DD" })
		.optional(),
});

export const statsQuery = z.object({
	fecha: z
		.string()
		.openapi({ description: "Fecha en formato YYYY-MM-DD" })
		.optional(),
});

// ─── Response ─────────────────────────────────────────────

export const categoriaResponse = z
	.object({
		id: z.number().openapi({ description: "ID de la categoría" }),
		nombre: z.string().openapi({ description: "Nombre de la categoría" }),
	})
	.openapi("CategoriaResponse");

export const tareaResponse = z
	.object({
		id: z.number().openapi({ description: "ID de la tarea" }),
		nombre: z.string().openapi({ description: "Nombre de la tarea" }),
		categoriaId: z
			.number()
			.openapi({ description: "ID de la categoría" })
			.nullable(),
		estado: z
			.enum(ESTADOS_TAREA)
			.openapi({ description: "Estado de la tarea" }),
		createdAt: z.number().openapi({ description: "Timestamp de creación" }),
		completedAt: z
			.number()
			.openapi({ description: "Timestamp de finalización" })
			.nullable(),
	})
	.openapi("TareaResponse");

export const tareaDetalleResponse = tareaResponse
	.extend({
		pomodoros: z
			.array(
				z.object({
					id: z.number().openapi({ description: "ID del pomodoro" }),
					status: z
						.enum(ESTADOS_POMODORO)
						.openapi({ description: "Estado del pomodoro" }),
					minutesPlanned: z
						.number()
						.openapi({ description: "Minutos planificados" }),
					minutesActual: z
						.number()
						.openapi({ description: "Minutos reales trabajados" })
						.nullable(),
					createdAt: z
						.number()
						.openapi({ description: "Timestamp de creación" }),
				}),
			)
			.openapi({ description: "Pomodoros asociados a la tarea" }),
		stats: z
			.object({
				total: z
					.number()
					.openapi({ description: "Total de pomodoros completados" }),
				totalTime: z
					.number()
					.openapi({ description: "Tiempo total en minutos" }),
			})
			.openapi({ description: "Estadísticas de pomodoros" }),
	})
	.openapi("TareaDetalleResponse");

export const pomodoroResponse = z
	.object({
		id: z.number().openapi({ description: "ID del pomodoro" }),
		tareaId: z.number().openapi({ description: "ID de la tarea" }),
		status: z
			.enum(ESTADOS_POMODORO)
			.openapi({ description: "Estado del pomodoro" }),
		minutesPlanned: z.number().openapi({ description: "Minutos planificados" }),
		minutesActual: z
			.number()
			.openapi({ description: "Minutos reales trabajados" })
			.nullable(),
		createdAt: z.number().openapi({ description: "Timestamp de creación" }),
		tareaNombre: z
			.string()
			.openapi({ description: "Nombre de la tarea (join)" })
			.optional(),
	})
	.openapi("PomodoroResponse");

export const statsResponse = z
	.object({
		total: z
			.number()
			.openapi({ description: "Total de pomodoros completados" }),
		totalTime: z.number().openapi({ description: "Tiempo total en minutos" }),
	})
	.openapi("StatsResponse");

export const breakResponse = z
	.object({
		id: z.number().openapi({ description: "ID del descanso" }),
		tipo: z.enum(TIPOS_BREAK).openapi({ description: "Tipo de descanso" }),
		status: z
			.enum(ESTADOS_BREAK)
			.openapi({ description: "Estado del descanso" }),
		minutesPlanned: z.number().openapi({ description: "Minutos planificados" }),
		minutesActual: z
			.number()
			.openapi({ description: "Minutos reales de descanso" })
			.nullable(),
		createdAt: z.number().openapi({ description: "Timestamp de creación" }),
		completedAt: z
			.number()
			.openapi({ description: "Timestamp de finalización" })
			.nullable(),
	})
	.openapi("BreakResponse");

// ─── Tipos Inferidos ─────────────────────────────────────

export type CrearTareaInput = z.infer<typeof crearTareaSchema>;
export type ActualizarTareaInput = z.infer<typeof actualizarTareaSchema>;
export type CrearPomodoroInput = z.infer<typeof crearPomodoroSchema>;
export type CrearBreakInput = z.infer<typeof crearBreakSchema>;

export type CategoriaResponse = z.infer<typeof categoriaResponse>;
export type TareaResponse = z.infer<typeof tareaResponse>;
export type TareaDetalleResponse = z.infer<typeof tareaDetalleResponse>;
export type PomodoroResponse = z.infer<typeof pomodoroResponse>;
export type StatsResponse = z.infer<typeof statsResponse>;
export type BreakResponse = z.infer<typeof breakResponse>;
