/** @jsxImportSource react */
import { useTranslations } from "../i18n/utils";

interface Props {
	lang: "es" | "en";
	onCancel: () => void;
	onBack: () => void;
}

export default function CancelConfirmDialog({ lang, onCancel, onBack }: Props) {
	const t = useTranslations(lang);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-sm">
			<div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-sm mx-4 p-8 text-center space-y-4 animate-fade-in-up">
				<div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto bg-warning/15 text-warning">
					⚠
				</div>
				<h3 className="text-xl font-black">
					{t("timer.cancel.confirm.title")}
				</h3>
				<p className="text-sm leading-relaxed text-base-content/70">
					{t("timer.cancel.confirm.body")}
				</p>
				<div className="flex gap-4 justify-center pt-2">
					<button
						type="button"
						onClick={onBack}
						className="btn btn-outline btn-sm px-6"
					>
						{t("timer.cancel.confirm.no")}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="btn btn-error btn-sm px-6"
					>
						{t("timer.cancel.confirm.yes")}
					</button>
				</div>
			</div>
		</div>
	);
}
