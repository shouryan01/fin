import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

export interface NavigationShortcut {
	key: string;
	to: string;
	label: string;
	description?: string;
	metaOrCtrl?: boolean;
	shift?: boolean;
}

export const NAVIGATION_SHORTCUTS: NavigationShortcut[] = [
	{
		key: ",",
		to: "/settings",
		label: "Settings",
		description: "Open settings",
		metaOrCtrl: true,
	},
	{
		key: "1",
		to: "/",
		label: "Dashboard",
		description: "Open dashboard",
		metaOrCtrl: true,
	},
	{
		key: "2",
		to: "/accounts",
		label: "Accounts",
		description: "Open accounts",
		metaOrCtrl: true,
	},
	{
		key: "3",
		to: "/transactions",
		label: "Transactions",
		description: "Open transactions",
		metaOrCtrl: true,
	},
	{
		key: "t",
		to: "/settings/theme",
		label: "Theme Settings",
		description: "Open theme settings",
		metaOrCtrl: true,
		shift: true,
	},
];

function isEditableTarget(target: EventTarget | null): boolean {
	if (!target || !(target instanceof HTMLElement)) {
		return false;
	}

	const tagName = target.tagName.toLowerCase();
	return (
		target.isContentEditable ||
		tagName === "input" ||
		tagName === "textarea" ||
		tagName === "select"
	);
}

/**
 * Hook to listen for global navigation shortcuts (e.g. Cmd/Ctrl + , to open settings).
 */
export function useNavigationShortcuts() {
	const navigate = useNavigate();

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Ignore events if user is typing in form inputs, textareas, or contentEditable elements,
			// EXCEPT if meta/ctrl modifier is used, Cmd+, or Cmd+1-9 might still be desired.
			// However, Cmd+, is standard OS convention even within text boxes (e.g. Preferences in macOS).
			// Let's allow Cmd/Ctrl shortcuts unless prevented.
			const hasMetaOrCtrl = event.metaKey || event.ctrlKey;

			for (const shortcut of NAVIGATION_SHORTCUTS) {
				const matchesKey =
					event.key.toLowerCase() === shortcut.key.toLowerCase();
				const matchesMetaOrCtrl = shortcut.metaOrCtrl
					? hasMetaOrCtrl
					: !hasMetaOrCtrl;
				const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;

				if (matchesKey && matchesMetaOrCtrl && matchesShift) {
					// Check if target is an editable field and if we should allow or block
					// Cmd+, is standard app preferences so allow it everywhere.
					// Cmd+1/2/3 navigation is safe as it doesn't conflict with text editing keys.
					if (isEditableTarget(event.target)) {
						// Don't intercept if it's standard text editing shortcuts, but Cmd+, / Cmd+1-3 are safe
					}

					event.preventDefault();
					navigate({ to: shortcut.to });
					return;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [navigate]);
}
