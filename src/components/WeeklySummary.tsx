/** @jsxImportSource react */
import { useEffect, useState } from "react";
import { useTranslations } from "../i18n/utils";

interface WeeklyStats {
	day: string; // 'Mon', 'Tue', etc.
	minutes: number;
	count: number;
}

interface Props {
	lang: "es" | "en";
	weeklyStats: WeeklyStats[];
}

export default function WeeklySummary({ lang, weeklyStats }: Props) {
	const t = useTranslations(lang);
	const [animate, setAnimate] = useState(false);

	useEffect(() => {
		// Activar animación en el siguiente tick para asegurar la transición
		const timeout = setTimeout(() => setAnimate(true), 50);
		return () => clearTimeout(timeout);
	}, []);

	const daysEs = ["L", "M", "M", "J", "V", "S", "D"];
	const daysEn = ["M", "T", "W", "T", "F", "S", "S"];
	const daysLabels = lang === "es" ? daysEs : daysEn;

	// Calcular totales y promedio
	const totalMinutes = weeklyStats.reduce((acc, curr) => acc + curr.minutes, 0);
	const averageMinutes = Math.round(totalMinutes / (weeklyStats.length || 7));

	// Calcular el máximo para escalar las barras (Maximo de la semana o 60 mins minimo)
	const rawMax = Math.max(...weeklyStats.map((d) => d.minutes));
	const maxMinutes = Math.ceil(Math.max(rawMax, 60) / 60) * 60; // Escala en horas completas
	const maxHours = maxMinutes / 60;

	return (
		<div className="w-full bg-base-100/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-base-200/60 shadow-xl animate-fade-in-up relative overflow-hidden group/card">
			{/* Fondo decorativo sutil */}
			<div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none"></div>

			<div className="flex justify-between items-center mb-6">
				<h4 className="text-xs font-bold uppercase opacity-50 z-10">
					{t("stats.weekly.title")}
				</h4>
				<div className="text-[10px] font-mono opacity-50 bg-base-content/5 border border-base-content/10 px-2.5 py-1 rounded-md z-10">
					Total:{" "}
					<span className="font-bold text-primary">
						{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
					</span>
				</div>
			</div>

			<div className="relative h-44 mt-2">
				{/* 1. Grid Lines (Fondo de la gráfica) */}
				<div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
					{["top", "mid", "bot"].map((pos) => (
						<div
							key={`grid-${pos}`}
							className="w-full border-b border-dashed border-base-content/5 h-full last:border-0 relative"
						>
							<span className="absolute -top-2 left-0 text-[9px] font-mono opacity-20">
								{pos === "top"
									? `${maxHours}h`
									: pos === "mid"
										? `${maxHours / 2}h`
										: ""}
							</span>
						</div>
					))}
					{/* Línea base */}
					<div className="w-full border-b border-base-content/10"></div>
				</div>

				{/* 2. Línea de Promedio Diario */}
				{averageMinutes > 0 && averageMinutes <= maxMinutes && (
					<div
						className="absolute left-0 right-0 border-t border-dashed border-secondary/40 z-10 flex justify-end pointer-events-none transition-all duration-1000 ease-out"
						style={{
							bottom: `${(averageMinutes / maxMinutes) * 100}%`,
						}}
					>
						<span className="bg-base-200/90 text-secondary text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-secondary/20 -mt-2 shadow-xs select-none">
							{t("stats.weekly.average", { minutes: averageMinutes })}
						</span>
					</div>
				)}

				{/* 3. Barras */}
				<div className="absolute inset-x-0 bottom-0 top-6 flex justify-between items-end px-2 pt-2">
					{weeklyStats.map((stat, index) => {
						const heightPercent = (stat.minutes / maxMinutes) * 100;
						const isToday = new Date().getDay() === (index + 1) % 7;

						return (
							<div
								key={stat.day}
								className="flex flex-col items-center flex-1 h-full justify-end group z-10 relative"
							>
								{/* Grid vertical hover effect */}
								<div className="absolute inset-0 bg-base-content/3 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl -z-10 mx-[-4px]"></div>

								{/* Tooltip Flotante */}
								<div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 bottom-full mb-2.5 z-20 pointer-events-none transform translate-y-1 group-hover:translate-y-0">
									<div className="bg-base-300/90 backdrop-blur-md text-[10px] font-bold py-1.5 px-3 rounded-xl shadow-xl border border-base-content/10 whitespace-nowrap flex flex-col items-center gap-0.5">
										<span className="text-primary font-extrabold">
											{stat.minutes} min
										</span>
										<span className="text-[8px] opacity-60 font-semibold">
											{stat.count}{" "}
											{stat.count === 1
												? t("stats.session.singular")
												: t("stats.session.plural")}
										</span>
									</div>
									{/* Flechita tooltip */}
									<div className="w-1.5 h-1.5 bg-base-300 rotate-45 mx-auto -mt-1.5 border-r border-b border-base-content/10"></div>
								</div>

								{/* Barra con Animación (scaleY) */}
								<div
									className={`w-full max-w-[12px] md:max-w-[20px] rounded-t-full transition-transform duration-1000 ease-out relative overflow-hidden group-hover:scale-x-110 group-hover:brightness-105 ${
										stat.minutes > 0
											? "bg-linear-to-t from-primary/70 to-primary shadow-[0_0_12px_rgba(249,115,22,0.15)]"
											: "bg-base-content/10"
									} ${isToday ? "ring-1 ring-primary/40 opacity-100" : "opacity-75 group-hover:opacity-100"}`}
									style={{
										height: "100%",
										transformOrigin: "bottom",
										transform: `scaleY(${animate ? Math.max(heightPercent / 100, 0.03) : 0.03})`,
										transitionDelay: `${index * 50}ms`,
									}}
								>
									{/* Brillo superior */}
									{stat.minutes > 0 && (
										<div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20"></div>
									)}
								</div>

								{/* Etiqueta Día */}
								<span
									className={`text-[9px] md:text-[10px] uppercase mt-3.5 font-bold transition-colors ${
										isToday
											? "text-primary"
											: "opacity-40 group-hover:opacity-80"
									}`}
								>
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
