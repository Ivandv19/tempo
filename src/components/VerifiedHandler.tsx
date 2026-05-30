/** @jsxImportSource react */
import { useEffect, useRef } from "react";
import { useStore } from "../stores/store";

interface Props {
	lang?: "es" | "en";
}

export default function VerifiedHandler({ lang = "es" }: Props) {
	const addToast = useStore((s) => s.addToast);
	const done = useRef(false);

	useEffect(() => {
		if (done.current) return;
		const params = new URLSearchParams(window.location.search);
		if (params.get("verified") === "true") {
			done.current = true;
			const title = lang === "es" ? "¡Correo verificado!" : "Email verified!";
			const message =
				lang === "es"
					? "Tu cuenta ha sido verificada exitosamente. Bienvenido a Tempo."
					: "Your account has been verified successfully. Welcome to Tempo.";
			addToast(message, "success", title);

			const url = new URL(window.location.href);
			url.searchParams.delete("verified");
			window.history.replaceState({}, "", url.toString());
		}
	}, [addToast, lang]);

	return null;
}
