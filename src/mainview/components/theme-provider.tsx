import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const STORAGE_KEY = "fin.theme";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
	theme: Theme;
	isSystemTheme: boolean;
	toggleTheme: () => void;
} | null>(null);

function getSystemTheme(): Theme {
	if (typeof window === "undefined") {
		return "light";
	}

	return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
	if (typeof window === "undefined") {
		return null;
	}

	const savedTheme = window.localStorage.getItem(STORAGE_KEY);
	return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
}

function applyTheme(theme: Theme) {
	if (typeof document === "undefined") return;

	const css = document.createElement("style");
	css.appendChild(
		document.createTextNode(
			`* {
       -webkit-transition: none !important;
       -moz-transition: none !important;
       -o-transition: none !important;
       -ms-transition: none !important;
       transition: none !important;
    }`,
		),
	);
	document.head.appendChild(css);

	document.documentElement.classList.toggle("dark", theme === "dark");
	document.documentElement.style.colorScheme = theme;

	// Force reflow
	window.getComputedStyle(css).opacity;
	document.head.removeChild(css);
}

export function initializeTheme() {
	applyTheme(getStoredTheme() ?? getSystemTheme());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [themePreference, setThemePreference] = useState<Theme | null>(() =>
		getStoredTheme(),
	);
	const [systemTheme, setSystemTheme] = useState<Theme>(() => getSystemTheme());

	useEffect(() => {
		const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
		const updateSystemTheme = (event?: MediaQueryListEvent) => {
			setSystemTheme((event?.matches ?? mediaQuery.matches) ? "dark" : "light");
		};

		updateSystemTheme();
		mediaQuery.addEventListener("change", updateSystemTheme);
		return () => mediaQuery.removeEventListener("change", updateSystemTheme);
	}, []);

	const theme = themePreference ?? systemTheme;

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const value = useMemo(
		() => ({
			theme,
			isSystemTheme: themePreference === null,
			toggleTheme: () => {
				setThemePreference((currentTheme) => {
					const nextTheme =
						(currentTheme ?? systemTheme) === "dark" ? "light" : "dark";

					window.localStorage.setItem(STORAGE_KEY, nextTheme);
					return nextTheme;
				});
			},
		}),
		[systemTheme, theme, themePreference],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used inside ThemeProvider");
	}

	return context;
}
