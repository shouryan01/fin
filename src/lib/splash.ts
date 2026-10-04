import * as React from "react";

export interface SplashSettings {
	/**
	 * Whether the splash screen displays on application launch.
	 * Default: false
	 */
	enabled: boolean;
	/**
	 * Duration in milliseconds to hold the splash screen before fading out.
	 * Range: 100ms - 3000ms. Default: 300ms.
	 */
	duration: number;
}

export const DEFAULT_SPLASH_SETTINGS: SplashSettings = {
	enabled: false,
	duration: 300,
};

export const MIN_SPLASH_DURATION = 100;
export const MAX_SPLASH_DURATION = 3000;
export const SPLASH_DURATION_STEP = 50;

export const SPLASH_PRESETS = [
	{ id: "snappy", label: "Snappy", duration: 150 },
	{ id: "default", label: "Default", duration: 300 },
	{ id: "smooth", label: "Smooth", duration: 600 },
	{ id: "cinematic", label: "Cinematic", duration: 1200 },
] as const;

const STORAGE_KEY = "fin-splash-settings";
const SETTINGS_CHANGE_EVENT = "fin:splash-settings-change";

export function getStoredSplashSettings(): SplashSettings {
	if (typeof window === "undefined") return DEFAULT_SPLASH_SETTINGS;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			return {
				enabled:
					typeof parsed.enabled === "boolean"
						? parsed.enabled
						: DEFAULT_SPLASH_SETTINGS.enabled,
				duration:
					typeof parsed.duration === "number" && !Number.isNaN(parsed.duration)
						? Math.min(
								Math.max(parsed.duration, MIN_SPLASH_DURATION),
								MAX_SPLASH_DURATION,
							)
						: DEFAULT_SPLASH_SETTINGS.duration,
			};
		}
	} catch {
		// Fallback to defaults if parsing fails
	}
	return DEFAULT_SPLASH_SETTINGS;
}

export function saveSplashSettings(settings: SplashSettings): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		window.dispatchEvent(
			new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }),
		);
	} catch {
		// Ignore storage quota errors
	}
}

/**
 * Triggers the splash screen overlay to display on demand (e.g. for previewing).
 * @param previewDuration Duration in ms to keep the logo displayed before fading out.
 * If omitted, defaults to the user's stored duration.
 */
export function triggerSplashPreview(previewDuration?: number) {
	if (typeof window !== "undefined") {
		const duration = previewDuration ?? getStoredSplashSettings().duration;
		window.dispatchEvent(
			new CustomEvent("fin:preview-splash", {
				detail: { duration },
			}),
		);
	}
}

export function useSplashSettings() {
	const [settings, setSettings] = React.useState<SplashSettings>(() =>
		getStoredSplashSettings(),
	);

	React.useEffect(() => {
		const handleSettingsChange = (e: Event) => {
			const customEvent = e as CustomEvent<SplashSettings>;
			if (customEvent.detail) {
				setSettings(customEvent.detail);
			}
		};

		window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
		return () => {
			window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
		};
	}, []);

	const updateSettings = React.useCallback(
		(updates: Partial<SplashSettings>) => {
			setSettings((prev) => {
				const next = { ...prev, ...updates };
				saveSplashSettings(next);
				return next;
			});
		},
		[],
	);

	const resetSettings = React.useCallback(() => {
		setSettings(DEFAULT_SPLASH_SETTINGS);
		saveSplashSettings(DEFAULT_SPLASH_SETTINGS);
	}, []);

	const resetDuration = React.useCallback(() => {
		updateSettings({ duration: DEFAULT_SPLASH_SETTINGS.duration });
	}, [updateSettings]);

	const preview = React.useCallback(
		(durationOverride?: number) => {
			triggerSplashPreview(durationOverride ?? settings.duration);
		},
		[settings.duration],
	);

	return {
		settings,
		updateSettings,
		resetSettings,
		resetDuration,
		preview,
	};
}
