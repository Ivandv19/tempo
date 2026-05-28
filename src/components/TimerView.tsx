/** @jsxImportSource react */

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "../i18n/utils";
import { getTodaysStats, getWeeklyStats } from "../lib/stats";
import { useStore } from "../stores/store";
import CancelConfirmDialog from "./CancelConfirmDialog";
import CompleteDialog from "./CompleteDialog";
import DailySummary from "./DailySummary";
import InterruptDialog from "./InterruptDialog";
import WeeklySummary from "./WeeklySummary";

interface Props {
	lang: "es" | "en";
}

const ALARM_SOUND = "https://pomodoro-assets.mgdc.site/alarm.mp3";
const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerView({ lang }: Props) {
	const t = useTranslations(lang);
	const {
		tareaActiva,
		tareas,
		updateTarea,
		pomodoroActivo,
		completar,
		deleteTarea,
		interrumpir,
		reset,
		history,
		isLoggedIn,
		iniciarBreak,
	} = useStore();
	const POMODORO_SECONDS = (pomodoroActivo?.minutesPlanned || 25) * 60;
	const savedSecs = (() => {
		try {
			const saved = localStorage.getItem("pomodoro_active_session");
			if (saved) {
				const { startedAt } = JSON.parse(saved);
				return Math.floor((Date.now() - startedAt) / 1000);
			}
		} catch {}
		return null;
	})();
	const initialTimeLeft =
		savedSecs !== null
			? Math.max(POMODORO_SECONDS - savedSecs, 0)
			: POMODORO_SECONDS;
	const initialStartTime = (() => {
		try {
			const saved = localStorage.getItem("pomodoro_active_session");
			if (saved) {
				const { startedAt } = JSON.parse(saved);
				return startedAt;
			}
		} catch {}
		return Date.now();
	})();

	const haySesionGuardada = savedSecs !== null && savedSecs > 0;
	const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
	const [isActive, setIsActive] = useState(!haySesionGuardada);
	const [showComplete, setShowComplete] = useState(false);
	const [showInterrupt, setShowInterrupt] = useState(haySesionGuardada);
	const [showCancelConfirm, setShowCancelConfirm] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval>>();
	const startTimeRef = useRef(initialStartTime);

	const tarea =
		tareaActiva || tareas.find((t) => t.id === pomodoroActivo?.tareaId);

	useEffect(() => {
		if (!isActive) return;
		intervalRef.current = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current);
					setIsActive(false);
					setShowComplete(true);
					new Audio(ALARM_SOUND).play().catch(() => {});
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(intervalRef.current);
	}, [isActive]);

	const handlePause = () => {
		setIsActive(false);
		setShowInterrupt(true);
	};

	const handleContinue = () => {
		setShowInterrupt(false);
		setIsActive(true);
		startTimeRef.current = Date.now();
	};

	const handleAbandon = async () => {
		const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000);
		await interrumpir(
			Math.min(elapsed, Math.ceil(POMODORO_SECONDS / 60)),
			isLoggedIn,
		);
		setShowInterrupt(false);
		reset();
	};

	const handleComplete = async () => {
		await completar(isLoggedIn);
		if (tarea) {
			await updateTarea(tarea.id, { estado: "done" }, isLoggedIn);
		}
		setShowComplete(false);
		iniciarBreak();
	};

	const handleNotYet = async () => {
		await completar(isLoggedIn);
		setShowComplete(false);
		iniciarBreak();
	};

	const handleCancelConfirm = async () => {
		const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000);
		await interrumpir(
			Math.min(elapsed, Math.ceil(POMODORO_SECONDS / 60)),
			isLoggedIn,
		);
		if (tarea) {
			await deleteTarea(tarea.id, isLoggedIn);
		}
		setShowCancelConfirm(false);
		reset();
	};

	const handleCancel = () => {
		setShowCancelConfirm(true);
	};

	const todaysStats = getTodaysStats(history);
	const weeklyStats = getWeeklyStats(history);

	const progress = timeLeft / POMODORO_SECONDS;
	const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;

	return (
		<div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center gap-10 py-6">
			{tarea && (
				<div className="text-center space-y-2">
					<span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
						<Icon icon="lucide:flame" className="w-3.5 h-3.5 animate-pulse" />
						{t("timer.active_focus")}
					</span>
					<h2 className="text-2xl md:text-3xl font-black text-base-content/90 tracking-tight mt-1">
						{tarea.nombre}
					</h2>
				</div>
			)}

			<div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
				<svg
					className="w-full h-full -rotate-90"
					viewBox="0 0 280 280"
					role="img"
					aria-label="Pomodoro Timer"
				>
					<title>Pomodoro Timer</title>
					<circle
						cx="140"
						cy="140"
						r={RADIUS}
						stroke="currentColor"
						strokeWidth="14"
						fill="none"
						className="text-base-300 dark:text-base-content/10"
					/>
					<circle
						cx="140"
						cy="140"
						r={RADIUS}
						stroke="currentColor"
						strokeWidth="14"
						fill="none"
						strokeLinecap="round"
						className="stroke-primary transition-all duration-1000 ease-linear"
						style={{
							strokeDasharray: CIRCUMFERENCE,
							strokeDashoffset: dashOffset,
						}}
					/>
					<circle cx="140" cy="20" r="3.5" className="fill-base-content/20" />
					<circle cx="260" cy="140" r="3.5" className="fill-base-content/20" />
					<circle cx="140" cy="260" r="3.5" className="fill-base-content/20" />
					<circle cx="20" cy="140" r="3.5" className="fill-base-content/20" />
				</svg>

				<div className="absolute flex flex-col items-center">
					<span className="text-6xl font-mono font-bold tracking-tighter text-primary select-none">
						{String(minutes).padStart(2, "0")}:
						{String(seconds).padStart(2, "0")}
					</span>
					<span className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 mt-1 select-none">
						{isActive ? t("timer.focusing") : t("timer.paused")}
					</span>
				</div>
			</div>

			<div className="flex gap-4 items-center justify-center w-full max-w-sm">
				<button
					type="button"
					onClick={handlePause}
					className={`btn flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors duration-200 ${
						isActive
							? "btn-outline border-base-300 hover:bg-base-200 bg-base-100/50"
							: "btn-primary shadow-sm hover:scale-[1.01]"
					}`}
					aria-label={isActive ? t("timer.run.pause") : t("timer.run.resume")}
				>
					<Icon
						icon={isActive ? "lucide:pause" : "lucide:play"}
						className="w-5 h-5"
					/>
					<span>{isActive ? t("timer.run.pause") : t("timer.run.resume")}</span>
				</button>

				<button
					type="button"
					onClick={handleCancel}
					className="btn btn-outline btn-error h-12 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
					aria-label={t("timer.run.cancel")}
				>
					<Icon icon="lucide:x" className="w-5 h-5" />
					<span className="hidden sm:inline">{t("timer.run.cancel")}</span>
				</button>
			</div>

			{todaysStats.history.length > 0 && (
				<div className="space-y-8 pt-6 w-full">
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

			{showComplete && (
				<CompleteDialog
					lang={lang}
					tareaNombre={tarea?.nombre || ""}
					onComplete={handleComplete}
					onNotYet={handleNotYet}
				/>
			)}

			{showInterrupt && (
				<InterruptDialog
					lang={lang}
					onContinue={handleContinue}
					onAbandon={handleAbandon}
				/>
			)}

			{showCancelConfirm && (
				<CancelConfirmDialog
					lang={lang}
					onCancel={handleCancelConfirm}
					onBack={() => setShowCancelConfirm(false)}
				/>
			)}
		</div>
	);
}
