/** @jsxImportSource react */

import { Icon } from "@iconify/react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "../i18n/utils";
import { getTodaysStats, getWeeklyStats } from "../lib/stats";
import { useStore } from "../stores/store";
import DailySummary from "./DailySummary";
import WeeklySummary from "./WeeklySummary";

interface Props {
	lang: "es" | "en";
	onSelectTask: (tareaId: number) => void;
	onCreateTask: (nombre: string, categoriaId?: number) => void;
}

const getCategoryBadgeStyle = (nombre: string) => {
	const normalized = nombre.toLowerCase().trim();
	if (normalized === "trabajo" || normalized === "work") {
		return "bg-info/10 text-info border border-info/20";
	}
	if (normalized === "estudio" || normalized === "study") {
		return "bg-secondary/10 text-secondary border border-secondary/20";
	}
	if (normalized === "personal") {
		return "bg-accent/10 text-accent border border-accent/20";
	}
	const colors = [
		"bg-indigo-500/10 text-indigo-500 border border-indigo-500/20",
		"bg-purple-500/10 text-purple-500 border border-purple-500/20",
		"bg-amber-500/10 text-amber-500 border border-amber-500/20",
		"bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
	];
	const index = nombre.charCodeAt(0) % colors.length;
	return colors[index];
};

export default function TaskSelector({
	lang,
	onSelectTask,
	onCreateTask,
}: Props) {
	const {
		tareas,
		categorias,
		updateTarea,
		deleteTarea,
		history,
		tareasPendientes,
		isLoggedIn,
	} = useStore(
		useShallow((s) => ({
			tareas: s.tareas,
			categorias: s.categorias,
			updateTarea: s.updateTarea,
			deleteTarea: s.deleteTarea,
			history: s.history,
			tareasPendientes: s.tareasPendientes,
			isLoggedIn: s.isLoggedIn,
		})),
	);
	const t = useTranslations(lang);
	const [nombre, setNombre] = useState("");
	const [categoriaId, setCategoriaId] = useState<number | undefined>();

	const pendientes = tareas.filter(
		(t) => t.estado === "pending" || t.estado === "in_progress",
	);

	const handleCreate = () => {
		if (!nombre.trim()) return;
		onCreateTask(nombre.trim(), categoriaId);
		setNombre("");
		setCategoriaId(undefined);
	};

	const todaysStats = getTodaysStats(history);
	const weeklyStats = getWeeklyStats(history);

	return (
		<div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-10 py-6">
			{/* Tarjeta de Creación de Tareas */}
			<div className="bg-base-100/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-base-200/60 shadow-xl space-y-6 transition-all duration-300">
				<div className="space-y-1">
					<h2 className="text-2xl font-bold tracking-tight text-base-content/90">
						{t("task.selector.title")}
					</h2>
					<p className="text-xs text-base-content/60">
						{t("task.selector.subtitle")}
					</p>
				</div>

				<div className="flex flex-col sm:flex-row gap-3">
					<div className="relative flex-1">
						<span className="absolute inset-y-0 left-0 flex items-center pl-4 text-base-content/40">
							<Icon icon="lucide:clipboard-list" className="w-5 h-5" />
						</span>
						<input
							type="text"
							value={nombre}
							onChange={(e) => setNombre(e.target.value)}
							placeholder={t("task.selector.placeholder")}
							className="input input-bordered w-full pl-12 pr-4 h-12 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base bg-base-100/65"
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate();
							}}
						/>
					</div>
					<button
						type="button"
						onClick={handleCreate}
						disabled={!nombre.trim()}
						className="btn btn-primary h-12 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg disabled:opacity-50"
					>
						<Icon icon="lucide:plus" className="w-5 h-5" />
						<span>{t("task.selector.create")}</span>
					</button>
				</div>

				{categorias.length > 0 && (
					<div className="space-y-2.5 pt-2">
						<span className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
							<Icon icon="lucide:tag" className="w-3.5 h-3.5" />
							{t("task.selector.category")}
						</span>
						<div className="flex gap-2 flex-wrap">
							{categorias.map((cat) => {
								const isSelected = categoriaId === cat.id;
								return (
									<button
										type="button"
										key={cat.id}
										onClick={() =>
											setCategoriaId(isSelected ? undefined : cat.id)
										}
										className={`btn btn-sm rounded-full transition-colors duration-200 px-4 py-1.5 h-auto min-h-0 font-medium ${
											isSelected
												? "btn-primary shadow-sm scale-105"
												: "btn-outline border-base-300 hover:bg-base-200/50"
										}`}
									>
										{isSelected && (
											<Icon icon="lucide:check" className="w-3 h-3 mr-1" />
										)}
										{cat.nombre}
									</button>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Listado de Tareas Pendientes */}
			{pendientes.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between px-1">
						<h3 className="text-lg font-bold flex items-center gap-2 text-base-content/80">
							<Icon icon="lucide:list-todo" className="w-5 h-5 text-primary" />
							{t("task.selector.pending")}
						</h3>
						<span className="badge badge-primary badge-sm font-bold rounded-full px-2.5 py-1">
							{pendientes.length}
						</span>
					</div>

					<div className="space-y-3">
						{pendientes.map((tarea) => (
							<div
								key={tarea.id}
								className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-base-100/50 backdrop-blur-xs border border-base-200 shadow-sm transition-colors duration-200 hover:bg-base-100/80 gap-4"
							>
								<div className="flex-1 min-w-0">
									<h4 className="font-semibold text-base-content/90 truncate transition-colors group-hover:text-primary">
										{tarea.nombre}
									</h4>
									{tarea.categoriaId && (
										<span
											className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1.5 ${getCategoryBadgeStyle(categorias.find((c) => c.id === tarea.categoriaId)?.nombre || "")}`}
										>
											<Icon icon="lucide:tag" className="w-3 h-3" />
											{categorias.find((c) => c.id === tarea.categoriaId)
												?.nombre || ""}
										</span>
									)}
									{tareasPendientes[tarea.id] !== undefined && (
										<span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-md mt-1 ml-1.5">
											<Icon icon="lucide:clock" className="w-3 h-3" />
											{t("task.remaining", {
												minutes: Math.ceil(tareasPendientes[tarea.id] / 60),
											})}
										</span>
									)}
								</div>

								{/* Botones de acción rápida */}
								<div className="flex items-center gap-2 border-t border-base-200/50 pt-3 sm:border-0 sm:pt-0 justify-end">
									{/* Iniciar Pomodoro */}
									<button
										type="button"
										onClick={() => onSelectTask(tarea.id)}
										className="btn btn-circle btn-primary btn-sm hover:scale-110 transition-transform tooltip"
										data-tip={t("task.tooltip.start")}
										aria-label={t("task.tooltip.start")}
									>
										<Icon
											icon="lucide:play"
											className="w-4 h-4 fill-current ml-0.5"
										/>
									</button>

									{/* Completar rápida */}
									<button
										type="button"
										onClick={() =>
											updateTarea(tarea.id, { estado: "done" }, isLoggedIn)
										}
										className="btn btn-circle btn-success btn-sm btn-outline hover:text-white hover:scale-110 transition-transform tooltip"
										data-tip={t("task.tooltip.complete")}
										aria-label={t("task.tooltip.complete")}
									>
										<Icon icon="lucide:check" className="w-4 h-4" />
									</button>

									{/* Eliminar tarea */}
									<button
										type="button"
										onClick={() => deleteTarea(tarea.id, isLoggedIn)}
										className="btn btn-circle btn-error btn-sm btn-outline hover:text-white hover:scale-110 transition-transform tooltip"
										data-tip={t("task.tooltip.delete")}
										aria-label={t("task.tooltip.delete")}
									>
										<Icon icon="lucide:trash-2" className="w-4 h-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Sección de Estadísticas de Hoy */}
			{todaysStats.history.length > 0 && (
				<div className="space-y-6 pt-4">
					<div className="divider opacity-30 text-xs font-bold uppercase tracking-widest">
						{t("stats.progress.title")}
					</div>

					<DailySummary
						lang={lang}
						history={todaysStats.history}
						hours={todaysStats.hours}
						minutes={todaysStats.minutes}
						count={todaysStats.sessionCount}
					/>

					<WeeklySummary lang={lang} weeklyStats={weeklyStats} />
				</div>
			)}
		</div>
	);
}
