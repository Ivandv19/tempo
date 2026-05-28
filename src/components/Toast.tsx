/** @jsxImportSource react */
import { useStore } from "../stores/store";

export default function Toast() {
	const toasts = useStore((s) => s.toasts);
	const removeToast = useStore((s) => s.removeToast);

	if (toasts.length === 0) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-sm">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center space-y-4 animate-fade-in-up"
					role="alert"
				>
					<div className="flex justify-center">
						<div
							className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
								toast.type === "success"
									? "bg-success/15 text-success"
									: toast.type === "error"
										? "bg-error/15 text-error"
										: "bg-info/15 text-info"
							}`}
						>
							{toast.type === "success"
								? "✓"
								: toast.type === "error"
									? "✗"
									: "ℹ"}
						</div>
					</div>

					{toast.title && (
						<h3 className="text-xl font-black">{toast.title}</h3>
					)}

					<p className="text-base-content/70 text-sm leading-relaxed">
						{toast.message}
					</p>

					<button
						type="button"
						onClick={() => removeToast(toast.id)}
						className="btn btn-primary btn-sm px-8 mt-2"
					>
						Cerrar
					</button>
				</div>
			))}
		</div>
	);
}
