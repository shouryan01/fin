import * as React from "react";
import { BASE_COLORS, CHART_COLORS, THEME_COLORS } from "./theme-definitions";

export interface ThemeConfig {
	baseColor: string;
	theme: string;
	chartColor: string;
	font: string;
	radius: string;
	menuAccent: "subtle" | "bold";
	mode: "light" | "dark" | "system";
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
	baseColor: "mist",
	theme: "sky",
	chartColor: "blue",
	font: "geist",
	radius: "default",
	menuAccent: "subtle",
	mode: "system",
};

export interface OptionItem {
	id: string;
	name: string;
	color?: string;
	fontFamily?: string;
	googleFont?: string;
	googleFontQuery?: string;
	category?: "sans" | "serif" | "mono";
	isBundled?: boolean;
}

export const BASE_COLORS_OPTIONS: OptionItem[] = [
	{ id: "mist", name: "Mist", color: "#64748b" },
	{ id: "neutral", name: "Neutral", color: "#525252" },
	{ id: "zinc", name: "Zinc", color: "#71717a" },
	{ id: "stone", name: "Stone", color: "#78716c" },
	{ id: "mauve", name: "Mauve", color: "#796e7c" },
	{ id: "olive", name: "Olive", color: "#6f7360" },
	{ id: "taupe", name: "Taupe", color: "#7d6f68" },
];

// All 17 official color themes from ui.shadcn.com/create
export const THEME_COLORS_OPTIONS: OptionItem[] = [
	{ id: "sky", name: "Sky", color: "#0ea5e9" },
	{ id: "blue", name: "Blue", color: "#3b82f6" },
	{ id: "violet", name: "Violet", color: "#8b5cf6" },
	{ id: "purple", name: "Purple", color: "#a855f7" },
	{ id: "fuchsia", name: "Fuchsia", color: "#d946ef" },
	{ id: "pink", name: "Pink", color: "#ec4899" },
	{ id: "rose", name: "Rose", color: "#f43f5e" },
	{ id: "red", name: "Red", color: "#ef4444" },
	{ id: "orange", name: "Orange", color: "#f97316" },
	{ id: "amber", name: "Amber", color: "#f59e0b" },
	{ id: "yellow", name: "Yellow", color: "#eab308" },
	{ id: "lime", name: "Lime", color: "#84cc16" },
	{ id: "green", name: "Green", color: "#22c55e" },
	{ id: "emerald", name: "Emerald", color: "#10b981" },
	{ id: "teal", name: "Teal", color: "#14b8a6" },
	{ id: "cyan", name: "Cyan", color: "#06b6d4" },
	{ id: "indigo", name: "Indigo", color: "#6366f1" },
];

// All 17 official chart color presets matching ui.shadcn.com/create
export const CHART_COLORS_OPTIONS: OptionItem[] = [
	{ id: "sky", name: "Sky", color: "#0ea5e9" },
	{ id: "blue", name: "Blue", color: "#3b82f6" },
	{ id: "violet", name: "Violet", color: "#8b5cf6" },
	{ id: "purple", name: "Purple", color: "#a855f7" },
	{ id: "fuchsia", name: "Fuchsia", color: "#d946ef" },
	{ id: "pink", name: "Pink", color: "#ec4899" },
	{ id: "rose", name: "Rose", color: "#f43f5e" },
	{ id: "red", name: "Red", color: "#ef4444" },
	{ id: "orange", name: "Orange", color: "#f97316" },
	{ id: "amber", name: "Amber", color: "#f59e0b" },
	{ id: "yellow", name: "Yellow", color: "#eab308" },
	{ id: "lime", name: "Lime", color: "#84cc16" },
	{ id: "green", name: "Green", color: "#22c55e" },
	{ id: "emerald", name: "Emerald", color: "#10b981" },
	{ id: "teal", name: "Teal", color: "#14b8a6" },
	{ id: "cyan", name: "Cyan", color: "#06b6d4" },
	{ id: "indigo", name: "Indigo", color: "#6366f1" },
];

// Full shadcn fonts list with local bundled fonts and on-demand Google Fonts
export const FONTS_OPTIONS: OptionItem[] = [
	// Bundled / Local Fonts (Offline, zero network requests)
	{
		id: "geist",
		name: "Geist",
		fontFamily: "'Geist Variable', sans-serif",
		category: "sans",
		isBundled: true,
	},
	{
		id: "inter",
		name: "Inter",
		fontFamily: "'Inter Variable', sans-serif",
		category: "sans",
		isBundled: true,
	},
	{
		id: "jakarta",
		name: "Plus Jakarta",
		fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
		category: "sans",
		isBundled: true,
	},
	{
		id: "system",
		name: "System Sans",
		fontFamily:
			"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		category: "sans",
		isBundled: true,
	},
	{
		id: "mono",
		name: "System Mono",
		fontFamily:
			"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
		category: "mono",
		isBundled: true,
	},

	// Sans-Serif Fonts (from ui.shadcn.com)
	{
		id: "dm-sans",
		name: "DM Sans",
		fontFamily: "'DM Sans', sans-serif",
		googleFont: "DM+Sans",
		category: "sans",
	},
	{
		id: "figtree",
		name: "Figtree",
		fontFamily: "'Figtree', sans-serif",
		googleFont: "Figtree",
		category: "sans",
	},
	{
		id: "ibm-plex-sans",
		name: "IBM Plex Sans",
		fontFamily: "'IBM Plex Sans', sans-serif",
		googleFont: "IBM+Plex+Sans",
		category: "sans",
	},
	{
		id: "instrument-sans",
		name: "Instrument Sans",
		fontFamily: "'Instrument Sans', sans-serif",
		googleFont: "Instrument+Sans",
		category: "sans",
	},
	{
		id: "manrope",
		name: "Manrope",
		fontFamily: "'Manrope', sans-serif",
		googleFont: "Manrope",
		category: "sans",
	},
	{
		id: "montserrat",
		name: "Montserrat",
		fontFamily: "'Montserrat', sans-serif",
		googleFont: "Montserrat",
		category: "sans",
	},
	{
		id: "noto-sans",
		name: "Noto Sans",
		fontFamily: "'Noto Sans', sans-serif",
		googleFont: "Noto+Sans",
		category: "sans",
	},
	{
		id: "nunito-sans",
		name: "Nunito Sans",
		fontFamily: "'Nunito Sans', sans-serif",
		googleFont: "Nunito+Sans",
		category: "sans",
	},
	{
		id: "outfit",
		name: "Outfit",
		fontFamily: "'Outfit', sans-serif",
		googleFont: "Outfit",
		category: "sans",
	},
	{
		id: "public-sans",
		name: "Public Sans",
		fontFamily: "'Public Sans', sans-serif",
		googleFont: "Public+Sans",
		category: "sans",
	},
	{
		id: "raleway",
		name: "Raleway",
		fontFamily: "'Raleway', sans-serif",
		googleFont: "Raleway",
		category: "sans",
	},
	{
		id: "roboto",
		name: "Roboto",
		fontFamily: "'Roboto', sans-serif",
		googleFont: "Roboto",
		category: "sans",
	},
	{
		id: "source-sans-3",
		name: "Source Sans 3",
		fontFamily: "'Source Sans 3', sans-serif",
		googleFont: "Source+Sans+3",
		category: "sans",
	},
	{
		id: "space-grotesk",
		name: "Space Grotesk",
		fontFamily: "'Space Grotesk', sans-serif",
		googleFont: "Space+Grotesk",
		category: "sans",
	},

	// Serif Fonts (from ui.shadcn.com)
	{
		id: "eb-garamond",
		name: "EB Garamond",
		fontFamily: "'EB Garamond', Georgia, serif",
		googleFont: "EB+Garamond",
		category: "serif",
	},
	{
		id: "instrument-serif",
		name: "Instrument Serif",
		fontFamily: "'Instrument Serif', Georgia, serif",
		googleFont: "Instrument+Serif",
		googleFontQuery: "Instrument+Serif:ital@0;1",
		category: "serif",
	},
	{
		id: "lora",
		name: "Lora",
		fontFamily: "'Lora', Georgia, serif",
		googleFont: "Lora",
		category: "serif",
	},
	{
		id: "merriweather",
		name: "Merriweather",
		fontFamily: "'Merriweather', Georgia, serif",
		googleFont: "Merriweather",
		googleFontQuery: "Merriweather:wght@300;400;700",
		category: "serif",
	},
	{
		id: "noto-serif",
		name: "Noto Serif",
		fontFamily: "'Noto Serif', Georgia, serif",
		googleFont: "Noto+Serif",
		category: "serif",
	},
	{
		id: "playfair-display",
		name: "Playfair Display",
		fontFamily: "'Playfair Display', Georgia, serif",
		googleFont: "Playfair+Display",
		category: "serif",
	},
	{
		id: "roboto-slab",
		name: "Roboto Slab",
		fontFamily: "'Roboto Slab', Georgia, serif",
		googleFont: "Roboto+Slab",
		category: "serif",
	},

	// Monospace / Tech Fonts (from ui.shadcn.com)
	{
		id: "geist-mono",
		name: "Geist Mono",
		fontFamily: "'Geist Mono', ui-monospace, monospace",
		googleFont: "Geist+Mono",
		category: "mono",
	},
	{
		id: "jetbrains-mono",
		name: "JetBrains Mono",
		fontFamily: "'JetBrains Mono', ui-monospace, monospace",
		googleFont: "JetBrains+Mono",
		category: "mono",
	},
	{
		id: "oxanium",
		name: "Oxanium",
		fontFamily: "'Oxanium', sans-serif",
		googleFont: "Oxanium",
		category: "mono",
	},
];

export const FONT_MAP: Record<string, string> = {
	...Object.fromEntries(
		FONTS_OPTIONS.map((f) => [f.id, f.fontFamily ?? "sans-serif"]),
	),
	"plus-jakarta-sans": "'Plus Jakarta Sans Variable', sans-serif",
};

const loadedFontLinks = new Set<string>();
const DOWNLOADED_FONTS_KEY = "fin-downloaded-fonts";

export function getStoredDownloadedFonts(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(DOWNLOADED_FONTS_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) return parsed;
		}
	} catch {
		// Fallback
	}
	return [];
}

export function saveStoredDownloadedFonts(fonts: string[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(DOWNLOADED_FONTS_KEY, JSON.stringify(fonts));
	} catch {
		// Ignore
	}
}

/**
 * Unloads and deletes a font stylesheet and its font face from memory/DOM.
 */
export function removeFontFromDOM(fontId: string): void {
	if (typeof document === "undefined") return;
	loadedFontLinks.delete(fontId);

	const linkId = `fin-google-font-${fontId}`;
	const linkEl = document.getElementById(linkId);
	if (linkEl) {
		linkEl.remove();
	}

	const font = FONTS_OPTIONS.find((f) => f.id === fontId);
	if (font && "fonts" in document) {
		try {
			const familyName = font.name.toLowerCase();
			// biome-ignore lint/suspicious/noExplicitAny: document.fonts API
			(document.fonts as any).forEach((face: FontFace) => {
				if (face.family.toLowerCase().includes(familyName)) {
					// biome-ignore lint/suspicious/noExplicitAny: document.fonts API
					(document.fonts as any).delete(face);
				}
			});
		} catch {
			// Ignore
		}
	}
}

/**
 * Loads a font dynamically on-demand from Google Fonts.
 * Ensures no duplicate requests and avoids downloading fonts until needed.
 */
export function loadFontOnDemand(fontId: string): void {
	if (typeof document === "undefined") return;
	const font = FONTS_OPTIONS.find((f) => f.id === fontId);
	if (!font || font.isBundled) return;

	if (loadedFontLinks.has(fontId)) return;
	loadedFontLinks.add(fontId);

	const linkId = `fin-google-font-${fontId}`;
	if (document.getElementById(linkId)) return;

	const fontParam =
		font.googleFontQuery ??
		(font.googleFont ? `${font.googleFont}:wght@400;500;600;700` : "");
	if (!fontParam) return;

	const link = document.createElement("link");
	link.id = linkId;
	link.rel = "stylesheet";
	link.href = `https://fonts.googleapis.com/css2?family=${fontParam}&display=swap`;
	document.head.appendChild(link);

	const stored = getStoredDownloadedFonts();
	if (!stored.includes(fontId)) {
		saveStoredDownloadedFonts([...stored, fontId]);
	}
}

export const RADII_OPTIONS: { id: string; name: string; value: string }[] = [
	{ id: "none", name: "0", value: "0rem" },
	{ id: "small", name: "sm (0.375rem)", value: "0.375rem" },
	{ id: "default", name: "default (0.625rem)", value: "0.625rem" },
	{ id: "medium", name: "md (0.875rem)", value: "0.875rem" },
	{ id: "large", name: "lg (1.25rem)", value: "1.25rem" },
];

// Base62 preset encoding definitions aligned with ui.shadcn.com
const PRESET_STYLES = [
	"nova",
	"vega",
	"maia",
	"lyra",
	"mira",
	"luma",
	"sera",
	"rhea",
];
const PRESET_BASE_COLORS = [
	"neutral",
	"stone",
	"zinc",
	"gray",
	"mauve",
	"olive",
	"mist",
	"taupe",
];
const PRESET_THEMES = [
	"neutral",
	"stone",
	"zinc",
	"gray",
	"amber",
	"blue",
	"cyan",
	"emerald",
	"fuchsia",
	"green",
	"indigo",
	"lime",
	"orange",
	"pink",
	"purple",
	"red",
	"rose",
	"sky",
	"teal",
	"violet",
	"yellow",
	"mauve",
	"olive",
	"mist",
	"taupe",
];
const PRESET_ICON_LIBRARIES = [
	"lucide",
	"hugeicons",
	"tabler",
	"phosphor",
	"remixicon",
];
const PRESET_FONTS = [
	"inter",
	"noto-sans",
	"nunito-sans",
	"figtree",
	"roboto",
	"raleway",
	"dm-sans",
	"public-sans",
	"outfit",
	"jetbrains-mono",
	"geist",
	"geist-mono",
	"lora",
	"merriweather",
	"playfair-display",
	"noto-serif",
	"roboto-slab",
	"oxanium",
	"manrope",
	"space-grotesk",
	"montserrat",
	"ibm-plex-sans",
	"source-sans-3",
	"instrument-sans",
	"eb-garamond",
	"instrument-serif",
];
const PRESET_RADII = ["default", "none", "small", "medium", "large"];
const PRESET_MENU_ACCENTS = ["subtle", "bold"];
const PRESET_MENU_COLORS = [
	"default",
	"inverted",
	"default-translucent",
	"inverted-translucent",
];

const PRESET_SCHEMA = [
	{ key: "menuColor", values: PRESET_MENU_COLORS, bits: 3 },
	{ key: "menuAccent", values: PRESET_MENU_ACCENTS, bits: 3 },
	{ key: "radius", values: PRESET_RADII, bits: 4 },
	{ key: "font", values: PRESET_FONTS, bits: 6 },
	{ key: "iconLibrary", values: PRESET_ICON_LIBRARIES, bits: 6 },
	{ key: "theme", values: PRESET_THEMES, bits: 6 },
	{ key: "baseColor", values: PRESET_BASE_COLORS, bits: 6 },
	{ key: "style", values: PRESET_STYLES, bits: 6 },
	{ key: "chartColor", values: PRESET_THEMES, bits: 6 },
	{ key: "fontHeading", values: ["inherit", ...PRESET_FONTS], bits: 5 },
];

const BASE62_CHARS =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function toBase62(val: bigint): string {
	if (val === 0n) return "0";
	let t = "";
	let n = val;
	while (n > 0n) {
		t = BASE62_CHARS[Number(n % 62n)] + t;
		n = n / 62n;
	}
	return t;
}

export function fromBase62(str: string): bigint {
	let t = 0n;
	for (let i = 0; i < str.length; i++) {
		const s = BigInt(BASE62_CHARS.indexOf(str[i]));
		if (s === -1n) return -1n;
		t = t * 62n + s;
	}
	return t;
}

/**
 * Extracts a clean preset code from varied user inputs:
 * - "--preset b2h47HD7kv"
 * - "--preset=b2h47HD7kv"
 * - "b2h47HD7kv"
 * - "npx shadcn@latest init --preset b2h47HD7kv"
 * - "https://ui.shadcn.com/create?preset=b2h47HD7kv"
 */
export function extractPresetCode(input: string): string | null {
	if (!input) return null;
	const trimmed = input.trim();

	// 1. URL parameter (?preset=... or &preset=...)
	const urlMatch = trimmed.match(/[?&]preset=([a-zA-Z0-9]+)/i);
	if (urlMatch) return urlMatch[1];

	// 2. CLI flag format (--preset <code> or --preset=<code>)
	const flagMatch = trimmed.match(/--preset(?:=|\s+)([a-zA-Z0-9]+)/i);
	if (flagMatch) return flagMatch[1];

	// 3. String containing preset code starting with b followed by alphanumeric characters
	const tokenMatch = trimmed.match(/\b(b[a-zA-Z0-9]{4,})\b/);
	if (tokenMatch) return tokenMatch[1];

	// 4. Direct match starting with b
	if (/^b[a-zA-Z0-9]+$/i.test(trimmed)) return trimmed;

	return null;
}

export function encodePresetCode(config: Partial<ThemeConfig>): string {
	const data: Record<string, string> = {
		style: "luma",
		baseColor: config.baseColor ?? "mist",
		theme: config.theme ?? "sky",
		chartColor: config.chartColor ?? "blue",
		iconLibrary: "lucide",
		font: config.font === "jakarta" ? "inter" : (config.font ?? "geist"),
		fontHeading: "inherit",
		radius: config.radius ?? "default",
		menuAccent: config.menuAccent ?? "subtle",
		menuColor: "default",
	};

	let n = 0n;
	let shift = 0n;
	for (const field of PRESET_SCHEMA) {
		const idx = field.values.indexOf(data[field.key] ?? field.values[0]);
		const val = BigInt(idx === -1 ? 0 : idx);
		n += val << shift;
		shift += BigInt(field.bits);
	}
	return `b${toBase62(n)}`;
}

export function decodePresetCode(input: string): Partial<ThemeConfig> | null {
	const code = extractPresetCode(input);
	if (!code || code[0] !== "b") return null;
	const body = code.slice(1);
	const num = fromBase62(body);
	if (num === -1n) return null;

	const res: Record<string, string> = {};
	let cur = num;
	for (const field of PRESET_SCHEMA) {
		const mask = (1n << BigInt(field.bits)) - 1n;
		const idx = Number(cur & mask);
		res[field.key] = field.values[idx] ?? field.values[0];
		cur = cur >> BigInt(field.bits);
	}

	return {
		baseColor: res.baseColor,
		theme: res.theme,
		chartColor: res.chartColor,
		font: res.font,
		radius: res.radius,
		menuAccent: (res.menuAccent as "subtle" | "bold") ?? "subtle",
	};
}

export function applyTheme(config: ThemeConfig): void {
	if (typeof window === "undefined") return;

	const root = document.documentElement;

	// Resolve dark / light mode
	let isDark = config.mode === "dark";
	if (config.mode === "system") {
		isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	}

	if (isDark) {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}

	const modeKey = isDark ? "dark" : "light";

	// 1. Base colors (background, card, border, muted, etc.)
	const baseEntry = BASE_COLORS[config.baseColor] ?? BASE_COLORS.mist;
	if (baseEntry?.[modeKey]) {
		for (const [key, val] of Object.entries(baseEntry[modeKey])) {
			root.style.setProperty(`--${key}`, val);
		}
	}

	// 2. Theme colors (primary, accent, sidebar-primary, etc.)
	const themeEntry = THEME_COLORS[config.theme] ?? THEME_COLORS.sky;
	if (themeEntry?.[modeKey]) {
		for (const [key, val] of Object.entries(themeEntry[modeKey])) {
			root.style.setProperty(`--${key}`, val);
		}
	}

	// 2b. Menu Accent (subtle vs bold)
	const isSubtle = config.menuAccent === "subtle";
	if (isSubtle) {
		const mutedVal = baseEntry?.[modeKey]?.muted;
		const fgVal = baseEntry?.[modeKey]?.foreground;
		if (mutedVal) {
			root.style.setProperty("--accent", mutedVal);
			root.style.setProperty("--sidebar-accent", mutedVal);
		}
		if (fgVal) {
			root.style.setProperty("--accent-foreground", fgVal);
			root.style.setProperty("--sidebar-accent-foreground", fgVal);
		}
	} else {
		const primaryVal = themeEntry?.[modeKey]?.primary;
		const primaryFgVal = themeEntry?.[modeKey]?.["primary-foreground"];
		if (primaryVal) {
			root.style.setProperty("--accent", primaryVal);
			root.style.setProperty("--sidebar-accent", primaryVal);
		}
		if (primaryFgVal) {
			root.style.setProperty("--accent-foreground", primaryFgVal);
			root.style.setProperty("--sidebar-accent-foreground", primaryFgVal);
		}
	}

	root.setAttribute("data-menu-accent", config.menuAccent ?? "subtle");

	// 3. Chart colors
	const chartEntry = CHART_COLORS[config.chartColor] ?? CHART_COLORS.blue;
	if (chartEntry?.[modeKey]) {
		for (const [key, val] of Object.entries(chartEntry[modeKey])) {
			root.style.setProperty(`--${key}`, val);
		}
	}

	// 4. Radius
	const radiusObj =
		RADII_OPTIONS.find((r) => r.id === config.radius) ?? RADII_OPTIONS[2];
	root.style.setProperty("--radius", radiusObj.value);

	// 5. Font
	loadFontOnDemand(config.font);
	const resolvedFont = FONT_MAP[config.font] ?? "'Geist Variable', sans-serif";
	root.style.setProperty("--font-sans", resolvedFont);
	root.style.setProperty("--font-heading", resolvedFont);

	try {
		localStorage.setItem("fin-theme-config", JSON.stringify(config));
	} catch {
		// Ignore storage quota errors
	}
}

export function getStoredThemeConfig(): ThemeConfig {
	if (typeof window === "undefined") return DEFAULT_THEME_CONFIG;
	try {
		const raw = localStorage.getItem("fin-theme-config");
		if (raw) {
			const parsed = JSON.parse(raw);
			return { ...DEFAULT_THEME_CONFIG, ...parsed };
		}
	} catch {
		// Fallback
	}
	return DEFAULT_THEME_CONFIG;
}

export interface ThemeContextType {
	config: ThemeConfig;
	presetCode: string;
	updateTheme: (updates: Partial<ThemeConfig>) => void;
	resetTheme: () => void;
	applyPreset: (codeOrFlag: string) => boolean;
	toggleMode: () => void;
	downloadedFonts: string[];
	loadFont: (fontId: string) => void;
	unloadFont: (fontId: string) => void;
	clearAllDownloadedFonts: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [config, setConfig] = React.useState<ThemeConfig>(() =>
		getStoredThemeConfig(),
	);
	const [downloadedFonts, setDownloadedFonts] = React.useState<string[]>(() =>
		getStoredDownloadedFonts(),
	);

	const presetCode = React.useMemo(() => encodePresetCode(config), [config]);

	const loadFont = React.useCallback((fontId: string) => {
		const font = FONTS_OPTIONS.find((f) => f.id === fontId);
		if (!font || font.isBundled) return;
		loadFontOnDemand(fontId);
		setDownloadedFonts((prev) => {
			if (prev.includes(fontId)) return prev;
			const next = [...prev, fontId];
			saveStoredDownloadedFonts(next);
			return next;
		});
	}, []);

	const unloadFont = React.useCallback((fontId: string) => {
		removeFontFromDOM(fontId);
		setDownloadedFonts((prev) => {
			const next = prev.filter((id) => id !== fontId);
			saveStoredDownloadedFonts(next);
			return next;
		});

		// If current active font is this font, fall back to default geist
		setConfig((prev) => {
			if (prev.font === fontId) {
				const next: ThemeConfig = { ...prev, font: "geist" };
				applyTheme(next);
				return next;
			}
			return prev;
		});
	}, []);

	const clearAllDownloadedFonts = React.useCallback(() => {
		const stored = getStoredDownloadedFonts();
		for (const id of stored) {
			removeFontFromDOM(id);
		}
		setDownloadedFonts([]);
		saveStoredDownloadedFonts([]);

		setConfig((prev) => {
			const activeOption = FONTS_OPTIONS.find((f) => f.id === prev.font);
			if (activeOption && !activeOption.isBundled) {
				const next: ThemeConfig = { ...prev, font: "geist" };
				applyTheme(next);
				return next;
			}
			return prev;
		});
	}, []);

	const updateTheme = React.useCallback((updates: Partial<ThemeConfig>) => {
		setConfig((prev) => {
			const next = { ...prev, ...updates };
			applyTheme(next);
			return next;
		});
	}, []);

	const resetTheme = React.useCallback(() => {
		setConfig(DEFAULT_THEME_CONFIG);
		applyTheme(DEFAULT_THEME_CONFIG);
	}, []);

	const applyPreset = React.useCallback((input: string): boolean => {
		const decoded = decodePresetCode(input);
		if (!decoded) return false;
		setConfig((prev) => {
			const next: ThemeConfig = {
				...prev,
				baseColor:
					decoded.baseColor && BASE_COLORS[decoded.baseColor]
						? decoded.baseColor
						: prev.baseColor,
				theme:
					decoded.theme && THEME_COLORS[decoded.theme]
						? decoded.theme
						: prev.theme,
				chartColor:
					decoded.chartColor && CHART_COLORS[decoded.chartColor]
						? decoded.chartColor
						: prev.chartColor,
				radius: decoded.radius ?? prev.radius,
				font: decoded.font ?? prev.font,
				menuAccent: decoded.menuAccent ?? prev.menuAccent,
			};
			applyTheme(next);
			return next;
		});
		return true;
	}, []);

	const configRef = React.useRef(config);
	React.useEffect(() => {
		configRef.current = config;
	}, [config]);

	const toggleMode = React.useCallback(() => {
		setConfig((prev) => {
			const nextMode: ThemeConfig["mode"] =
				prev.mode === "light"
					? "dark"
					: prev.mode === "dark"
						? "system"
						: "light";
			const next: ThemeConfig = { ...prev, mode: nextMode };
			applyTheme(next);
			return next;
		});
	}, []);

	// Initial apply on mount
	React.useEffect(() => {
		const stored = getStoredThemeConfig();
		setConfig(stored);
		applyTheme(stored);

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const listener = () => {
			if (configRef.current.mode === "system") {
				applyTheme(configRef.current);
			}
		};
		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	}, []);

	const value = React.useMemo(
		() => ({
			config,
			presetCode,
			updateTheme,
			resetTheme,
			applyPreset,
			toggleMode,
			downloadedFonts,
			loadFont,
			unloadFont,
			clearAllDownloadedFonts,
		}),
		[
			config,
			presetCode,
			updateTheme,
			resetTheme,
			applyPreset,
			toggleMode,
			downloadedFonts,
			loadFont,
			unloadFont,
			clearAllDownloadedFonts,
		],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextType {
	const context = React.useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
