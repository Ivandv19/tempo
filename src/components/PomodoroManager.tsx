/** @jsxImportSource react */
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../stores/store";
import BreakTimer from "./BreakTimer";
import ErrorBoundary from "./ErrorBoundary";
import HeroSection from "./HeroSection";
import TaskSelector from "./TaskSelector";
import TimerView from "./TimerView";
import Toast from "./Toast";
import VerifiedHandler from "./VerifiedHandler";

interface Props {
	lang?: "es" | "en";
}

export default function PomodoroManager({ lang = "es" }: Props) {
	const {
		isLoggedIn,
		initTareas,
		initCategorias,
		createTarea,
		selectTarea,
		pomodoroActivo,
		breakActivo,
		iniciar,
		initPomodoros,
		setLang,
	} = useStore(
		useShallow((s) => ({
			isLoggedIn: s.isLoggedIn,
			initTareas: s.initTareas,
			initCategorias: s.initCategorias,
			createTarea: s.createTarea,
			selectTarea: s.selectTarea,
			pomodoroActivo: s.pomodoroActivo,
			breakActivo: s.breakActivo,
			iniciar: s.iniciar,
			initPomodoros: s.initPomodoros,
			setLang: s.setLang,
		})),
	);

	useEffect(() => {
		setLang(lang);
	}, [lang, setLang]);

	useEffect(() => {
		initTareas(isLoggedIn);
		initCategorias(isLoggedIn);
		initPomodoros(isLoggedIn);
	}, [isLoggedIn, initTareas, initCategorias, initPomodoros]);

	const handleStartTask = async (nombre: string, categoriaId?: number) => {
		const tarea = await createTarea(nombre, isLoggedIn, categoriaId);
		if (tarea) {
			selectTarea(tarea);
			iniciar(tarea.id, isLoggedIn);
		}
	};

	const handleSelectTask = (tareaId: number) => {
		iniciar(tareaId, isLoggedIn);
	};

	return (
		<ErrorBoundary>
			<VerifiedHandler lang={lang} />
			<Toast />
			<div className="w-full">
				<HeroSection lang={lang} mode={pomodoroActivo ? "focus" : "default"} />

				{pomodoroActivo ? (
					<TimerView lang={lang} />
				) : breakActivo ? (
					<BreakTimer lang={lang} />
				) : (
					<TaskSelector
						lang={lang}
						onSelectTask={handleSelectTask}
						onCreateTask={handleStartTask}
					/>
				)}
			</div>
		</ErrorBoundary>
	);
}
