export type BreakType = "short" | "long";
export type BreakStatus = "active" | "completed" | "skipped";

interface BreakActivo {
	tipo: BreakType;
	status: "active";
	minutesPlanned: number;
	startedAt: number;
}

const STORAGE_KEY = "break_active_session";

export interface BreakSlice {
	breakActivo: BreakActivo | null;

	iniciarBreak: (tipo?: BreakType) => void;
	completarBreak: (isLoggedIn: boolean) => Promise<void>;
	saltarBreak: (isLoggedIn: boolean) => Promise<void>;
	resetBreak: () => void;
}

export const crearSliceBreaks = (
	set: (
		partial:
			| Partial<BreakSlice>
			| ((state: BreakSlice) => Partial<BreakSlice>),
	) => void,
	get: () => BreakSlice,
): BreakSlice => ({
	breakActivo: null,

	iniciarBreak: (tipo = "short") => {
		const minutesPlanned = tipo === "long" ? 15 : 5;
		const breakData: BreakActivo = {
			tipo,
			status: "active",
			minutesPlanned,
			startedAt: Date.now(),
		};
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(breakData));
		} catch {}
		set({ breakActivo: breakData });
	},

	completarBreak: async (isLoggedIn) => {
		const { breakActivo } = get();
		if (!breakActivo) return;

		if (isLoggedIn) {
			try {
				await fetch("/api/breaks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tipo: breakActivo.tipo,
						status: "completed",
						minutesActual: breakActivo.minutesPlanned,
					}),
				});
			} catch (error) {
				console.error("[BreakStore] completar error:", error);
			}
		}

		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
		set({ breakActivo: null });
	},

	saltarBreak: async (isLoggedIn) => {
		const { breakActivo } = get();
		if (!breakActivo) return;

		const elapsed = Math.round(
			(Date.now() - breakActivo.startedAt) / 60000,
		);

		if (isLoggedIn) {
			try {
				await fetch("/api/breaks", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tipo: breakActivo.tipo,
						status: "skipped",
						minutesActual: Math.max(elapsed, 0),
					}),
				});
			} catch (error) {
				console.error("[BreakStore] saltar error:", error);
			}
		}

		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
		set({ breakActivo: null });
	},

	resetBreak: () => {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
		set({ breakActivo: null });
	},
});
