export type SessionType = "focus" | "short" | "long";

export interface LogEntry {
	id: number;
	type: SessionType;
	minutes: number;
	startTime: string;
	endTime: string;
}

interface DiaStat {
	day: string;
	minutes: number;
	count: number;
}

interface PomodoroActivo {
	tareaId: number;
	status: "active";
	minutesPlanned: number;
	startedAt: number;
}

const STORAGE_KEY = "pomodoro_active_session";
const HISTORY_KEY = "pomodoro_history";
const REMAINING_KEY = "pomodoro_remaining";

const cargarRemaining = (): Record<number, number> => {
	if (typeof localStorage === "undefined") return {};
	try {
		const saved = localStorage.getItem(REMAINING_KEY);
		return saved ? JSON.parse(saved) : {};
	} catch {
		localStorage.removeItem(REMAINING_KEY);
		return {};
	}
};

const guardarRemaining = (map: Record<number, number>) => {
	try {
		localStorage.setItem(REMAINING_KEY, JSON.stringify(map));
	} catch (error) {
		console.warn("[PomodoroStore] guardarRemaining error:", error);
	}
};

export interface PomodoroSlice {
	pomodoroActivo: PomodoroActivo | null;
	history: LogEntry[];
	weeklyStats: DiaStat[];
	cargando: boolean;
	tareasPendientes: Record<number, number>;

	iniciar: (tareaId: number, isLoggedIn: boolean) => void;
	completar: (isLoggedIn: boolean) => Promise<void>;
	interrumpir: (minutesActual: number, isLoggedIn: boolean) => Promise<void>;
	guardarLocal: (type: SessionType, minutes: number) => void;
	restaurar: () => PomodoroActivo | null;
	reset: () => void;
	init: (isLoggedIn: boolean) => Promise<void>;
	clearTareaPendiente: (taskId: number) => void;
}

export const crearSlicePomodoros = (
	set: (
		partial:
			| Partial<PomodoroSlice>
			| ((state: PomodoroSlice) => Partial<PomodoroSlice>),
	) => void,
	get: () => PomodoroSlice,
): PomodoroSlice => ({
	pomodoroActivo: null,
	history: [],
	weeklyStats: [],
	cargando: false,
	tareasPendientes: cargarRemaining(),

	init: async (isLoggedIn) => {
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/pomodoros");
				if (res.ok) {
					const json = await res.json();
					const history: LogEntry[] = json.data.map(
						(row: Record<string, unknown>) => ({
							id: row.id as number,
							type: "focus" as SessionType,
							minutes: row.minutesActual as number,
							startTime: new Date(
								(row.createdAt as number) -
									(row.minutesActual as number) * 60000,
							).toISOString(),
							endTime: new Date(row.createdAt as number).toISOString(),
						}),
					);
					set({ history });
				}
			} catch (error) {
				console.error("[PomodoroStore] init error:", error);
			}
		}

		try {
			const saved = localStorage.getItem(HISTORY_KEY);
			if (saved) {
				const local = JSON.parse(saved) as LogEntry[];
				set((state) => ({
					history: state.history.length > 0 ? state.history : local,
				}));
			}
		} catch (error) {
			console.error("[PomodoroStore] init localStorage error:", error);
			localStorage.removeItem(HISTORY_KEY);
		}

		get().restaurar();
	},

	iniciar: (tareaId, _isLoggedIn) => {
		const { tareasPendientes } = get();
		const remainingSecs = tareasPendientes[tareaId];
		const minutesPlanned = remainingSecs ? Math.ceil(remainingSecs / 60) : 25;
		const pomodoro: PomodoroActivo = {
			tareaId,
			status: "active",
			minutesPlanned,
			startedAt: Date.now(),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(pomodoro));
		set({ pomodoroActivo: pomodoro });
	},

	completar: async (isLoggedIn) => {
		const { pomodoroActivo } = get();
		if (!pomodoroActivo) return;

		const minutes = pomodoroActivo.minutesPlanned;

		get().clearTareaPendiente(pomodoroActivo.tareaId);

		if (isLoggedIn) {
			try {
				await fetch("/api/pomodoros", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tareaId: pomodoroActivo.tareaId,
						status: "completed",
						minutesActual: minutes,
					}),
				});
			} catch (error) {
				console.error("[PomodoroStore] completar error:", error);
			}
		}

		get().guardarLocal("focus", minutes);
		localStorage.removeItem(STORAGE_KEY);
		set({ pomodoroActivo: null });
	},

	interrumpir: async (minutesActual, isLoggedIn) => {
		const { pomodoroActivo } = get();
		if (!pomodoroActivo) return;

		const remainingSecs =
			Math.max(pomodoroActivo.minutesPlanned - minutesActual, 0) * 60;

		if (remainingSecs > 0) {
			set((state) => {
				const map = {
					...state.tareasPendientes,
					[pomodoroActivo.tareaId]: remainingSecs,
				};
				guardarRemaining(map);
				return { tareasPendientes: map };
			});
		}

		if (isLoggedIn) {
			try {
				await fetch("/api/pomodoros", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tareaId: pomodoroActivo.tareaId,
						status: "interrupted",
						minutesActual,
					}),
				});
			} catch (error) {
				console.error("[PomodoroStore] interrumpir error:", error);
			}
		}

		get().guardarLocal("focus", minutesActual);
		localStorage.removeItem(STORAGE_KEY);
		set({ pomodoroActivo: null });
	},

	guardarLocal: (type, minutes) => {
		const now = new Date();
		const startTime = new Date(now.getTime() - minutes * 60000);
		const entry: LogEntry = {
			id: Date.now(),
			type,
			minutes,
			startTime: startTime.toISOString(),
			endTime: now.toISOString(),
		};

		set((state) => {
			const allHistory = [entry, ...state.history].slice(0, 200);
			try {
				const existingRaw = localStorage.getItem(HISTORY_KEY);
				const existing = existingRaw ? JSON.parse(existingRaw) : [];
				localStorage.setItem(
					HISTORY_KEY,
					JSON.stringify([...existing, entry].slice(-200)),
				);
			} catch (error) {
				console.warn("[PomodoroStore] guardarLocal error:", error);
			}
			return { history: allHistory };
		});
	},

	restaurar: () => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (!saved) return null;
			const parsed: PomodoroActivo = JSON.parse(saved);
			set({ pomodoroActivo: parsed });
			return parsed;
		} catch {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
	},

	reset: () => {
		localStorage.removeItem(STORAGE_KEY);
		set({ pomodoroActivo: null });
	},

	clearTareaPendiente: (taskId) => {
		set((state) => {
			if (!(taskId in state.tareasPendientes)) return state;
			const map = { ...state.tareasPendientes };
			delete map[taskId];
			guardarRemaining(map);
			return { tareasPendientes: map };
		});
	},
});
