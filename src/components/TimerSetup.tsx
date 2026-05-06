// src/components/TimerSetup.tsx
/** @jsxImportSource react */
import { useState } from 'react';
import { usePomodoroStats } from '../hooks/usePomodoroStats';
import DailySummary from './DailySummary';
import { useTranslations } from '../i18n/utils';

const PRESETS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
  { label: "4h", minutes: 240 },
  { label: "5h", minutes: 300 },
];

interface Props {
  onStart: (minutes: number) => void;
  lang: 'es' | 'en';
  isLoggedIn?: boolean;
}

export default function TimerSetup({ onStart, lang, isLoggedIn = false }: Props) {
  const { history, hours, minutes, sessionCount } = usePomodoroStats(isLoggedIn);
  const t = useTranslations(lang);
  
  const [selected, setSelected] = useState<number | null>(null);

  const getStats = (minutes: number) => {
    const cycles = Math.floor(minutes / 30);
    const focusTime = cycles * 25;
    const breakTime = cycles * 5;
    const now = new Date();
    const finishTime = new Date(now.getTime() + minutes * 60000);

    return {
      cycles,
      focusTime,
      breakTime,
      finishLabel: finishTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const stats = selected ? getStats(selected) : null;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-10">
      
      {/* SECCIÓN 1: ELEGIR TIEMPO */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">
            {t('timer.setup.subtitle')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {PRESETS.map((preset) => (
            <button
                type="button"
                key={preset.label}
                onClick={() => setSelected(preset.minutes)}
                className={`btn btn-lg h-24 text-xl flex flex-col gap-1 transition-all shadow-sm ${
                selected === preset.minutes
                    ? "btn-primary shadow-lg scale-105 border-2 border-primary"
                    : "btn-outline border-base-300 hover:border-primary hover:shadow-md"
                }`}
            >
                <span>{preset.label}</span>
                <span className="text-xs font-normal opacity-70">
                {Math.floor(preset.minutes / 30)} {t('timer.setup.cycles')}
                </span>
            </button>
            ))}
        </div>

        {/* Tarjeta de Confirmación */}
        {stats && (
            <div className="card bg-base-200 shadow-xl border border-base-300 animate-fade-in-up">
            <div className="card-body">
                <h3 className="card-title text-primary">{t('timer.setup.summary')}</h3>
                <div className="grid grid-cols-3 gap-4 text-center my-4">
                <div className="flex flex-col">
                    <span className="text-3xl font-bold">{stats.focusTime}m</span>
                    <span className="text-xs opacity-70">{t('stats.focus')}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-3xl font-bold">{stats.breakTime}m</span>
                    <span className="text-xs opacity-70">{t('timer.setup.break')}</span>
                </div>
                <div className="flex flex-col text-accent">
                    <span className="text-3xl font-bold">{stats.finishLabel}</span>
                    <span className="text-xs opacity-70">{t('timer.setup.finish')}</span>
                </div>
                </div>

                <div className="card-actions justify-end mt-4">
                <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    onClick={() => {
                    if (selected) {
                         onStart(selected);
                    }
                    }}
                >
                    {t('timer.setup.btn.start')}
                </button>
                </div>
            </div>
            </div>
        )}
      </div>

      {/* SECCIÓN 2: HISTORIAL (Solo se ve si has hecho algo hoy) */}
      {history.length > 0 && (
          <div className="animate-fade-in">
              <div className="divider opacity-50 mb-8 text-xs font-bold uppercase tracking-widest">
                  {t('stats.progress.title')}
              </div>
              
              {/* Aquí usamos el componente reutilizable */}
              <DailySummary 
                  lang={lang}
                  history={history} 
                  hours={hours} 
                  minutes={minutes} 
                  count={sessionCount} 
              />
          </div>
      )}

    </div>
  );
}