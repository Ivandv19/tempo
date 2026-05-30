import type { TareaResponse } from "../../lib/validations";

const TAREAS_KEY = "tempo_tareas";

const generarId = () => Date.now() + Math.floor(Math.random() * 1000);

export interface TareaSlice {
	tareas: TareaResponse[];
	tareaActiva: TareaResponse | null;
	cargando: boolean;

	init: (isLoggedIn: boolean) => Promise<void>;
	createTarea: (
		nombre: string,
		isLoggedIn: boolean,
		categoriaId?: number,
	) => Promise<TareaResponse | null>;
	updateTarea: (
		id: number,
		data: Partial<TareaResponse>,
		isLoggedIn: boolean,
	) => Promise<void>;
	deleteTarea: (id: number, isLoggedIn: boolean) => Promise<void>;
	selectTarea: (tarea: TareaResponse | null) => void;
}

export const crearSliceTareas = (
	set: (
		partial: Partial<TareaSlice> | ((state: TareaSlice) => Partial<TareaSlice>),
	) => void,
	_get: () => TareaSlice,
): TareaSlice => ({
	tareas: [],
	tareaActiva: null,
	cargando: false,

	init: async (isLoggedIn) => {
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/tareas");
				if (res.ok) {
					const json = await res.json();
					set({ tareas: json.data });
				}
			} catch (error) {
				console.error("[TareaStore] init tareas error:", error);
			}
		} else {
			try {
				const saved = localStorage.getItem(TAREAS_KEY);
				if (saved) {
					set({ tareas: JSON.parse(saved) });
				}
			} catch {
				localStorage.removeItem(TAREAS_KEY);
			}
		}
	},

	createTarea: async (nombre, isLoggedIn, categoriaId) => {
		if (isLoggedIn) {
			try {
				const res = await fetch("/api/tareas", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nombre, categoriaId }),
				});
				if (!res.ok) return null;
				const json = await res.json();
				const tarea = json.data as TareaResponse;
				set((state) => ({ tareas: [tarea, ...state.tareas] }));
				return tarea;
			} catch (error) {
				console.error("[TareaStore] createTarea error:", error);
				return null;
			}
		}

		const tarea: TareaResponse = {
			id: generarId(),
			nombre,
			categoriaId: categoriaId ?? null,
			estado: "pending",
			createdAt: Date.now(),
			completedAt: null,
		};

		set((state) => {
			const tareas = [tarea, ...state.tareas];
			localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
			return { tareas };
		});

		return tarea;
	},

	updateTarea: async (id, data, isLoggedIn) => {
		if (isLoggedIn) {
			try {
				await fetch(`/api/tareas/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
			} catch (error) {
				console.error("[TareaStore] updateTarea error:", error);
			}
		}

		set((state) => {
			const tareas = state.tareas.map((t) =>
				t.id === id ? { ...t, ...data } : t,
			);
			if (!isLoggedIn) {
				localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
			}
			return { tareas };
		});
	},

	deleteTarea: async (id, isLoggedIn) => {
		if (isLoggedIn) {
			try {
				await fetch(`/api/tareas/${id}`, { method: "DELETE" });
			} catch (error) {
				console.error("[TareaStore] deleteTarea error:", error);
			}
		}

		set((state) => {
			const tareas = state.tareas.filter((t) => t.id !== id);
			if (!isLoggedIn) {
				localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
			}
			return { tareas };
		});
	},

	selectTarea: (tarea) => {
		set({ tareaActiva: tarea });
	},
});
