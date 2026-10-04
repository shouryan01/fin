import * as React from "react";
import { FinLogo } from "#/components/fin-logo";
import { getStoredSplashSettings, triggerSplashPreview } from "#/lib/splash";

export { triggerSplashPreview };

interface SplashScreenProps {
	/**
	 * Optional duration in milliseconds to display the splash screen before fading out.
	 * If omitted, uses the stored duration setting (default 300ms).
	 */
	duration?: number;
	/**
	 * Optional enabled flag. If omitted, uses the stored enabled setting.
	 */
	enabled?: boolean;
}

export function SplashScreen(props: SplashScreenProps = {}) {
	const initialSettings = React.useMemo(() => getStoredSplashSettings(), []);
	const isEnabled = props.enabled ?? initialSettings.enabled;
	const configuredDuration = props.duration ?? initialSettings.duration;

	const [visible, setVisible] = React.useState(isEnabled);
	const [fading, setFading] = React.useState(false);

	const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const unmountRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const showSplash = React.useCallback((stayDuration: number) => {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (unmountRef.current) clearTimeout(unmountRef.current);

		setVisible(true);
		setFading(false);

		timerRef.current = setTimeout(() => {
			setFading(true);
			unmountRef.current = setTimeout(() => {
				setVisible(false);
			}, 200);
		}, stayDuration);
	}, []);

	React.useEffect(() => {
		// Reveal the native window immediately now that the root is ready to paint
		import("@tauri-apps/api/webviewWindow")
			.then(({ getCurrentWebviewWindow }) => {
				const appWindow = getCurrentWebviewWindow();
				appWindow.show();
				appWindow.setFocus();
			})
			.catch(() => {});

		// Initial launch splash only if enabled
		if (isEnabled) {
			showSplash(configuredDuration);
		}

		// Allow previewing on demand (regardless of startup toggle)
		const handlePreview = (e: Event) => {
			const customEvent = e as CustomEvent<{ duration?: number }>;
			const stayDuration =
				customEvent.detail?.duration ?? getStoredSplashSettings().duration;
			showSplash(stayDuration);
		};

		window.addEventListener("fin:preview-splash", handlePreview);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (unmountRef.current) clearTimeout(unmountRef.current);
			window.removeEventListener("fin:preview-splash", handlePreview);
		};
	}, [isEnabled, configuredDuration, showSplash]);

	if (!visible) return null;

	return (
		<div
			data-tauri-drag-region
			style={
				{
					position: "fixed",
					inset: 0,
					zIndex: 99999,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#090d16",
					color: "#ffffff",
					userSelect: "none",
					WebkitUserSelect: "none",
					WebkitAppRegion: "drag",
					transition: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)",
					opacity: fading ? 0 : 1,
					pointerEvents: fading ? "none" : "auto",
				} as React.CSSProperties
			}
		>
			{/* Ambient radial glow */}
			<div
				style={{
					position: "absolute",
					width: "280px",
					height: "280px",
					borderRadius: "9999px",
					backgroundColor: "rgba(59, 130, 246, 0.18)",
					filter: "blur(48px)",
					pointerEvents: "none",
				}}
			/>

			{/* Center logo with glowing shadow */}
			<div
				style={{
					position: "relative",
					zIndex: 10,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<FinLogo className="size-24 drop-shadow-2xl" />
			</div>
		</div>
	);
}
