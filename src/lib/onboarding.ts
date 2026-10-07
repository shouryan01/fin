import * as React from "react";

export interface OnboardingSettings {
	/**
	 * Whether the user has completed the initial onboarding tour.
	 * Default: false
	 */
	completed: boolean;
	/**
	 * Whether demo accounts and sample transactions should be loaded.
	 * Default: true
	 */
	loadSampleData: boolean;
	/**
	 * Configured expense categories.
	 * Default: ["Groceries", "Dining", "Transport", "Housing", "Misc"]
	 */
	categories: string[];
}

export const DEFAULT_CATEGORIES = [
	"Groceries",
	"Dining",
	"Transport",
	"Housing",
	"Misc",
] as const;

export const DEFAULT_ONBOARDING_SETTINGS: OnboardingSettings = {
	completed: false,
	loadSampleData: true,
	categories: [...DEFAULT_CATEGORIES],
};

const STORAGE_KEY = "fin-onboarding-settings";
const SETTINGS_CHANGE_EVENT = "fin:onboarding-settings-change";
const OPEN_ONBOARDING_EVENT = "fin:open-onboarding";

export function getStoredOnboardingSettings(): OnboardingSettings {
	if (typeof window === "undefined") return DEFAULT_ONBOARDING_SETTINGS;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			return {
				completed:
					typeof parsed.completed === "boolean"
						? parsed.completed
						: DEFAULT_ONBOARDING_SETTINGS.completed,
				loadSampleData:
					typeof parsed.loadSampleData === "boolean"
						? parsed.loadSampleData
						: DEFAULT_ONBOARDING_SETTINGS.loadSampleData,
				categories:
					Array.isArray(parsed.categories) && parsed.categories.length > 0
						? parsed.categories
						: [...DEFAULT_CATEGORIES],
			};
		}
	} catch {
		// Fallback to default on storage parse failure
	}
	return DEFAULT_ONBOARDING_SETTINGS;
}

export function saveOnboardingSettings(settings: OnboardingSettings): void {
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
 * Triggers the onboarding modal to open from anywhere in the application (e.g. Settings).
 * @param startStep Optional 0-indexed step to begin the onboarding tour at (defaults to 0).
 */
export function replayOnboarding(startStep = 0): void {
	if (typeof window !== "undefined") {
		window.dispatchEvent(
			new CustomEvent(OPEN_ONBOARDING_EVENT, {
				detail: { startStep },
			}),
		);
	}
}

export function useOnboardingSettings() {
	const [settings, setSettings] = React.useState<OnboardingSettings>(() =>
		getStoredOnboardingSettings(),
	);

	React.useEffect(() => {
		const handleSettingsChange = (e: Event) => {
			const customEvent = e as CustomEvent<OnboardingSettings>;
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
		(updates: Partial<OnboardingSettings>) => {
			setSettings((prev) => {
				const next = { ...prev, ...updates };
				saveOnboardingSettings(next);
				return next;
			});
		},
		[],
	);

	const resetCategories = React.useCallback(() => {
		updateSettings({ categories: [...DEFAULT_CATEGORIES] });
	}, [updateSettings]);

	const addCategory = React.useCallback((name: string) => {
		const trimmed = name.trim();
		if (!trimmed) return;
		setSettings((prev) => {
			if (
				prev.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
			) {
				return prev;
			}
			const next = { ...prev, categories: [...prev.categories, trimmed] };
			saveOnboardingSettings(next);
			return next;
		});
	}, []);

	const removeCategory = React.useCallback((name: string) => {
		setSettings((prev) => {
			const next = {
				...prev,
				categories: prev.categories.filter((c) => c !== name),
			};
			saveOnboardingSettings(next);
			return next;
		});
	}, []);

	const setSampleData = React.useCallback(
		(enabled: boolean) => {
			updateSettings({ loadSampleData: enabled });
		},
		[updateSettings],
	);

	const markCompleted = React.useCallback(
		(completed = true) => {
			updateSettings({ completed });
		},
		[updateSettings],
	);

	return {
		settings,
		updateSettings,
		resetCategories,
		addCategory,
		removeCategory,
		setSampleData,
		markCompleted,
		replay: replayOnboarding,
	};
}
