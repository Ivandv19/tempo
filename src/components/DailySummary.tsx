/** @jsxImportSource react */
import type { LogEntry } from '../hooks/usePomodoroStats';
import { ui } from '../i18n/ui';

interface Props {
    lang: 'es' | 'en';
    history: LogEntry[];
    hours: number;
    minutes: number;
    count: number;
}

export default function DailySummary({ lang, history, hours, minutes, count }: Props) {
    const t = ui[lang];

    // We can use native Intl for date formatting, passing the lang code
    const todayDateLabel = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'full' }).format(new Date());

    const formatHour = (isoString: string) =>
        new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">

            {/* Tarjeta Izquierda: Totales */}
            <div className="bg-base-100/50 backdrop-blur-sm p-8 rounded-3xl border border-base-200 shadow-xl flex flex-col justify-center items-center text-center transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl">
                <span className="text-xs font-bold uppercase opacity-60 mb-2 tracking-widest first-letter:uppercase">
                    {todayDateLabel}
                </span>
                <span className="text-xs font-bold uppercase opacity-50 mb-1">
                    {t['stats.realTime']}
                </span>
                <div className="text-5xl font-black text-primary">
                    {hours}<span className="text-xl font-normal opacity-50">h</span> {minutes}<span className="text-xl font-normal opacity-50">m</span>
                </div>
                <div className="text-sm mt-2 opacity-60">
                    {count} {t['stats.completedSessions']}
                </div>
            </div>

            {/* Tarjeta Derecha: Timeline Vertical */}
            <div className="bg-base-100/50 backdrop-blur-sm p-8 rounded-3xl border border-base-200 shadow-xl max-h-60 overflow-y-auto relative transition-all duration-400 hover:scale-[1.02] hover:shadow-2xl">
                <h4 className="text-xs font-bold uppercase opacity-50 mb-6 sticky top-0 bg-base-200/50 backdrop-blur-md pb-2 z-20 text-center">
                    {t['stats.log.title']}
                </h4>

                {history.length === 0 ? (
                    <div className="text-center opacity-30 py-4 italic">
                        {t['stats.log.empty']}
                    </div>
                ) : (
                    <div className="ml-2 border-l-2 border-base-content/10 space-y-6">
                        {history.slice().reverse().map((entry) => (
                            <div key={entry.id} className="relative pl-6">
                                {/* Puntito de color */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-base-200 ${entry.type === 'focus' ? 'bg-primary-500' :
                                    entry.type === 'short' ? 'bg-short-500' : 'bg-long-500'
                                    }`}></div>

                                <div className="flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-sm">
                                            {entry.type === 'focus' ? t['timer.focus'] :
                                                entry.type === 'short' ? t['timer.short'] : t['timer.long']}
                                        </span>
                                        <span className="text-xs font-mono opacity-50 bg-base-content/5 px-2 py-0.5 rounded">
                                            {entry.minutes} min
                                        </span>
                                    </div>
                                    <div className="text-xs opacity-60 font-mono mt-1">
                                        {formatHour(entry.startTime)} - {formatHour(entry.endTime)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}