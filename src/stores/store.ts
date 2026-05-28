import { create } from "zustand";
import { crearSliceBreaks, type BreakSlice } from "./slices/breakSlice";
import {
	crearSliceCategorias,
	type CategoriaSlice,
} from "./slices/categoriaSlice";
import {
	crearSlicePomodoros,
	type PomodoroSlice,
} from "./slices/pomodoroSlice";
import { crearSliceSettings, type SettingsSlice } from "./slices/settingsSlice";
import { crearSliceTareas, type TareaSlice } from "./slices/tareaSlice";
import { crearToastSlice, type ToastSlice } from "./slices/toastSlice";
import { crearSliceUsuario, type UserSlice } from "./slices/userSlice";

export type AppState = TareaSlice &
	PomodoroSlice &
	ToastSlice &
	UserSlice &
	SettingsSlice &
	CategoriaSlice &
	BreakSlice & {
		initTareas: (isLoggedIn: boolean) => Promise<void>;
		initPomodoros: (isLoggedIn: boolean) => Promise<void>;
		initCategorias: (isLoggedIn: boolean) => Promise<void>;
	};

const useStore = create<AppState>()((set, get) => {
	const tareaSlice = crearSliceTareas(set, get);
	const pomodoroSlice = crearSlicePomodoros(set, get);
	const toastSlice = crearToastSlice(set);
	const userSlice = crearSliceUsuario(set);
	const settingsSlice = crearSliceSettings(set);
	const categoriaSlice = crearSliceCategorias(set);
	const breakSlice = crearSliceBreaks(set, get);

	return {
		...tareaSlice,
		...pomodoroSlice,
		...toastSlice,
		...userSlice,
		...settingsSlice,
		...categoriaSlice,
		...breakSlice,
		initTareas: tareaSlice.init,
		initPomodoros: pomodoroSlice.init,
		initCategorias: categoriaSlice.initCategorias,
	};
});

export { useStore };
