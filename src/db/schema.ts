import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Better Auth ───────────────────────────────────────────

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name"),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
	image: text("image"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId")
		.notNull()
		.references(() => user.id),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
	refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", { mode: "timestamp" }),
	updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ─── App ───────────────────────────────────────────────────

export const categoria = sqliteTable("categoria", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	nombre: text("nombre").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
});

export const tarea = sqliteTable("tarea", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	nombre: text("nombre").notNull(),
	categoriaId: integer("categoria_id").references(() => categoria.id),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	estado: text("estado", { enum: ["pending", "in_progress", "done", "abandoned"] })
		.notNull()
		.default("pending"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const pomodoro = sqliteTable("pomodoro", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	tareaId: integer("tarea_id")
		.notNull()
		.references(() => tarea.id),
	status: text("status", { enum: ["active", "completed", "completed_early", "interrupted"] }).notNull(),
	minutesPlanned: integer("minutes_planned").notNull().default(25),
	minutesActual: integer("minutes_actual"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── Relations ──────────────────────────────────────────────

export const categoriaRelations = relations(categoria, ({ one, many }) => ({
	user: one(user, {
		fields: [categoria.userId],
		references: [user.id],
	}),
	tareas: many(tarea),
}));

export const tareaRelations = relations(tarea, ({ one, many }) => ({
	categoria: one(categoria, {
		fields: [tarea.categoriaId],
		references: [categoria.id],
	}),
	user: one(user, {
		fields: [tarea.userId],
		references: [user.id],
	}),
	pomodoros: many(pomodoro),
}));

export const pomodoroRelations = relations(pomodoro, ({ one }) => ({
	tarea: one(tarea, {
		fields: [pomodoro.tareaId],
		references: [tarea.id],
	}),
}));

export const break_ = sqliteTable("break", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	tipo: text("tipo", { enum: ["short", "long"] }).notNull(),
	status: text("status", { enum: ["active", "completed", "skipped", "interrupted"] }).notNull(),
	minutesPlanned: integer("minutes_planned").notNull(),
	minutesActual: integer("minutes_actual"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	completedAt: integer("completed_at", { mode: "timestamp" }),
});
