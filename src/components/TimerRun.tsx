// src/components/TimerRun.tsx
/** @jsxImportSource react */
import { useState, useEffect, useMemo, useRef } from 'react';
import { usePomodoroStats, type SessionType } from '../hooks/usePomodoroStats';
import type { Session } from '../hooks/usePomodoroStats';
import DailySummary from './DailySummary';
import WeeklySummary from './WeeklySummary';
import { useTranslations } from '../i18n/utils';
import ClockFace from './ClockFace';

interface Props {
    initialMinutes: number;
    onReset: () => void;
    lang: 'es' | 'en';
    isLoggedIn?: boolean;
}

const ALARM_SOUND = "https://pomodoro-assets.mgdc.site/alarm.mp3";

export default function TimerRun({ initialMinutes, onReset, lang, isLoggedIn = false }: Props) {

    const { addSession, history, hours, minutes, sessionCount, weeklyStats } = usePomodoroStats(isLoggedIn);
    const t = useTranslations(lang);

    const schedule = useMemo(() => {
        const queue: Session[] = [];
        let remainingMins = initialMinutes;
        let cycleCount = 1;

        while (remainingMins >= 25) {
            queue.push({ type: 'focus', duration: 25 * 60, label: t('timer.focus') });
            remainingMins -= 25;

            if (remainingMins >= 5) {
                const isLongBreak = cycleCount % 4 === 0;
                const breakDuration = isLongBreak ? 15 : 5;
                if (remainingMins >= breakDuration) {
                    queue.push({
                        type: isLongBreak ? 'long' : 'short',
                        duration: breakDuration * 60,
                        label: isLongBreak ? t('timer.long') : t('timer.short')
                    });
                    remainingMins -= breakDuration;
                }
            }
            cycleCount++;
        }
        return queue;
    }, [initialMinutes, lang, t]);

    // Clave para localStorage
    const TIMER_STATE_KEY = 'pomodoro_timer_state';

    // Función para leer estado guardado de forma sincrónica en la inicialización
    const getSavedState = () => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = localStorage.getItem(TIMER_STATE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (_e) {
            return null;
        }
    };

    const savedState = getSavedState();



    const [currentSessionIndex, setCurrentSessionIndex] = useState(() => {
        if (savedState && savedState.initialMinutes === initialMinutes) {
            return savedState.currentSessionIndex;
        }
        return 0;
    });

    const [isActive, setIsActive] = useState(() => {
        if (savedState && savedState.initialMinutes === initialMinutes) {
            return false; // 🔥 Siempre iniciar pausado al restaurar
        }
        return true;
    });

    const [isSessionFinished, setIsSessionFinished] = useState(false);

    const [blockStartTime, setBlockStartTime] = useState(() => {
        if (savedState && savedState.initialMinutes === initialMinutes && savedState.blockStartTime) {
            return new Date(savedState.blockStartTime);
        }
        return new Date();
    });

    const [planStartTime] = useState(() => {
        if (savedState && savedState.initialMinutes === initialMinutes && savedState.planStartTime) {
            return new Date(savedState.planStartTime);
        }
        return new Date();
    });

    // timeLeft initialization WITHOUT "Catch Up" logic (User Request)
    const [timeLeft, setTimeLeft] = useState(() => {
        if (savedState && savedState.initialMinutes === initialMinutes) {
            return savedState.timeLeft || schedule[0]?.duration || 0;
        }
        return schedule[0]?.duration || 0;
    });

    // 5. Hooks / Logic
    const currentSession = schedule[currentSessionIndex];

    // Guardrail for missing session
    if (isActive && !currentSession) {
        setIsActive(false);
    }

    // useRef para persistir el tiempo objetivo
    const endTimeRef = useRef<number>(0);

    // Guard to prevent duplicate processing of the same session
    const processedSessionsRef = useRef<Set<number>>(new Set());

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatHour = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 🔥 PERSISTENCIA: Guardar estado
    useEffect(() => {
        if (isSessionFinished) {
            localStorage.removeItem(TIMER_STATE_KEY);
            return;
        }

        // Only save if timer has actually been started (not just on initial mount)
        // Check if timeLeft is different from initial duration (meaning timer has run)
        const initialDuration = schedule[0]?.duration || 0;
        const hasStarted = timeLeft < initialDuration || currentSessionIndex > 0;

        if (!hasStarted) {
            // Don't save state if user hasn't started the timer yet
            return;
        }

        const stateToSave = {
            initialMinutes,
            currentSessionIndex,
            isActive,
            timeLeft,
            endTime: endTimeRef.current,
            blockStartTime: blockStartTime.toISOString(),
            planStartTime: planStartTime.toISOString()
        };

        localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(stateToSave));
    }, [currentSessionIndex, isActive, timeLeft, blockStartTime, planStartTime, isSessionFinished, initialMinutes, schedule]);

    // Main Timer Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        // Update title
        if (isActive && timeLeft > 0 && currentSession) {
            document.title = `(${formatTime(timeLeft)}) ${currentSession.label}`;
        } else if (!isActive && !isSessionFinished) {
            document.title = `⏸ ${t('timer.run.pause').replace('⏸ ', '')}`;
        }

        if (isActive && timeLeft > 0) {
            if (endTimeRef.current === 0) {
                endTimeRef.current = Date.now() + timeLeft * 1000;
            }

            interval = setInterval(() => {
                const now = Date.now();
                const diff = endTimeRef.current - now;
                const secondsRemaining = Math.ceil(diff / 1000);

                if (secondsRemaining <= 0) {
                    setTimeLeft(0);
                } else {
                    setTimeLeft(secondsRemaining);
                }
            }, 200);
        }
        else if (timeLeft === 0 && !isSessionFinished && currentSession) {
            // 🔥 GUARD: Prevent duplicate execution
            if (!processedSessionsRef.current.has(currentSessionIndex)) {
                addSession(
                    currentSession.type,
                    Math.floor(currentSession.duration / 60),
                    blockStartTime
                );

                // Mark as processed immediately
                processedSessionsRef.current.add(currentSessionIndex);

                const audio = new Audio(ALARM_SOUND);
                audio.volume = 0.7;
                audio.play().catch(e => console.error(e));

                if (Notification.permission === "granted") {
                    new Notification(`¡${currentSession.label} ${t('timer.run.finished')}!`, {
                        body: lang === 'en' ? "Logged in your history." : "Registrado en tu historial.",
                        icon: "https://pomodoro-assets.mgdc.site/favicon.png"
                    });
                }
            }

            if (currentSessionIndex < schedule.length - 1) {
                const timeout = setTimeout(() => {
                    const nextIndex = currentSessionIndex + 1;
                    setCurrentSessionIndex(nextIndex);
                    setTimeLeft(schedule[nextIndex].duration);
                    setIsActive(true);
                    setBlockStartTime(new Date());
                    endTimeRef.current = 0;
                }, 1500);
                return () => clearTimeout(timeout);
            } else {
                setIsActive(false);
                setIsSessionFinished(true);
                document.title = lang === 'en' ? "✅ Done!" : "✅ ¡Listo!";
            }
        }

        if (!isActive) {
            endTimeRef.current = 0;
        }

        return () => {
            if (interval) clearInterval(interval);
            document.title = "Pomodoro Flux";
        };
    }, [isActive, timeLeft, isSessionFinished, currentSessionIndex, schedule, blockStartTime]); // Removed currentSession from deps to avoid circularity issues if any

    const getTheme = (type: SessionType) => {
        switch (type) {
            case 'focus': return {
                color: 'text-orange-600 dark:text-orange-500',
                stroke: 'stroke-orange-600 dark:stroke-orange-500',
                bgButton: 'bg-orange-600 hover:bg-orange-700 text-white',
                border: 'border-b-orange-500'
            };
            case 'short': return {
                color: 'text-emerald-600 dark:text-emerald-400',
                stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
                bgButton: 'bg-emerald-600 hover:bg-emerald-600/90 text-white',
                border: 'border-b-emerald-500'
            };
            case 'long': return {
                color: 'text-indigo-600 dark:text-indigo-400',
                stroke: 'stroke-indigo-600 dark:stroke-indigo-400',
                bgButton: 'bg-indigo-600 hover:bg-indigo-600/90 text-white',
                border: 'border-b-indigo-500'
            };
        }
    };

    // Guard for rendering
    if (!currentSession) {
        return (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
                <h2 className="text-2xl font-bold">{lang === 'en' ? 'Session Error' : 'Error en la sesión'}</h2>
                <p>{lang === 'en' ? 'Could not recover current session.' : 'No se pudo recuperar la sesión actual.'}</p>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        localStorage.removeItem(TIMER_STATE_KEY);
                        localStorage.removeItem('pomodoro_active_session');
                        onReset();
                    }}
                >
                    {lang === 'en' ? 'Restart Plan' : 'Reiniciar Plan'}
                </button>
            </div>
        );
    }

    const theme = getTheme(currentSession.type);

    // Hora final estimada
    const estimatedFinishTime = useMemo(() => {
        let secondsRemainingTotal = timeLeft;
        for (let i = currentSessionIndex + 1; i < schedule.length; i++) {
            secondsRemainingTotal += schedule[i].duration;
        }
        const now = new Date();
        const finishDate = new Date(now.getTime() + secondsRemainingTotal * 1000);
        return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [timeLeft, currentSessionIndex, schedule]);

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in py-6">

            <div className="flex flex-col items-center space-y-12">

                {/* 1. RELOJ */}
                <ClockFace
                  timeLeft={timeLeft}
                  totalDuration={currentSession.duration}
                  currentLabel={currentSession.label}
                  isActive={isActive}
                  isSessionFinished={isSessionFinished}
                  theme={theme}
                  formatTime={formatTime}
                  onTogglePause={() => setIsActive(!isActive)}
                  onReset={() => { localStorage.removeItem('pomodoro_timer_state'); onReset(); }}
                  pauseLabel={t('timer.run.pause')}
                  resumeLabel={t('timer.run.resume')}
                  newPlanLabel={t('timer.run.new')}
                  finishedLabel={t('timer.run.finished')}
                />

                {/* 2. AGENDA HORIZONTAL (Visual igual) */}
                <div className="w-full bg-base-100/50 backdrop-blur-sm rounded-2xl p-6 border border-base-200 shadow-xl transition-colors duration-400">
                    <div className="mb-6 pb-4 border-b border-base-200 flex justify-between items-center">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold opacity-70">{t('timer.run.agenda')}</h3>
                            <span className="text-xs font-mono opacity-60">{t('timer.run.start')} {formatHour(planStartTime)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase opacity-50">{t('timer.run.end')}</span>
                                <span className="text-2xl font-black">{estimatedFinishTime}</span>
                            </div>
                        </div>
                    </div>
                    <div className="relative flex items-center overflow-x-auto pb-8 pt-4 custom-scrollbar scroll-smooth snap-x">
                        <div className="absolute left-0 right-0 top-[1.2rem] h-0.5 bg-base-300 z-0"></div>
                        {schedule.map((session, index) => {
                            const isPast = index < currentSessionIndex;
                            const isCurrent = index === currentSessionIndex;
                            const sTheme = getTheme(session.type);
                            return (
                                <div key={index} className={`relative shrink-0 flex flex-col items-center px-6 snap-center transition-all ${isCurrent ? 'opacity-100 scale-105' : 'opacity-50'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 transition-colors z-10 mb-4 ${isPast ? 'bg-success border-success' :
                                            isCurrent ? `${sTheme.bgButton} border-white shadow-lg` :
                                                'bg-base-100 border-base-300'
                                        }`}>
                                        {isPast && <svg className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <div className={`p-3 rounded-lg border-b-4 w-40 text-center ${isCurrent ? 'bg-base-200 shadow-md ' + sTheme.border : 'border-transparent'}`}>
                                        <div className="flex flex-col items-center">
                                            <span className={`font-bold text-sm truncate w-full`}>{session.label}</span>
                                            <span className="font-mono text-xs opacity-60">{Math.floor(session.duration / 60)}m</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. 🔥 STATS / TRACKER (COMPONENTIZADO) */}
                <div className="w-full flex flex-col gap-4">
                    <DailySummary
                        lang={lang}
                        history={history}
                        hours={hours}
                        minutes={minutes}
                        count={sessionCount}
                    />
                    {isLoggedIn ? (
                        <WeeklySummary lang={lang} weeklyStats={weeklyStats} />
                    ) : (
                        <div className="w-full bg-base-200/50 p-6 rounded-2xl border border-base-200 shadow-md animate-fade-in-up relative overflow-hidden group select-none">
                            {/* Fondo Falso para simular contenido */}
                            <div className="opacity-30 blur-sm pointer-events-none filter grayscale">
                                <h4 className="text-xs font-bold uppercase opacity-50 mb-6">
                                    {lang === 'es' ? 'Resumen Semanal' : 'Weekly Summary'}
                                </h4>
                                <div className="flex justify-between items-end h-32 gap-2">
                                    {[...Array(7)].map((_, i) => (
                                        <div key={i} className="bg-base-300 w-full rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                                    ))}
                                </div>
                            </div>

                            {/* Overlay CTA */}
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-base-100/10 backdrop-blur-[2px] p-6 text-center">
                                <div className="bg-base-100/90 p-5 rounded-xl shadow-2xl border border-base-content/5 backdrop-blur-xl transform transition-transform hover:scale-105">
                                    <h3 className="text-sm font-bold mb-1">
                                        {lang === 'es' ? 'Desbloquea tus estadísticas' : 'Unlock your stats'}
                                    </h3>
                                    <p className="text-xs opacity-70 mb-4 max-w-[200px] leading-relaxed">
                                        {lang === 'es' ? 'Regístrate para ver tu progreso semanal y guardar tu historial en la nube.' : 'Sign up to see your weekly progress and sync your history to the cloud.'}
                                    </p>
                                    <a href={`/${lang === 'es' ? 'login' : 'en/login'}`} className="btn btn-primary btn-sm btn-wide shadow-lg shadow-primary/20">
                                        {lang === 'es' ? 'Iniciar Sesión / Registro' : 'Login / Signup'}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}