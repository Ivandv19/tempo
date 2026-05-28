import { defaultLang, ui } from "./ui";

export function useTranslations(lang: keyof typeof ui) {
	return function t(
		key: keyof (typeof ui)[typeof defaultLang],
		vars?: Record<string, string | number>,
	) {
		let str = ui[lang][key] || ui[defaultLang][key];
		if (vars) {
			for (const [k, v] of Object.entries(vars)) {
				str = str.replace(`{${k}}`, String(v));
			}
		}
		return str;
	};
}
