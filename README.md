# Sinx Pomodoro (Temporizador de Productividad) ⏱️

## Descripción

Esta es una aplicación web moderna diseñada para ayudarte a gestionar tu tiempo de estudio o trabajo utilizando la técnica Pomodoro. El objetivo es maximizar tu productividad dividiendo el tiempo en bloques de enfoque total seguidos de breves descansos, todo dentro de una interfaz limpia y rápida.

## Características

- **Técnica Pomodoro Estándar**: Ciclos automatizados de 25 minutos de trabajo intenso seguidos de descansos cortos (5 min) y largos (15 min).
- **Personalización Flexible**: Permite elegir la duración total de tu sesión de trabajo de acuerdo a tus necesidades del día.
- **Progreso Visual**: Temporizador interactivo con un diseño circular que indica claramente cuánto tiempo falta para el siguiente descanso.
- **Alertas y Notificaciones**: Notificaciones del navegador y sonidos motivacionales que te avisan exactamente cuándo terminar cada bloque.
- **Historial de Foco**: Registro diario de tus sesiones completadas para que puedas medir tu constancia.

## Secciones

1. **Temporizador Principal**: El núcleo de la app, donde ocurre la cuenta regresiva y se visualiza el progreso del ciclo actual.
2. **Configuración de Sesión**: Panel lateral o inicial donde ajustas el tiempo total que planeas dedicar a tu tarea.
3. **Historial y Estadísticas**: Apartado dedicado a mostrar el resumen de las sesiones de enfoque logradas durante el día.

## Uso

- **Visualizar Contenido**: La aplicación ya está activa y puedes usarla para concentrarte aquí: [Sinx Pomodoro](https://sinx-pomodoro.mgdc.site/).
- **Configurar y Arrancar**: Elige cuánto tiempo vas a trabajar y dale al botón de inicio; la app se encarga de organizar los descansos automáticamente.
- **Alternar Idiomas**: Puedes cambiar entre español e inglés de forma sencilla para que la interfaz se adapte a tu preferencia.

## Tecnologías Utilizadas

- HTML / CSS / TypeScript
- Astro 5
- React 19
- Tailwind CSS 4
- Hono
- Drizzle ORM
- Bun

## Instalación

1. **Clonar el Repositorio**: Descarga el código de este proyecto en tu máquina usando Git.

```bash
git clone https://github.com/Ivandv19/sinx-pomodoro-v2.git
```

2. **Instalar Dependencias**: Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
bun install
```

3. **Variables Prácticas**: Crea un archivo `.env` o `.dev.vars` en la raíz. Necesitarás configurar `DATABASE_URL` para la persistencia del historial y las claves de seguridad necesarias para el funcionamiento del sistema.

4. **Iniciar el Proyecto**: Borra las distracciones y enciende el temporizador localmente con:

```bash
bun run dev
```

## Créditos

Este proyecto es parte de las herramientas de productividad personal de mi ecosistema.

- Desarrollado por Ivan Cruz.

## Despliegue

La aplicación está construida para ser sumamente ligera y se encuentra desplegada de forma global a través de Cloudflare Pages. Puedes usarla directamente aquí: [sinx-pomodoro.mgdc.site](https://sinx-pomodoro.mgdc.site/)

## Licencia

Licencia de Uso Personal:

Este software es propiedad de **Ivan Cruz**. Se permite el uso de este software solo para fines personales y no comerciales. No se permite la distribución, modificación ni uso comercial de este software sin el consentimiento expreso de **Ivan Cruz**.

Cualquier uso no autorizado puede resultar en acciones legales.
