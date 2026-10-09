import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Bell,
	Check,
	ChevronRight,
	Copy,
	Database,
	DollarSign,
	Keyboard,
	Laptop,
	Loader2,
	Monitor,
	Moon,
	Palette,
	Play,
	RotateCcw,
	Shield,
	Sparkles,
	Sun,
	Timer,
} from "lucide-react";
import * as React from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import { clearSampleData, seedSampleData } from "#/db";
import { replayOnboarding, useOnboardingSettings } from "#/lib/onboarding";
import {
	MAX_SPLASH_DURATION,
	MIN_SPLASH_DURATION,
	SPLASH_DURATION_STEP,
	SPLASH_PRESETS,
	useSplashSettings,
} from "#/lib/splash";
import {
	BASE_COLORS_OPTIONS,
	FONTS_OPTIONS,
	THEME_COLORS_OPTIONS,
	useTheme,
} from "#/lib/theme";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { config, presetCode, updateTheme } = useTheme();
	const {
		settings: splashSettings,
		updateSettings: updateSplashSettings,
		resetDuration: resetSplashDuration,
		preview: previewSplash,
	} = useSplashSettings();
	const { settings: onboardingSettings, setSampleData } =
		useOnboardingSettings();
	const queryClient = useQueryClient();
	const [isTogglingSampleData, setIsTogglingSampleData] = React.useState(false);

	const handleToggleSampleData = React.useCallback(
		async (checked: boolean) => {
			setIsTogglingSampleData(true);
			setSampleData(checked);
			try {
				if (checked) {
					await seedSampleData({ force: true });
				} else {
					await clearSampleData();
				}
				await queryClient.invalidateQueries();
			} catch (err) {
				console.error("[Settings] Failed to toggle sample data:", err);
			} finally {
				setIsTogglingSampleData(false);
			}
		},
		[setSampleData, queryClient],
	);

	const [hasCopied, setHasCopied] = React.useState(false);

	const activeThemeColor =
		THEME_COLORS_OPTIONS.find((t) => t.id === config.theme) ??
		THEME_COLORS_OPTIONS[0];
	const activeBaseColor =
		BASE_COLORS_OPTIONS.find((b) => b.id === config.baseColor) ??
		BASE_COLORS_OPTIONS[0];
	const activeFont =
		FONTS_OPTIONS.find((f) => f.id === config.font) ?? FONTS_OPTIONS[0];

	const handleCopy = () => {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(presetCode);
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2000);
		}
	};

	return (
		<div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-5xl mx-auto w-full">
			{/* Header */}
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
					Settings
				</h1>
				<p className="text-sm text-muted-foreground">
					Manage your appearance, theme customization, preferences, and local
					data.
				</p>
			</div>

			<div className="flex flex-col gap-6">
				{/* 1. Theme & Appearance Section */}
				<Card>
					<CardHeader>
						<div className="flex flex-col gap-1">
							<CardTitle className="text-base flex items-center gap-2">
								<Palette className="size-4 text-primary" />
								Appearance & Theme
							</CardTitle>
							<CardDescription>
								Control the light/dark mode and interface styling. Custom themes
								apply across the entire application instantly.
							</CardDescription>
						</div>
						<CardAction>
							<Button render={<Link to="/settings/theme" />} size="sm">
								<Palette data-icon="inline-start" />
								Customize theme
								<ChevronRight data-icon="inline-end" />
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						{/* Mode Switcher */}
						<div className="flex flex-col gap-3">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Theme Mode
							</span>
							<div className="grid grid-cols-3 gap-3 max-w-md">
								{[
									{ id: "light", name: "Light", icon: Sun },
									{ id: "dark", name: "Dark", icon: Moon },
									{ id: "system", name: "System", icon: Monitor },
								].map((item) => {
									const isActive = config.mode === item.id;
									const Icon = item.icon;
									return (
										<button
											type="button"
											key={item.id}
											onClick={() =>
												updateTheme({
													mode: item.id as "light" | "dark" | "system",
												})
											}
											className={cn(
												"flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer text-xs font-medium",
												isActive
													? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30 shadow-xs"
													: "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground",
											)}
										>
											<Icon className="size-4" />
											<span>{item.name}</span>
										</button>
									);
								})}
							</div>
						</div>

						<Separator />

						{/* Current Theme Details Summary */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									Active Preset Configuration
								</span>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="font-mono text-xs px-2.5 py-0.5"
									>
										{presetCode}
									</Badge>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={handleCopy}
										title="Copy preset code"
									>
										{hasCopied ? (
											<Check className="size-3 text-primary" />
										) : (
											<Copy className="size-3 text-muted-foreground" />
										)}
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{/* Theme Color */}
								<div className="flex flex-col gap-1 p-3 rounded-xl border border-border/60 bg-muted/20">
									<span className="text-[11px] text-muted-foreground">
										Theme Color
									</span>
									<div className="flex items-center gap-2 mt-0.5">
										<span
											className="size-3 rounded-full shrink-0 shadow-2xs"
											style={{ backgroundColor: activeThemeColor.color }}
										/>
										<span className="text-xs font-semibold capitalize text-foreground">
											{config.theme}
										</span>
									</div>
								</div>

								{/* Base Color */}
								<div className="flex flex-col gap-1 p-3 rounded-xl border border-border/60 bg-muted/20">
									<span className="text-[11px] text-muted-foreground">
										Base Palette
									</span>
									<div className="flex items-center gap-2 mt-0.5">
										<span
											className="size-3 rounded-full shrink-0 shadow-2xs border border-white/10"
											style={{ backgroundColor: activeBaseColor.color }}
										/>
										<span className="text-xs font-semibold capitalize text-foreground">
											{config.baseColor}
										</span>
									</div>
								</div>

								{/* Font */}
								<div className="flex flex-col gap-1 p-3 rounded-xl border border-border/60 bg-muted/20">
									<span className="text-[11px] text-muted-foreground">
										Font Family
									</span>
									<span
										className="text-xs font-semibold capitalize text-foreground truncate mt-0.5"
										style={{ fontFamily: activeFont.fontFamily }}
									>
										{activeFont.name}
									</span>
								</div>

								{/* Menu Accent */}
								<div className="flex flex-col gap-1 p-3 rounded-xl border border-border/60 bg-muted/20">
									<span className="text-[11px] text-muted-foreground">
										Menu Accent
									</span>
									<span className="text-xs font-semibold capitalize text-foreground mt-0.5">
										{config.menuAccent}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter className="bg-muted/30 border-t border-border/40 py-3 px-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
						<span className="text-xs text-muted-foreground">
							Customize all 17 colors, 17 chart palettes, corner radius, fonts,
							and accents.
						</span>
						<Button
							render={<Link to="/settings/theme" />}
							variant="outline"
							size="sm"
							className="shrink-0"
						>
							<Sparkles data-icon="inline-start" />
							Customize theme
						</Button>
					</CardFooter>
				</Card>

				{/* 2. Startup & Splash Screen */}
				<Card>
					<CardHeader>
						<div className="flex flex-col gap-1">
							<CardTitle className="text-base flex items-center gap-2">
								<Timer className="size-4 text-primary" />
								Startup & Splash Screen
							</CardTitle>
							<CardDescription>
								Configure whether the animated splash screen is displayed at
								launch and customize its display time.
							</CardDescription>
						</div>
						<CardAction>
							<Button
								variant="outline"
								size="sm"
								onClick={() => previewSplash()}
								title="Preview splash screen animation"
							>
								<Play data-icon="inline-start" className="size-3.5" />
								Preview splash
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						{/* Toggle Splash Screen */}
						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-semibold text-foreground">
									Show Splash Screen on Startup
								</span>
								<span className="text-[11px] text-muted-foreground">
									Display the fin logo animation when the desktop app launches
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant={splashSettings.enabled ? "default" : "secondary"}
									className="text-xs font-medium"
								>
									{splashSettings.enabled ? "Enabled" : "Disabled"}
								</Badge>
								<Switch
									checked={splashSettings.enabled}
									onCheckedChange={(checked) =>
										updateSplashSettings({ enabled: checked })
									}
								/>
							</div>
						</div>

						{/* Duration Control */}
						<div
							className={cn(
								"flex flex-col gap-4 transition-opacity",
								!splashSettings.enabled && "opacity-60",
							)}
						>
							<div className="flex items-center justify-between">
								<div className="flex flex-col gap-0.5">
									<span className="text-xs font-semibold text-foreground">
										Display Duration
									</span>
									<span className="text-[11px] text-muted-foreground">
										How long the logo remains visible before fading out
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="font-mono text-xs px-2.5 py-0.5"
									>
										{splashSettings.duration} ms
										{splashSettings.duration >= 1000 &&
											` (${(splashSettings.duration / 1000).toFixed(1)}s)`}
									</Badge>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={resetSplashDuration}
										title="Reset to default duration (300ms)"
									>
										<RotateCcw className="size-3 text-muted-foreground" />
									</Button>
								</div>
							</div>

							{/* Slider */}
							<div className="px-1 py-1">
								<Slider
									value={[splashSettings.duration]}
									min={MIN_SPLASH_DURATION}
									max={MAX_SPLASH_DURATION}
									step={SPLASH_DURATION_STEP}
									onValueChange={(val) => {
										const nextVal = Array.isArray(val) ? val[0] : val;
										if (typeof nextVal === "number") {
											updateSplashSettings({ duration: nextVal });
										}
									}}
									disabled={!splashSettings.enabled}
								/>
								<div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2 font-mono">
									<span>100 ms (Fast)</span>
									<span>1.0 s</span>
									<span>2.0 s</span>
									<span>3.0 s (Long)</span>
								</div>
							</div>

							{/* Quick Presets */}
							<div className="flex flex-col gap-2">
								<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
									Duration Presets
								</span>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
									{SPLASH_PRESETS.map((preset) => {
										const isSelected =
											splashSettings.duration === preset.duration;
										return (
											<button
												type="button"
												key={preset.id}
												disabled={!splashSettings.enabled}
												onClick={() =>
													updateSplashSettings({
														duration: preset.duration,
													})
												}
												className={cn(
													"flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs transition-all cursor-pointer",
													isSelected
														? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30 shadow-2xs"
														: "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground",
													!splashSettings.enabled &&
														"pointer-events-none opacity-50",
												)}
											>
												<span>{preset.label}</span>
												<span className="font-mono text-[10px] opacity-75">
													{preset.duration} ms
												</span>
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter className="bg-muted/30 border-t border-border/40 py-3 px-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
						<span>
							Settings are saved locally and apply instantly to previews and
							subsequent launches.
						</span>
						<Button
							variant="outline"
							size="sm"
							className="shrink-0"
							onClick={() => previewSplash()}
						>
							<Play data-icon="inline-start" className="size-3.5" />
							Test animation
						</Button>
					</CardFooter>
				</Card>

				{/* 3. Onboarding & Guided Tour */}
				<Card>
					<CardHeader>
						<div className="flex flex-col gap-1">
							<CardTitle className="text-base flex items-center gap-2">
								<Sparkles className="size-4 text-primary" />
								Onboarding & Guided Tour
							</CardTitle>
							<CardDescription>
								Review the introductory tour, learn how bank imports work, or
								configure default expense categories and demo data.
							</CardDescription>
						</div>
						<CardAction>
							<Button
								variant="outline"
								size="sm"
								onClick={() => replayOnboarding(0)}
								title="Replay introductory onboarding tour"
							>
								<RotateCcw data-icon="inline-start" className="size-3.5" />
								Replay Onboarding
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-5">
						{/* Replay action row */}
						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-semibold text-foreground">
									Interactive App Walkthrough
								</span>
								<span className="text-[11px] text-muted-foreground">
									Restart the 5-step tour covering CSV imports, monthly
									dashboard, categories, and demo data.
								</span>
							</div>
							<Button
								size="sm"
								onClick={() => replayOnboarding(0)}
								className="shrink-0 cursor-pointer"
							>
								<Play data-icon="inline-start" className="size-3.5" />
								Launch Tour
							</Button>
						</div>

						{/* Sample Data Toggle */}
						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-semibold text-foreground">
									Load Demo Sample Data
								</span>
								<span className="text-[11px] text-muted-foreground">
									Populate accounts and transactions with realistic numbers.
									Turn off to start with a blank ledger.
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant={
										onboardingSettings.loadSampleData ? "default" : "secondary"
									}
									className="text-xs font-medium"
								>
									{isTogglingSampleData ? (
										<span className="flex items-center gap-1">
											<Loader2 className="size-3 animate-spin" />
											Updating...
										</span>
									) : onboardingSettings.loadSampleData ? (
										"Sample Data Active"
									) : (
										"Clean Slate"
									)}
								</Badge>
								<Switch
									checked={onboardingSettings.loadSampleData}
									disabled={isTogglingSampleData}
									onCheckedChange={handleToggleSampleData}
								/>
							</div>
						</div>

						{/* Active Categories Summary */}
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
									Active Categories ({onboardingSettings.categories.length})
								</span>
								<Button
									variant="ghost"
									size="xs"
									onClick={() => replayOnboarding(3)}
									className="text-xs text-primary hover:text-primary cursor-pointer"
								>
									Manage in tour
								</Button>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{onboardingSettings.categories.map((cat) => (
									<Badge
										key={cat}
										variant="outline"
										className="text-xs font-normal bg-background/60"
									>
										{cat}
									</Badge>
								))}
							</div>
						</div>
					</CardContent>
					<CardFooter className="bg-muted/30 border-t border-border/40 py-3 px-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
						<span>
							You can restart the tour anytime without losing your saved custom
							categories.
						</span>
						<Button
							variant="outline"
							size="sm"
							className="shrink-0"
							onClick={() => replayOnboarding(0)}
						>
							<RotateCcw data-icon="inline-start" className="size-3.5" />
							Restart Tour
						</Button>
					</CardFooter>
				</Card>

				{/* 4. Preferences & Regional */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<DollarSign className="size-4 text-primary" />
							Currency & Formats
						</CardTitle>
						<CardDescription>
							Format currency amounts, decimal separators, and calendar dates
							across accounts and reports.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-medium text-foreground">
									Primary Currency
								</span>
								<span className="text-[11px] text-muted-foreground">
									Default currency symbol for account balances and net worth
								</span>
							</div>
							<Badge variant="secondary" className="font-mono text-xs">
								USD ($)
							</Badge>
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-medium text-foreground">
									Date Format
								</span>
								<span className="text-[11px] text-muted-foreground">
									How transaction dates appear in lists and tables
								</span>
							</div>
							<Badge variant="secondary" className="font-mono text-xs">
								MMM DD, YYYY
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* 3. Notifications */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<Bell className="size-4 text-primary" />
							Notifications & Alerts
						</CardTitle>
						<CardDescription>
							Receive system notifications for low account thresholds and
							unexpected transactions.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-medium text-foreground">
									Low Balance Alerts
								</span>
								<span className="text-[11px] text-muted-foreground">
									Notify when checking or savings account drops below $500
								</span>
							</div>
							<Switch defaultChecked />
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-medium text-foreground">
									Large Transaction Alert
								</span>
								<span className="text-[11px] text-muted-foreground">
									Alert on single expenses over $1,000
								</span>
							</div>
							<Switch defaultChecked />
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-medium text-foreground">
									Weekly Spending Digest
								</span>
								<span className="text-[11px] text-muted-foreground">
									Summary breakdown of weekly cash flow every Sunday evening
								</span>
							</div>
							<Switch />
						</div>
					</CardContent>
				</Card>

				{/* 4. Privacy & Local Storage */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<Shield className="size-4 text-primary" />
							Privacy & Local Storage
						</CardTitle>
						<CardDescription>
							fin stores all financial data and custom themes strictly on your
							local device.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<div className="flex flex-col gap-0.5">
								<div className="flex items-center gap-2">
									<Database className="size-3.5 text-primary" />
									<span className="text-xs font-medium text-foreground">
										Local Data Engine
									</span>
								</div>
								<span className="text-[11px] text-muted-foreground">
									Encrypted local storage with zero cloud tracking
								</span>
							</div>
							<Badge variant="outline" className="text-xs">
								Local Only
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* 5. Keyboard Shortcuts */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<Keyboard className="size-4 text-primary" />
							Keyboard Shortcuts
						</CardTitle>
						<CardDescription>
							Quick navigation shortcuts across the application.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<span className="text-xs font-medium text-foreground">
								Open Settings
							</span>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									⌘ / Ctrl
								</kbd>
								<span className="text-xs text-muted-foreground">+</span>
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									,
								</kbd>
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<span className="text-xs font-medium text-foreground">
								Open Dashboard
							</span>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									⌘ / Ctrl
								</kbd>
								<span className="text-xs text-muted-foreground">+</span>
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									1
								</kbd>
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<span className="text-xs font-medium text-foreground">
								Open Accounts
							</span>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									⌘ / Ctrl
								</kbd>
								<span className="text-xs text-muted-foreground">+</span>
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									2
								</kbd>
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<span className="text-xs font-medium text-foreground">
								Open Transactions
							</span>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									⌘ / Ctrl
								</kbd>
								<span className="text-xs text-muted-foreground">+</span>
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									3
								</kbd>
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<span className="text-xs font-medium text-foreground">
								Customize Theme
							</span>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									⌘ / Ctrl
								</kbd>
								<span className="text-xs text-muted-foreground">+</span>
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									Shift
								</kbd>
								<span className="text-xs text-muted-foreground">+</span>
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									T
								</kbd>
							</div>
						</div>

						<div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20">
							<span className="text-xs font-medium text-foreground">
								Toggle Sidebar
							</span>
							<div className="flex items-center gap-1">
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									⌘ / Ctrl
								</kbd>
								<span className="text-xs text-muted-foreground">+</span>
								<kbd className="px-2 py-0.5 text-xs font-mono rounded-md border border-border/80 bg-background shadow-2xs text-muted-foreground">
									B
								</kbd>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 6. System Info */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
							<Laptop className="size-4" />
							About fin
						</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<span>fin Desktop v0.1.0 • Tauri 2.0 • React 19 • shadcn/ui</span>
						<span className="font-mono text-[11px]">Preset: {presetCode}</span>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
