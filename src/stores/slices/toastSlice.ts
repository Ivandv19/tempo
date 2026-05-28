/** @jsxImportSource react */

export interface Toast {
	id: string;
	title?: string;
	message: string;
	type: "success" | "error" | "info";
}

export interface ToastSlice {
	toasts: Toast[];
	addToast: (message: string, type: Toast["type"], title?: string) => void;
	removeToast: (id: string) => void;
}

let toastCounter = 0;

export const crearToastSlice = (
	set: (fn: (state: ToastSlice) => Partial<ToastSlice>) => void,
): ToastSlice => ({
	toasts: [],
	addToast: (message, type, title) => {
		const id = `toast-${++toastCounter}`;
		set((state) => ({ toasts: [...state.toasts, { id, message, type, title }] }));
		setTimeout(() => {
			set((state) => ({
				toasts: state.toasts.filter((t) => t.id !== id),
			}));
		}, 5000);
	},
	removeToast: (id) => {
		set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
	},
});
