/** @jsxImportSource react */
import type React from 'react';
import { useState, useRef } from 'react';
import { signIn, signUp } from '../../lib/auth-client';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

/**
 * Interfaz para las traducciones pasadas desde Astro
 */
interface Props {
  translations: {
    loginTitle: string;
    signupTitle: string;
    loginSubtitle: string;
    signupSubtitle: string;
    toggleLogin: string;
    toggleSignup: string;
    btnLogin: string;
    btnSignup: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    genericError: string;
    loading: string;
    passwordWeak: string;
    passwordWeakText: string;
    passwordMediumText: string;
    passwordStrongText: string;
  };
  redirectPath: string;
}

/**
 * Componente AuthForm: Maneja tanto el inicio de sesión como el registro.
 * Utiliza Better Auth para la lógica y Turnstile para la verificación de seguridad.
 */
export default function AuthForm({ translations, redirectPath }: Props) {
  // --- Estados del Componente ---
  const [isLogin, setIsLogin] = useState(true); // Controla si estamos en modo Login o Signup
  const [loading, setLoading] = useState(false); // Estado de carga durante las peticiones
  const [error, setError] = useState<string | null>(null); // Mensajes de error para el usuario
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null); // Token de verificación de Cloudflare
  const [showPassword, setShowPassword] = useState(false); // Controla la visibilidad de la contraseña
  const [password, setPassword] = useState(''); // Valor de la contraseña para validación en tiempo real
  const [strength, setStrength] = useState(0); // 0: Vacío, 1: Débil, 2: Medio, 3: Fuerte
  const turnstileRef = useRef<TurnstileInstance>(null); // Referencia para controlar el widget de Turnstile

  /**
   * Cambia entre el modo de inicio de sesión y el de registro.
   * Resetea errores y tokens para evitar estados inconsistentes.
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setTurnstileToken(null);
    setPassword('');
    setStrength(0);
    turnstileRef.current?.reset();
  };

  /**
   * Evalúa la fortaleza de la contraseña basada en patrones.
   * Devuelve un score de 0 a 3.
   */
  const checkStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    setStrength(checkStrength(val));
  };

  /**
   * Maneja el envío del formulario.
   * Realiza validaciones básicas y llama a las funciones de Better Auth.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Verificación obligatoria de Turnstile en el cliente
    if (!turnstileToken) {
      setError('Por favor completa la verificación de seguridad');
      return;
    }

    // Validación de fortaleza en el registro
    if (!isLogin && strength < 3) {
      setError(translations.passwordWeak);
      return;
    }

    setLoading(true);

    // Obtención de datos del formulario de forma nativa
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isLogin) {
        // --- Proceso de Inicio de Sesión ---
        const { error } = await signIn.email({
          email,
          password,
          fetchOptions: {
            headers: {
              // El token se pasa en el header para ser procesado por el hook en el servidor
              'x-turnstile-token': turnstileToken
            }
          }
        });
        if (error) throw new Error(error.message || translations.genericError);
      } else {
        // --- Proceso de Registro ---
        const { error } = await signUp.email({
          email,
          password,
          name: email.split('@')[0] || 'User', // Nombre por defecto basado en el email
          fetchOptions: {
            headers: {
              'x-turnstile-token': turnstileToken
            }
          }
        });
        if (error) throw new Error(error.message || translations.genericError);
      }

      // Si todo sale bien, redirigir a la ruta especificada
      window.location.href = redirectPath;

    } catch (err: unknown) {
      // Manejo de errores: Mostramos el mensaje y reseteamos el CAPTCHA por seguridad
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-base-100/50 backdrop-blur-sm border border-base-200 p-10 rounded-3xl shadow-2xl animate-fade-in transition-all duration-300">

      {/* Cabecera del Formulario */}
      <div className="text-center space-y-2">
        <h2 key={isLogin ? 'login-title' : 'signup-title'} className="text-4xl font-black bg-linear-to-r from-(--auth-title-from) to-(--auth-title-to) bg-clip-text text-transparent font-[Outfit] tracking-tight py-1 animate-fade-in-up">
          {isLogin ? translations.loginTitle : translations.signupTitle}
        </h2>
        <p key={isLogin ? 'login-sub' : 'signup-sub'} className="text-sm text-(--auth-text-secondary) font-medium">
          {isLogin ? translations.loginSubtitle : translations.signupSubtitle}{' '}
          <button
            onClick={toggleMode}
            type="button"
            className="text-[var(--auth-accent)] hover:text-[var(--auth-accent-hover)] underline underline-offset-4 transition-all cursor-pointer font-bold"
          >
            {isLogin ? translations.toggleSignup : translations.toggleLogin}
          </button>
        </p>
      </div>

      <form key={isLogin ? 'login-form' : 'signup-form'} className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Campo de Correo Electrónico */}
          <div className="group">
            <label htmlFor="email-address" className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1">
              {translations.emailLabel}
            </label>
            <div className="relative group-focus-within:scale-[1.01] transition-transform">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:z-10 sm:text-sm transition-all duration-300"
                placeholder={translations.emailPlaceholder}
              />
              <span className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none text-(--auth-label) group-focus-within:text-(--auth-accent) transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </span>
            </div>
          </div>

          {/* Campo de Contraseña con opción de visualización */}
          <div className="group">
            <label htmlFor="password" ext-id="password-label" className="block text-xs font-bold text-(--auth-label) uppercase tracking-widest mb-1.5 ml-1">
              {translations.passwordLabel}
            </label>
            <div className="relative group-focus-within:scale-[1.01] transition-transform">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={handlePasswordChange}
                className="appearance-none rounded-2xl relative block w-full px-12 py-4 border border-(--auth-border) bg-(--auth-input-bg) text-(--auth-text) placeholder-(--auth-placeholder) focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:z-10 sm:text-sm transition-all duration-300"
                placeholder={translations.passwordPlaceholder}
              />
              <span className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none text-(--auth-label) group-focus-within:text-(--auth-accent) transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 inset-y-0 flex items-center pr-4 text-(--auth-placeholder) hover:text-(--auth-accent) transition-colors cursor-pointer z-20"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {/* Indicador de Fortaleza (Solo en Signup) */}
            {!isLogin && password && (
              <div className="mt-2 px-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-(--auth-label)">
                    {strength === 1 ? translations.passwordWeakText : strength === 2 ? translations.passwordMediumText : translations.passwordStrongText}
                  </span>
                  <span className="text-[10px] font-mono text-(--auth-label)">{password.length}/8+</span>
                </div>
                <div className="h-1.5 w-full bg-base-300 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full transition-all duration-500 rounded-full ${strength >= 1 ? 'w-1/3 bg-red-500' : 'w-0'}`} />
                  <div className={`h-full transition-all duration-500 rounded-full ${strength >= 2 ? 'w-1/3 bg-yellow-500' : 'w-0'}`} />
                  <div className={`h-full transition-all duration-500 rounded-full ${strength >= 3 ? 'w-1/3 bg-green-500' : 'w-0'}`} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Mensajes de Error */}
        {error && (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-950/50 py-3 px-4 rounded-xl border border-red-200 dark:border-red-800/30 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        {/* Widget de Verificación Turnstile */}
        <div className="w-full py-2">
          <Turnstile
            ref={turnstileRef}
            siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY}
            options={{
              theme: 'auto',
              size: 'flexible',
            }}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => {
              setTurnstileToken(null);
              setError('La verificación de seguridad falló. Por favor intenta de nuevo.');
            }}
            onExpire={() => {
              setTurnstileToken(null);
              setError('La verificación de seguridad expiró. Por favor intenta de nuevo.');
            }}
          />
        </div>

        {/* Botón de Envío */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-14 text-sm font-black rounded-2xl border-none shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{translations.loading}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:rotate-12 transition-transform" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                <span>{isLogin ? translations.btnLogin : translations.btnSignup}</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}