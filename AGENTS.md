# AGENTS.md — Sinx Pomodoro v2

## Descripción del Proyecto

Aplicación web de productividad basada en la técnica Pomodoro. Permite configurar ciclos de enfoque/descanso, llevar un historial de sesiones y sincronizar datos con la nube al iniciar sesión. Interfaz en español e inglés.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Astro 6 (static output) |
| UI | React 19 + Tailwind CSS 4 + DaisyUI 5 |
| Backend API | Hono (Cloudflare Pages Functions) |
| Auth | Better Auth (email/password + Turnstile CAPTCHA) |
| DB | Cloudflare D1 (SQLite) + Drizzle ORM |
| Cache/Sesiones | Cloudflare KV |
| Runtime | Bun 1.3 |
| Deploy | Cloudflare Pages (Wrangler) |
| Lint/Format | Biome 2 |
| Tests | Vitest + jsdom + @testing-library/react |
| i18n | Astro i18n (es default, en) |

## Estructura del Código

```
src/
├── components/        # Componentes React (.tsx) y Astro (.astro)
│   ├── PomodoroManager.tsx   # Orquestador principal del timer
│   ├── TimerSetup.tsx        # Configuración de sesión
│   ├── TimerRun.tsx          # Timer en ejecución
│   ├── HeroSection.tsx       # Hero dinámico
│   ├── DailySummary.tsx      # Resumen diario de stats
│   ├── WeeklySummary.tsx     # Resumen semanal de stats
│   ├── Auth/AuthForm.tsx     # Formulario login/signup
│   └── AuthButton.tsx        # Botón de auth en header
├── hooks/             # Custom React hooks
│   ├── useTimerLogic.ts       # Lógica del temporizador y schedule
│   ├── useTimerState.ts       # Estado del timer con persistencia
│   ├── useTimerPersistence.ts # LocalStorage sync del timer
│   └── usePomodoroStats.ts    # Historial y estadísticas
├── lib/
│   ├── auth.ts           # Config server de Better Auth (con cache de instancias)
│   ├── auth-client.ts    # Cliente Better Auth para browser
│   └── auth-wrapper.ts   # Wrapper para auth en SSR
├── db/
│   ├── schema.ts         # Drizzle schema (user, session, account, verification, pomodoro_log)
│   ├── schema.sql        # SQL raw del schema
│   └── migrations_better_auth.sql
├── i18n/
│   ├── ui.ts             # Diccionarios es/en
│   └── utils.ts          # Helper getLang()
├── layouts/
│   └── Layout.astro      # Layout principal
├── pages/
│   ├── index.astro       # Home (es)
│   ├── en/               # Rutas en inglés
│   ├── login/            # Página de login
│   ├── blog.astro        # Blog (placeholder)
│   ├── about.astro       # About
│   └── 404.astro         # Página 404
├── styles/
│   └── global.css        # Estilos globales + Tailwind
└── test/
    └── setup.ts          # Setup de testing

functions/
├── api/[[route]].ts      # API Hono (auth + pomodoros CRUD)
└── _middleware.ts         # Security headers middleware
```

## Comandos Disponibles

| Comando | Descripción |
|---|---|
| `bun run dev` | Servidor de desarrollo (port 4321) |
| `bun run build` | Build de producción |
| `bun run preview` | Preview del build |
| `bun run lint` | Biome lint (auto-fix) |
| `bun run format` | Biome format (auto-fix) |
| `bun run test` | Vitest (run mode) |

## Convenciones de Código

- **Indentación**: Tabs (configurado en Biome)
- **Comillas**: Dobles (`"`) en JS/TS
- **Imports**: Organizados automáticamente por Biome
- **Componentes React**: Usar `@jsxImportSource react` al inicio del archivo
- **Tipado**: TypeScript estricto (extends `astro/tsconfigs/strict`)
- **Estilos**: Tailwind CSS 4 utility classes + DaisyUI components
- **Nombres**: camelCase para hooks/utils, PascalCase para componentes

## Base de Datos

Tablas principales:
- `user` — Usuarios registrados
- `session` — Sesiones activas (Better Auth)
- `account` — Cuentas por proveedor (Better Auth)
- `verification` — Tokens de verificación
- `pomodoro_log` — Historial de sesiones (type: focus/short/long, minutes, created_at)

## Autenticación

- Email/password con hashing externo (microservicio)
- CAPTCHA con Cloudflare Turnstile en sign-in/sign-up
- Rate limiting via KV (20 intentos / 5 min por IP)
- Cache de instancias auth con evicción LRU (max 10)
- Secondary storage en KV para sesiones

## Variables de Entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a la DB |
| `BETTER_AUTH_SECRET` | Secret para Better Auth |
| `BETTER_AUTH_URL` | URL base del sitio |
| `TURNSTILE_SECRET_KEY` | Secret de Cloudflare Turnstile |
| `HASH_SERVICE_URL` | URL del microservicio de hashing |
| `HASH_SERVICE_API_KEY` | API key del microservicio |

## Hooks del Timer (Arquitectura)

El sistema de timer usa 4 hooks separados:

1. **useTimerLogic** — Genera el schedule (focus 25min + breaks), maneja el tick, notificaciones y audio
2. **useTimerState** — Estado reactivo (timeLeft, isActive, sessionEndTime) con soporte de restore
3. **useTimerPersistence** — Sincroniza estado con localStorage, soporta Page Visibility API
4. **usePomodoroStats** — Historial local (7 días) + sync con API cloud para usuarios logueados

## Reglas para el Agente

1. Siempre correr `bun run lint` y `bun run test` después de cambios
2. No alterar el schema de DB sin confirmar
3. Respetar la separación de hooks (lógica vs estado vs persistencia)
4. Mantener i18n consistente (agregar claves en es Y en)
5. Usar Biome para formato, no Prettier
6. No usar emojis en commits ni código (salvo que el usuario lo pida)
7. Seguir la convención de tabs + comillas dobles de Biome
