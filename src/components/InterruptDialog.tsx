/** @jsxImportSource react */
import { useTranslations } from "../i18n/utils";

interface Props {
	lang: "es" | "en";
	onContinue: () => void;
	onAbandon: () => void;
}

export default function InterruptDialog({
	lang,
	onContinue,
	onAbandon,
}: Props) {
	const t = useTranslations(lang);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-sm">
			<div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-sm mx-4 p-8 text-center space-y-4 animate-fade-in-up">
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-info/15 text-info">
					⏸
				</div>
				<h3 className="text-xl font-black">{t("task.interrupt.title")}</h3>
				<div className="flex gap-4 justify-center pt-2">
					<button
						type="button"
						onClick={onAbandon}
						className="btn btn-outline btn-sm px-6"
					>
						{t("task.interrupt.abandon")}
					</button>
					<button
						type="button"
						onClick={onContinue}
						className="btn btn-primary btn-sm px-6"
					>
						{t("task.interrupt.continue")}
					</button>
				</div>
			</div>
		</div>
	);
}
