export const ESTADOS_TAREA = [
	"pending",
	"in_progress",
	"done",
	"abandoned",
] as const;

export const ESTADOS_POMODORO = [
	"active",
	"completed",
	"completed_early",
	"interrupted",
] as const;

export const TIPOS_BREAK = ["short", "long"] as const;

export const ESTADOS_BREAK = [
	"active",
	"completed",
	"skipped",
	"interrupted",
] as const;

export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export type EstadoPomodoro = (typeof ESTADOS_POMODORO)[number];
export type BreakTipo = (typeof TIPOS_BREAK)[number];
export type EstadoBreak = (typeof ESTADOS_BREAK)[number];
