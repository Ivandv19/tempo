# Tempo (Temporizador de Productividad)

## Descripción

Aplicación web moderna diseñada para ayudarte a gestionar tu tiempo de estudio o trabajo utilizando la técnica Pomodoro. El objetivo es maximizar tu productividad dividiendo el tiempo en bloques de enfoque total seguidos de breves descansos, todo dentro de una interfaz limpia y rápida.

## Características

- **Técnica Pomodoro basada en tareas**: Selecciona una tarea antes de empezar. Cada pomodoro de 25 minutos está vinculado a una tarea específica.
- **Datos de sesión guardados**: Si interrumpes un pomodoro, el tiempo restante se guarda. Puedes retomarlo después desde donde lo dejaste.
- **Estadísticas semanales y diarias**: Visualiza tu progreso con gráficos de barras y líneas de promedio.
- **Soporte para usuarios invitados y registrados**: Los invitados guardan datos en localStorage; los usuarios registrados persisten en D1 via API.
- **Modo oscuro/claro**: Tema nord (claro) y business (oscuro) con DaisyUI.
- **Internacionalización**: Español e inglés completos.

## Secciones

1. **Selector de Tareas**: Crea tareas con categorías (Trabajo, Estudio, Personal) y selecciona una para empezar un pomodoro.
2. **Temporizador**: Cuenta regresiva de 25 minutos con círculo SVG de progreso. Botones de pausa, continuar y cancelar con confirmación.
3. **Estadísticas**: Resumen diario con timeline de actividad y gráfico semanal de barras con promedio.

## Uso

- **Visualizar Contenido**: La aplicación ya está activa y puedes usarla para concentrarte aquí: [Tempo](https://tempo.mgdc.site/).
- **Configurar y Arrancar**: Elige cuánto tiempo vas a trabajar y dale al botón de inicio; la app se encarga de organizar los descansos automáticamente.
- **Alternar Idiomas**: Puedes cambiar entre español e inglés de forma sencilla para que la interfaz se adapte a tu preferencia.

## Tecnologías Utilizadas

- **Frontend**: Astro 6, React 19, Tailwind CSS 4, DaisyUI 5
- **Backend**: Cloudflare Pages Functions (Hono), D1 (SQLite via Drizzle ORM), KV (Better Auth sessions)
- **Auth**: Better Auth (external Argon2id hash service), Cloudflare Turnstile CAPTCHA
- **State**: Zustand 5 (stores duales: API para usuarios logueados, localStorage para invitados)
- **Validación**: Zod 3
- **Iconos**: Lucide (via @iconify/react + astro-icon)
- **Herramientas**: Bun 1.3.9, Biome 2.4.16, Vitest 4
- **Infra**: Cloudflare Pages, D1, KV, R2

## Instalación

1. **Clonar el Repositorio**: Descarga el código de este proyecto en tu máquina usando Git.

```bash
git clone https://github.com/Ivandv19/tempo.git
```

2. **Instalar Dependencias**: Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
bun install
```

3. **Variables de Entorno**: Crea un archivo `.env` o `.dev.vars` en la raíz con las siguientes variables:

```env
BETTER_AUTH_URL=http://localhost:4321
BETTER_AUTH_SECRET=tu_secreto_aqui
PUBLIC_TURNSTILE_SITE_KEY=tu_site_key
TURNSTILE_SECRET_KEY=tu_secret_key
HASH_SERVICE_URL=http://localhost:3010
HASH_SERVICE_API_KEY=tu_api_key
```

4. **Iniciar el Proyecto**:

```bash
# Solo frontend (sin API):
bun run dev

# Full stack con API (Cloudflare Functions):
bun run dev:full
```

## Despliegue

La aplicación está construida para ser sumamente ligera y se encuentra desplegada de forma global a través de Cloudflare Pages. Puedes usarla directamente aquí: [tempo.mgdc.site](https://tempo.mgdc.site/)

## Licencia

Licencia de Uso Personal:

Este software es propiedad de **Ivan Cruz**. Se permite el uso de este software solo para fines personales y no comerciales. No se permite la distribución, modificación ni uso comercial de este software sin el consentimiento expreso de **Ivan Cruz**.

Cualquier uso no autorizado puede resultar en acciones legales.
