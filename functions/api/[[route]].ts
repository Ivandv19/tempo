import type { KVNamespace, D1Database } from "@cloudflare/workers-types";
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { auth } from '../../src/lib/auth';

type Bindings = {
    DB: D1Database;
    LUCIA_KV: KVNamespace;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    TURNSTILE_SECRET_KEY: string;
    HASH_SERVICE_URL: string;
    HASH_SERVICE_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

/*
// Manejador global de errores para capturar detalles en producción
app.onError((err, c) => {
    console.error(`❌ Error en API [${c.req.method}] ${c.req.path}:`, err);
    return c.json({
        error: "Error interno del servidor",
        message: err.message,
        stack: c.env.BETTER_AUTH_URL?.includes('localhost') ? err.stack : undefined // Solo mostrar stack en dev o si es local
    }, 500);
});
*/

/*
// Middleware de depuración para ver qué bindings llegan
app.use('*', async (c, next) => {
    console.log(`[${new Date().toISOString()}] Request: ${c.req.method} ${c.req.path}`);
    if (!c.env.DB) console.error("⚠️ DB binding no detectado");
    if (!c.env.LUCIA_KV) console.error("⚠️ KV binding no detectado");
    if (!c.env.BETTER_AUTH_SECRET) console.error("⚠️ BETTER_AUTH_SECRET no detectado");
    await next();
});
*/

// Helper para rate limiting usando KV
// Límite predeterminado: 20 intentos por 5 minutos
const checkRateLimit = async (kv: KVNamespace, ip: string, maxAttempts = 20, windowMinutes = 5) => {
    const key = `rate-limit:login:${ip}`;
    const now = Date.now();

    // Obtener estado actual
    const data = await kv.get<{ attempts: number, resetAt: number }>(key, 'json');

    // Si no existe o expiró, resetear
    if (!data || now > data.resetAt) {
        await kv.put(key, JSON.stringify({
            attempts: 1,
            resetAt: now + (windowMinutes * 60 * 1000)
        }), { expirationTtl: windowMinutes * 60 });
        return true; // Permitido
    }

    // Si excedió intentos
    if (data.attempts >= maxAttempts) {
        return false; // Bloqueado
    }

    // Incrementar intentos
    await kv.put(key, JSON.stringify({
        attempts: data.attempts + 1,
        resetAt: data.resetAt
    }), { expirationTtl: Math.ceil((data.resetAt - now) / 1000) });

    return true; // Permitido
};

// Helper para obtener la sesión actual
const getSession = async (c: { env: Bindings; req: { raw: { headers: Headers } } }) => {
    return await auth(c.env.DB, c.env.LUCIA_KV, c.env).api.getSession({
        headers: c.req.raw.headers
    });
};

// --- ENDPOINTS ESPECÍFICOS DE POMODORO ---
// Deben ir ANTES del catch-all (*) para no ser interceptados por Better Auth

app.post('/pomodoros', async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { type, minutes, createdAt } = body;

    await c.env.DB.prepare(
        "INSERT INTO pomodoro_log (user_id, type, minutes, created_at) VALUES (?, ?, ?, ?)"
    ).bind(session.user.id, type, minutes, createdAt).run();

    return c.json({ success: true });
});

app.get('/pomodoros', async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const { results } = await c.env.DB.prepare(
        "SELECT id, type, minutes, created_at as createdAt FROM pomodoro_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    ).bind(session.user.id).all();

    return c.json(results.map((row: Record<string, unknown>) => ({
        ...row,
        startTime: new Date(row.createdAt - (row.minutes * 60000)).toISOString(),
        endTime: new Date(row.createdAt).toISOString()
    })));
});

// --- MANEJADOR DE AUTENTICACIÓN (Better Auth) ---
// Actúa como un catch-all para todas las rutas de /api/auth/*

app.all("*", async (c) => {
    // Manejar rate limiting para endpoints de autenticación sensibles
    if (c.req.path.includes("/sign-in/email") || c.req.path.includes("/sign-up/email")) {
        const kv = c.env.LUCIA_KV;
        if (kv) {
            const ip = c.req.header('cf-connecting-ip') || 'unknown';
            const allowed = await checkRateLimit(kv, ip);

            if (!allowed) {
                return c.json({
                    error: "Demasiados intentos. Por favor intente de nuevo en 5 minutos."
                }, 429);
            }
        }
    }

    // Extraer token de Turnstile de los headers si existe
    const turnstileToken = c.req.header('x-turnstile-token');

    // Pasar token y contexto a auth
    const authInstance = auth(c.env.DB, c.env.LUCIA_KV, c.env);

    // Si hay token, agregarlo al request para que los hooks lo vean
    let requestHandler = c.req.raw;
    if (turnstileToken) {
        // Clonamos el request e inyectamos el header si no está (doble seguridad)
        const headers = new Headers(c.req.raw.headers);
        if (!headers.has('x-turnstile-token')) {
            headers.set('x-turnstile-token', turnstileToken);
        }
        requestHandler = new Request(c.req.raw, { headers });
    }

    return authInstance.handler(requestHandler);
});

export const onRequest = handle(app);
