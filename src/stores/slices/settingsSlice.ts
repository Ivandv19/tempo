export interface SettingsSlice {
	theme: string;
	lang: "es" | "en";
	setTheme: (theme: string) => void;
	setLang: (lang: "es" | "en") => void;
}

const getInitialTheme = (): string => {
	if (typeof localStorage === "undefined") return "business";
	try {
		const saved = localStorage.getItem("theme");
		if (saved) return saved;
	} catch {}
	return "business";
};

export const crearSliceSettings = (
	set: (
		partial:
			| Partial<SettingsSlice>
			| ((state: SettingsSlice) => Partial<SettingsSlice>),
	) => void,
): SettingsSlice => ({
	theme: getInitialTheme(),
	lang: "es",

	setTheme: (theme) => {
		try {
			localStorage.setItem("theme", theme);
			document.documentElement.setAttribute("data-theme", theme);
		} catch {}
		set({ theme });
	},

	setLang: (lang) => {
		set({ lang });
	},
});
