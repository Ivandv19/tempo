// 1. Definimos los idiomas
export const languages = {
	es: "Español",
	en: "English",
};

export const defaultLang = "es";

// 2. Aquí van tus textos (Clave : Traducción)
export const ui = {
	es: {
		"nav.home": "Inicio",
		"nav.about": "Acerca de",
		"nav.blog": "Blog",
		"nav.login": "Entrar",
		"nav.logout": "Salir",
		"nav.language": "Idioma",
		"nav.theme": "Tema",

		// Hero
		"hero.title": "Domina tu tiempo",
		"hero.subtitle":
			"Ya sea que estés, estudiando o creando, el método Pomodoro es tu mejor aliado.",
		"hero.subtitle.part2": "el método Pomodoro es tu mejor aliado.",
		"hero.span.coding": "programando",
		"hero.span.studying": "estudiando",
		"hero.span.creating": "creando",
		"hero.or": "o",
		"hero.focus.title": "Máxima Concentración",
		"hero.focus.subtitle": "El mundo puede esperar.",

		// Timer
		"timer.focus": "Enfoque",
		"timer.short": "Descanso",
		"timer.long": "Descanso",
		"timer.active_focus": "Enfoque Activo",
		"timer.focusing": "Enfocándote",
		"timer.paused": "Pausado",
		"timer.setup.title": "Configura tu Ciclo",
		"timer.setup.subtitle": "Elige los minutos de enfoque:",
		"timer.setup.btn.start": "Empezar a concentrarme",
		"timer.setup.btn.start.disabled": "Selecciona un tiempo...",
		"timer.run.pause": "⏸ Pausar",
		"timer.run.resume": "▶ Continuar",
		"timer.run.new": "Nuevo Plan ↺",
		"timer.run.cancel": "Cancelar tarea",
		"timer.run.current": "Bloque Actual",
		"timer.run.agenda": "Agenda de Hoy",
		"timer.run.start": "Inicio:",
		"timer.run.end": "Fin Aprox:",
		"timer.run.finished": "Terminado",

		// Timer Setup (Specific)
		"timer.setup.cycles": "ciclos",
		"timer.setup.summary": "Resumen del Plan",
		"timer.setup.break": "Descanso",

		// Break
		"break.short_label": "Descanso corto",
		"break.long_label": "Descanso largo",
		"break.title": "Tómate un respiro",
		"break.resting": "Descansando",
		"break.skip": "Saltar descanso",
		"break.done_title": "¡Descanso terminado!",
		"break.done_desc": "Es momento de volver al trabajo.",
		"break.continue": "Volver al inicio",
		"timer.setup.finish": "Fin",
		"stats.progress.title": "Tu Progreso de Hoy",
		"stats.realTime": "Tiempo de Enfoque Real",
		"stats.completedSessions": "sesiones completadas",
		"stats.log.title": "Log de Actividad",
		"stats.log.empty": "Tu historial está vacío hoy. ¡A darle!",

		// Tasks
		"task.selector.title": "¿En qué vas a trabajar?",
		"task.selector.placeholder": "Nueva tarea...",
		"task.selector.create": "Crear y empezar",
		"task.selector.empty": "No hay tareas pendientes",
		"task.selector.category": "Categoría",
		"task.selector.subtitle":
			"Configura tu próxima tarea antes de iniciar el temporizador.",
		"task.selector.pending": "Tareas pendientes",
		"task.tooltip.start": "Iniciar enfoque",
		"task.tooltip.complete": "Marcar como completada",
		"task.tooltip.delete": "Eliminar tarea",
		"task.status.pending": "Pendiente",
		"task.status.in_progress": "En progreso",
		"task.status.done": "Completada",
		"task.status.abandoned": "Abandonada",
		"task.complete.prompt": "¿Terminaste la tarea?",
		"task.complete.yes": "Sí, completada",
		"task.complete.no": "Todavía no",
		"task.interrupt.title": "Sesión interrumpida",
		"task.interrupt.continue": "Continuar",
		"task.interrupt.abandon": "Abandonar tarea",
		"task.remaining": "{minutes}m restantes",
		"timer.cancel.confirm.title": "¿Cancelar tarea?",
		"timer.cancel.confirm.body": "La tarea se eliminará permanentemente.",
		"timer.cancel.confirm.yes": "Sí, eliminar",
		"timer.cancel.confirm.no": "No, volver",

		// Stats
		"stats.today": "Hoy",
		"stats.focus": "Foco",
		"stats.hours": "Horas",
		"stats.minutes": "Mins",
		"stats.sessions": "Sesiones",
		"stats.weekly.title": "Resumen Semanal",
		"stats.weekly.average": "Promedio: {minutes}m",
		"stats.session.singular": "sesión",
		"stats.session.plural": "sesiones",

		// Footer
		"footer.whatis": "¿Qué es Pomodoro?",
		"footer.slogan":
			"Herramienta de productividad. Sin distracciones, solo enfoque.",
		"footer.developed": "Desarrollado por",
		"footer.rights": "Todos los derechos reservados",

		// Auth
		"auth.login.title": "Iniciar Sesión",
		"auth.signup.title": "Crear Cuenta",
		"auth.login.subtitle": "¿No tienes cuenta?",
		"auth.signup.subtitle": "¿Ya tienes cuenta?",
		"auth.btn.login": "Entrar",
		"auth.btn.signup": "Registrarse",
		"auth.btn.toggle.login": "Inicia Sesión",
		"auth.btn.toggle.signup": "Regístrate",
		"auth.email.label": "Correo Electrónico",
		"auth.email.placeholder": "ejemplo@correo.com",
		"auth.password.label": "Contraseña",
		"auth.password.placeholder": "••••••••",
		"auth.error.generic": "Ocurrió un error. Inténtalo de nuevo.",
		"auth.captcha.required": "Por favor completa la verificación de seguridad",
		"auth.captcha.error":
			"La verificación de seguridad falló. Por favor intenta de nuevo.",
		"auth.captcha.expired":
			"La verificación de seguridad expiró. Por favor intenta de nuevo.",
		"auth.loading": "Cargando...",
		"auth.error.passwordWeak":
			"La contraseña es muy débil. Debe tener al menos 8 caracteres, mayúsculas y números.",
		"auth.forgot.title": "¿Olvidaste tu contraseña?",
		"auth.forgot.subtitle":
			"Ingresa tu email y te enviaremos un link para restablecerla.",
		"auth.forgot.sent":
			"Revisa tu email. Si la cuenta existe, recibirás un link de restablecimiento.",
		"auth.forgot.btn": "Enviar link",
		"auth.reset.title": "Restablecer contraseña",
		"auth.reset.subtitle": "Ingresa tu nueva contraseña.",
		"auth.reset.btn": "Cambiar contraseña",
		"auth.reset.success": "Contraseña actualizada. Ya puedes iniciar sesión.",
		"auth.forgot.link": "¿Olvidaste tu contraseña?",
		"auth.emailVerificationSent": "Revisa tu email",
		"auth.signupSuccess":
			"Te enviamos un link de verificación. Revisa tu bandeja de entrada.",
		"auth.verified.toast": "¡Correo verificado exitosamente!",
		"auth.verified.link": "Ir a la app",
		"auth.backHome": "Volver al inicio",
		"auth.backLogin": "Volver al login",
		"auth.confirmPassword.label": "Confirmar contraseña",
		"auth.confirmPassword.placeholder": "Repite tu contraseña",
		"auth.password.weak": "Débil",
		"auth.password.medium": "Media",
		"auth.password.strong": "Fuerte",

		// Blog
		"blog.title": "Tempo Blog",
		"blog.comingSoon": "Más contenido próximamente",
		"blog.description":
			"Estamos preparando el blog de Tempo. Muy pronto compartiremos consejos sobre productividad y enfoque.",

		"blog.body":
			"Estamos preparando artículos increíbles sobre productividad, la técnica Pomodoro y cómo sacar el máximo provecho a tu tiempo de enfoque.",
		"blog.back": "Volver al Inicio",

		// 404
		"404.title": "404 - No encontrado",
		"404.heading": "¡Te has distraído!",
		"404.description":
			"Esta página no existe o se ha perdido en el tiempo. Regresa para mantener tu racha de concentración.",
		"404.back": "Volver al Foco",
	},
	en: {
		"nav.home": "Home",
		"nav.about": "About",
		"nav.blog": "Blog",
		"nav.login": "Login",
		"nav.logout": "Logout",
		"nav.language": "Language",
		"nav.theme": "Theme",

		// Hero
		"hero.title": "Master your time",
		"hero.subtitle":
			"Whether you are, studying or creating, the Pomodoro method is your best ally.",
		"hero.subtitle.part2": "the Pomodoro method is your best ally.",
		"hero.span.coding": "coding",
		"hero.span.studying": "studying",
		"hero.span.creating": "creating",
		"hero.or": "or",
		"hero.focus.title": "Deep Focus",
		"hero.focus.subtitle": "The world can wait.",

		// Timer
		"timer.focus": "Focus",
		"timer.short": "Break",
		"timer.long": "Break",
		"timer.active_focus": "Active Focus",
		"timer.focusing": "Focusing",
		"timer.paused": "Paused",
		"timer.setup.title": "Setup your Cycle",
		"timer.setup.subtitle": "How much time do you have?",
		"timer.setup.btn.start": "Start Session",
		"timer.setup.btn.start.disabled": "Select time...",
		"timer.run.pause": "⏸ Pause",
		"timer.run.resume": "▶ Resume",
		"timer.run.new": "New Plan ↺",
		"timer.run.cancel": "Cancel task",
		"timer.run.current": "Current Block",
		"timer.run.agenda": "Today's Agenda",
		"timer.run.start": "Start:",
		"timer.run.end": "End approx:",
		"timer.run.finished": "Finished",

		// Timer Setup (Specific)
		"timer.setup.cycles": "cycles",
		"timer.setup.summary": "Plan Summary",
		"timer.setup.break": "Break",

		// Break
		"break.short_label": "Short break",
		"break.long_label": "Long break",
		"break.title": "Take a breather",
		"break.resting": "Resting",
		"break.skip": "Skip break",
		"break.done_title": "Break over!",
		"break.done_desc": "Time to get back to work.",
		"break.continue": "Back to start",
		"timer.setup.finish": "End",
		"stats.progress.title": "Today's Progress",
		"stats.realTime": "Actual Focus Time",
		"stats.completedSessions": "sessions completed",
		"stats.log.title": "Activity Log",
		"stats.log.empty": "Your history is empty today. Let's go!",

		// Tasks
		"task.selector.title": "What are you working on?",
		"task.selector.placeholder": "New task...",
		"task.selector.create": "Create & start",
		"task.selector.empty": "No pending tasks",
		"task.selector.category": "Category",
		"task.selector.subtitle": "Set up your next task before running the timer.",
		"task.selector.pending": "Pending Tasks",
		"task.tooltip.start": "Start Focus",
		"task.tooltip.complete": "Mark Completed",
		"task.tooltip.delete": "Delete Task",
		"task.status.pending": "Pending",
		"task.status.in_progress": "In progress",
		"task.status.done": "Completed",
		"task.status.abandoned": "Abandoned",
		"task.complete.prompt": "Did you finish the task?",
		"task.complete.yes": "Yes, completed",
		"task.complete.no": "Not yet",
		"task.interrupt.title": "Session interrupted",
		"task.interrupt.continue": "Continue",
		"task.interrupt.abandon": "Abandon task",
		"task.remaining": "{minutes}m remaining",
		"timer.cancel.confirm.title": "Cancel task?",
		"timer.cancel.confirm.body": "The task will be permanently deleted.",
		"timer.cancel.confirm.yes": "Yes, delete",
		"timer.cancel.confirm.no": "No, go back",

		// Stats
		"stats.today": "Today",
		"stats.focus": "Focus",
		"stats.hours": "Hours",
		"stats.minutes": "Mins",
		"stats.sessions": "Sessions",
		"stats.weekly.title": "Weekly Summary",
		"stats.weekly.average": "Avg: {minutes}m",
		"stats.session.singular": "session",
		"stats.session.plural": "sessions",

		// Footer
		"footer.whatis": "What is Pomodoro?",
		"footer.slogan": "Productivity tool. No distractions, just focus.",
		"footer.developed": "Developed by",
		"footer.rights": "All rights reserved",

		// Auth
		"auth.login.title": "Log In",
		"auth.signup.title": "Create Account",
		"auth.login.subtitle": "Don't have an account?",
		"auth.signup.subtitle": "Already have an account?",
		"auth.btn.login": "Log In",
		"auth.btn.signup": "Sign Up",
		"auth.btn.toggle.login": "Log In",
		"auth.btn.toggle.signup": "Sign Up",
		"auth.email.label": "Email Address",
		"auth.email.placeholder": "you@example.com",
		"auth.password.label": "Password",
		"auth.password.placeholder": "••••••••",
		"auth.error.generic": "An error occurred. Please try again.",
		"auth.captcha.required": "Please complete the security verification",
		"auth.captcha.error": "Security verification failed. Please try again.",
		"auth.captcha.expired": "Security verification expired. Please try again.",
		"auth.loading": "Loading...",
		"auth.error.passwordWeak":
			"Password is too weak. It must have at least 8 characters, uppercase and numbers.",
		"auth.forgot.title": "Forgot your password?",
		"auth.forgot.subtitle": "Enter your email and we'll send you a reset link.",
		"auth.forgot.sent":
			"Check your email. If the account exists, you'll receive a reset link.",
		"auth.forgot.btn": "Send link",
		"auth.reset.title": "Reset password",
		"auth.reset.subtitle": "Enter your new password.",
		"auth.reset.btn": "Change password",
		"auth.reset.success": "Password updated. You can now sign in.",
		"auth.forgot.link": "Forgot your password?",
		"auth.emailVerificationSent": "Check your email",
		"auth.signupSuccess": "We sent you a verification link. Check your inbox.",
		"auth.verified.toast": "Email verified successfully!",
		"auth.verified.link": "Go to app",
		"auth.backHome": "Back to home",
		"auth.backLogin": "Back to login",
		"auth.confirmPassword.label": "Confirm password",
		"auth.confirmPassword.placeholder": "Repeat your password",
		"auth.password.weak": "Weak",
		"auth.password.medium": "Medium",
		"auth.password.strong": "Strong",

		// Blog
		"blog.title": "Tempo Blog",
		"blog.description":
			"We are preparing the Tempo blog. Very soon we will share tips on productivity and focus.",
		"blog.comingSoon": "More content coming soon",
		"blog.body":
			"We are preparing amazing articles about productivity, the Pomodoro technique, and how to get the most out of your focus time.",
		"blog.back": "Back to Home",

		// 404
		"404.title": "404 - Not Found",
		"404.heading": "You got distracted!",
		"404.description":
			"This page doesn't exist or has been lost in time. Go back to keep your focus streak.",
		"404.back": "Back to Focus",
	},
} as const;
