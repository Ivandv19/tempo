/** @jsxImportSource react */

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "../i18n/utils";
import { useStore } from "../stores/store";

interface Props {
	lang: "es" | "en";
}

const ALARM_SOUND = "https://pomodoro-assets.mgdc.site/alarm.mp3";
const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BreakTimer({ lang }: Props) {
	const t = useTranslations(lang);
	const { breakActivo, completarBreak, saltarBreak, isLoggedIn } =
		useStore();

	const totalSeconds = (breakActivo?.minutesPlanned ?? 5) * 60;
	const [timeLeft, setTimeLeft] = useState(totalSeconds);
	const [isDone, setIsDone] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval>>();

	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current);
					setIsDone(true);
					new Audio(ALARM_SOUND).play().catch(() => {});
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(intervalRef.current);
	}, []);

	const handleSkip = async () => {
		clearInterval(intervalRef.current);
		await saltarBreak(isLoggedIn);
	};

	const handleContinue = async () => {
		await completarBreak(isLoggedIn);
	};

	const progress = timeLeft / totalSeconds;
	const dashOffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;
	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;

	if (isDone) {
		return (
			<div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center gap-10 py-6">
				<div className="text-center space-y-4">
					<div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mx-auto bg-success/15 text-success animate-bounce">
						✓
					</div>
					<h2 className="text-3xl font-black">{t("break.done_title")}</h2>
					<p className="text-base-content/60 text-sm">
						{t("break.done_desc")}
					</p>
					<button
						type="button"
						onClick={handleContinue}
						className="btn btn-primary btn-lg px-10 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-transform"
					>
						{t("break.continue")}
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center gap-10 py-6">
			<div className="text-center space-y-2">
				<span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-success bg-success/10 px-3 py-1 rounded-full">
					<Icon icon="lucide:coffee" className="w-3.5 h-3.5" />
					{breakActivo?.tipo === "long"
						? t("break.long_label")
						: t("break.short_label")}
				</span>
				<h2 className="text-2xl md:text-3xl font-black text-base-content/90 tracking-tight mt-1">
					{t("break.title")}
				</h2>
			</div>

			<div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
				<svg
					className="w-full h-full -rotate-90"
					viewBox="0 0 280 280"
					role="img"
					aria-label="Break Timer"
				>
					<title>Break Timer</title>
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
						className="stroke-success transition-all duration-1000 ease-linear"
						style={{
							strokeDasharray: CIRCUMFERENCE,
							strokeDashoffset: dashOffset,
						}}
					/>
					<circle
						cx="140"
						cy="20"
						r="3.5"
						className="fill-base-content/20"
					/>
					<circle
						cx="260"
						cy="140"
						r="3.5"
						className="fill-base-content/20"
					/>
					<circle
						cx="140"
						cy="260"
						r="3.5"
						className="fill-base-content/20"
					/>
					<circle
						cx="20"
						cy="140"
						r="3.5"
						className="fill-base-content/20"
					/>
				</svg>

				<div className="absolute flex flex-col items-center">
					<span className="text-6xl font-mono font-bold tracking-tighter text-success select-none">
						{String(minutes).padStart(2, "0")}:
						{String(seconds).padStart(2, "0")}
					</span>
					<span className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 mt-1 select-none">
						{t("break.resting")}
					</span>
				</div>
			</div>

			<button
				type="button"
				onClick={handleSkip}
				className="btn btn-outline border-base-300 hover:bg-base-200 h-12 px-8 rounded-xl font-bold flex items-center justify-center gap-2"
			>
				<Icon icon="lucide:skip-forward" className="w-5 h-5" />
				<span>{t("break.skip")}</span>
			</button>
		</div>
	);
}
