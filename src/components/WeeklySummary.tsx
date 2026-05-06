/** @jsxImportSource react */
import { ui } from '../i18n/ui';

interface WeeklyStats {
    day: string; // 'Mon', 'Tue', etc.
    minutes: number;
    count: number;
}

interface Props {
    lang: 'es' | 'en';
    weeklyStats: WeeklyStats[];
}

export default function WeeklySummary({ lang, weeklyStats }: Props) {
    const daysEs = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const daysEn = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const daysLabels = lang === 'es' ? daysEs : daysEn;

    // Calcular el máximo para escalar las barras (Maximo de la semana o 60 mins minimo)
    // Redondeamos el máximo al siguiente múltiplo de 60 para que la escala tenga sentido (1h, 2h...)
    const rawMax = Math.max(...weeklyStats.map(d => d.minutes));
    const maxMinutes = Math.ceil(Math.max(rawMax, 60) / 60) * 60; // Escala en horas completas
    const maxHours = maxMinutes / 60;

    return (
        <div className="w-full bg-base-200/50 p-6 rounded-2xl border border-base-200 shadow-md animate-fade-in-up transition-all duration-400 hover:shadow-lg relative overflow-hidden group/card">
            {/* Fondo decorativo sutil */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-bold uppercase opacity-50 z-10">
                    {lang === 'es' ? 'Resumen Semanal' : 'Weekly Summary'}
                </h4>
                <div className="text-[10px] font-mono opacity-40 bg-base-300/50 px-2 py-1 rounded-md">
                    Total: {Math.floor(weeklyStats.reduce((acc, curr) => acc + curr.minutes, 0) / 60)}h {weeklyStats.reduce((acc, curr) => acc + curr.minutes, 0) % 60}m
                </div>
            </div>

            <div className="relative h-40 mt-2">
                {/* 1. Grid Lines (Fondo de la gráfica) */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[...Array(3)].map((_, i) => ( // 3 líneas: Top, Middle, Bottom
                        <div key={i} className="w-full border-b border-dashed border-base-content/5 h-full last:border-0 relative">
                            <span className="absolute -top-2 left-0 text-[9px] font-mono opacity-20">
                                {i === 0 ? `${maxHours}h` : i === 1 ? `${maxHours / 2}h` : ''}
                            </span>
                        </div>
                    ))}
                    {/* Línea base */}
                    <div className="w-full border-b border-base-content/10"></div>
                </div>

                {/* 2. Barras */}
                <div className="absolute inset-x-0 bottom-0 top-4 flex justify-between items-end px-2 pt-2">
                    {weeklyStats.map((stat, index) => {
                        const heightPercent = (stat.minutes / maxMinutes) * 100;
                        const isToday = new Date().getDay() === (index + 1) % 7; 

                        return (
                            <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group z-10 relative">
                                 {/* Grid vertical hover effect */}
                                 <div className="absolute inset-0 bg-base-content/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm -z-10 mx-[-4px]"></div>

                                 {/* Tooltip Flotante */}
                                <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 bottom-full mb-2 z-20 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                                    <div className="bg-base-300 text-[10px] font-bold py-1 px-2 rounded shadow-xl border border-base-content/10 whitespace-nowrap flex flex-col items-center gap-0.5">
                                        <span className="text-primary">{stat.minutes} min</span>
                                        <span className="text-[8px] opacity-50 font-normal">{stat.count} sessions</span>
                                    </div>
                                    {/* Flechita tooltip */}
                                    <div className="w-2 h-2 bg-base-300 rotate-45 mx-auto -mt-1 border-r border-b border-base-content/10"></div>
                                </div>
                                
                                {/* Barra con Gradiente */}
                                <div 
                                    className={`w-full max-w-[12px] md:max-w-[24px] rounded-t-sm transition-all duration-700 ease-out relative overflow-hidden ${
                                        stat.minutes > 0 ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]' : 'bg-base-300/30'
                                    } ${isToday ? 'ring-1 ring-white/50 opacity-100 scale-y-100' : 'opacity-70 hover:opacity-100'}`}
                                    style={{ 
                                        height: `${Math.max(heightPercent, 2)}%`, // Mínimo 2% para que se vea algo si es 0 pero existe la barra base
                                    }}
                                >
                                    {/* Brillo superior */}
                                    {stat.minutes > 0 && (
                                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/30"></div>
                                    )}
                                </div>
                                
                                {/* Etiqueta Día */}
                                <span className={`text-[9px] md:text-[10px] uppercase mt-3 font-bold transition-colors ${
                                    isToday ? 'text-primary' : 'opacity-40 group-hover:opacity-80'
                                }`}>
                                    {daysLabels[index]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
