-- Full Schema Reference (matches src/db/schema.ts)

-- Better Auth Tables (no tocar)
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL,
    image TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id),
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope TEXT,
    password TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER,
    updatedAt INTEGER
);

-- App Tables
CREATE TABLE IF NOT EXISTS categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS tarea (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria_id INTEGER REFERENCES categoria(id),
    user_id TEXT NOT NULL REFERENCES user(id),
    estado TEXT NOT NULL DEFAULT 'pending' CHECK(estado IN ('pending', 'in_progress', 'done', 'abandoned')),
    created_at INTEGER NOT NULL,
    completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS pomodoro (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarea_id INTEGER NOT NULL REFERENCES tarea(id),
    status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'completed_early', 'interrupted')),
    minutes_planned INTEGER NOT NULL DEFAULT 25,
    minutes_actual INTEGER,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS break (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES user(id),
    tipo TEXT NOT NULL CHECK(tipo IN ('short', 'long')),
    status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'skipped', 'interrupted')),
    minutes_planned INTEGER NOT NULL,
    minutes_actual INTEGER,
    created_at INTEGER NOT NULL,
    completed_at INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tarea_estado ON tarea(estado);
CREATE INDEX IF NOT EXISTS idx_tarea_usuario_fecha ON tarea(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pomodoro_status ON pomodoro(status);
CREATE INDEX IF NOT EXISTS idx_pomodoro_tarea_fecha ON pomodoro(tarea_id, created_at);
CREATE INDEX IF NOT EXISTS idx_break_user_id ON break(user_id);
CREATE INDEX IF NOT EXISTS idx_break_created_at ON break(created_at);
CREATE INDEX IF NOT EXISTS idx_categoria_user_id ON categoria(user_id);
