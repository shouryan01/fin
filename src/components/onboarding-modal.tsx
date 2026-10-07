import {
	ArrowLeft,
	ArrowRight,
	ArrowUpRight,
	Banknote,
	Check,
	FileSpreadsheet,
	Plus,
	RotateCcw,
	ShieldCheck,
	Sparkles,
	Wallet,
	X,
} from "lucide-react";
import * as React from "react";
import { FinLogo } from "#/components/fin-logo";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import {
	getStoredOnboardingSettings,
	useOnboardingSettings,
} from "#/lib/onboarding";
import { cn } from "#/lib/utils";

interface StepTheme {
	accentColor: string;
	badgeBg: string;
	badgeText: string;
	glowColor1: string;
	glowColor2: string;
	dotColor: string;
}

const STEP_THEMES: StepTheme[] = [
	// Step 1: Welcome (Electric Indigo & Blue)
	{
		accentColor: "#6366f1",
		badgeBg: "rgba(99, 102, 241, 0.12)",
		badgeText: "#818cf8",
		glowColor1: "rgba(99, 102, 241, 0.25)",
		glowColor2: "rgba(59, 130, 246, 0.20)",
		dotColor: "#6366f1",
	},
	// Step 2: Works with Any Bank (Emerald & Teal)
	{
		accentColor: "#10b981",
		badgeBg: "rgba(16, 185, 129, 0.12)",
		badgeText: "#34d399",
		glowColor1: "rgba(16, 185, 129, 0.24)",
		glowColor2: "rgba(20, 184, 166, 0.18)",
		dotColor: "#10b981",
	},
	// Step 3: Monthly at a Glance (Sky & Azure)
	{
		accentColor: "#0ea5e9",
		badgeBg: "rgba(14, 165, 233, 0.12)",
		badgeText: "#38bdf8",
		glowColor1: "rgba(14, 165, 233, 0.24)",
		glowColor2: "rgba(99, 102, 241, 0.18)",
		dotColor: "#0ea5e9",
	},
	// Step 4: Categories Setup (Fuchsia & Rose)
	{
		accentColor: "#d946ef",
		badgeBg: "rgba(217, 70, 239, 0.12)",
		badgeText: "#f472b6",
		glowColor1: "rgba(217, 70, 239, 0.22)",
		glowColor2: "rgba(244, 63, 94, 0.18)",
		dotColor: "#d946ef",
	},
	// Step 5: Demo Accounts (Amber & Gold)
	{
		accentColor: "#f59e0b",
		badgeBg: "rgba(245, 158, 11, 0.12)",
		badgeText: "#fbbf24",
		glowColor1: "rgba(245, 158, 11, 0.24)",
		glowColor2: "rgba(16, 185, 129, 0.16)",
		dotColor: "#f59e0b",
	},
];

export function OnboardingModal() {
	const {
		settings,
		addCategory,
		removeCategory,
		resetCategories,
		setSampleData,
		markCompleted,
	} = useOnboardingSettings();

	const [isOpen, setIsOpen] = React.useState(() => !settings.completed);
	const [currentStep, setCurrentStep] = React.useState(0);
	const [direction, setDirection] = React.useState<"next" | "prev">("next");
	const [newCategoryName, setNewCategoryName] = React.useState("");
	const [recentlyAddedCategory, setRecentlyAddedCategory] = React.useState<
		string | null
	>(null);

	const activeTheme = STEP_THEMES[currentStep] ?? STEP_THEMES[0];
	const inputRef = React.useRef<HTMLInputElement>(null);

	// Sync initial open state if user hasn't completed onboarding
	React.useEffect(() => {
		const stored = getStoredOnboardingSettings();
		if (!stored.completed) {
			setIsOpen(true);
		}
	}, []);

	// Handle external trigger to replay onboarding (from Settings or elsewhere)
	React.useEffect(() => {
		const handleOpen = (e: Event) => {
			const customEvent = e as CustomEvent<{ startStep?: number }>;
			const start = customEvent.detail?.startStep ?? 0;
			setCurrentStep(start);
			setDirection("next");
			setIsOpen(true);
		};

		window.addEventListener("fin:open-onboarding", handleOpen);
		return () => {
			window.removeEventListener("fin:open-onboarding", handleOpen);
		};
	}, []);

	const handleNext = React.useCallback(() => {
		if (currentStep < 4) {
			setDirection("next");
			setCurrentStep((s) => s + 1);
		} else {
			markCompleted(true);
			setIsOpen(false);
		}
	}, [currentStep, markCompleted]);

	const handlePrev = React.useCallback(() => {
		if (currentStep > 0) {
			setDirection("prev");
			setCurrentStep((s) => s - 1);
		}
	}, [currentStep]);

	const handleSkip = React.useCallback(() => {
		markCompleted(true);
		setIsOpen(false);
	}, [markCompleted]);

	const handleAddCategorySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = newCategoryName.trim();
		if (!trimmed) return;
		addCategory(trimmed);
		setRecentlyAddedCategory(trimmed);
		setNewCategoryName("");
		setTimeout(() => setRecentlyAddedCategory(null), 1000);
	};

	// Keyboard shortcut handling
	React.useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) {
				if (e.key === "Escape") {
					handleSkip();
				}
				return;
			}

			if (e.key === "ArrowRight") {
				handleNext();
			} else if (e.key === "ArrowLeft") {
				handlePrev();
			} else if (e.key === "Escape") {
				handleSkip();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleNext, handlePrev, handleSkip]);

	if (!isOpen) return null;

	return (
		<div
			data-tauri-drag-region
			className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md transition-opacity duration-300 select-none"
			style={
				{
					"--step-accent": activeTheme.accentColor,
				} as React.CSSProperties
			}
		>
			{/* Ambient Morphing Radial Glows */}
			<div
				className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden transition-all duration-700 ease-in-out"
				aria-hidden="true"
			>
				<div
					className="absolute w-[560px] h-[560px] rounded-full blur-3xl opacity-75 transition-all duration-700 ease-in-out animate-onboarding-glow"
					style={{
						backgroundColor: activeTheme.glowColor1,
						transform: `translate(${currentStep * 15 - 30}px, ${currentStep % 2 === 0 ? -20 : 20}px)`,
					}}
				/>
				<div
					className="absolute w-[420px] h-[420px] rounded-full blur-3xl opacity-60 transition-all duration-700 ease-in-out"
					style={{
						backgroundColor: activeTheme.glowColor2,
						transform: `translate(${30 - currentStep * 15}px, ${currentStep % 2 === 0 ? 30 : -30}px)`,
					}}
				/>
			</div>

			{/* Main Modal Card */}
			<div className="relative w-full max-w-2xl rounded-3xl border border-border/70 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-colors duration-500">
				{/* Top Modal Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
					<div className="flex items-center gap-2.5">
						<FinLogo className="size-7 shrink-0 transition-transform duration-300 hover:scale-105" />
						<span className="font-heading font-semibold text-sm tracking-tight text-foreground">
							fin setup
						</span>
						<Badge
							variant="outline"
							className="text-[11px] font-mono px-2 py-0 border-border/70 text-muted-foreground ml-1"
						>
							{currentStep + 1} / 5
						</Badge>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSkip}
							className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-7 px-2.5"
						>
							Skip tour
						</Button>
					</div>
				</div>

				{/* Step Content Area with spring slide transition */}
				<div className="relative p-6 sm:p-8 min-h-[420px] flex flex-col justify-between overflow-hidden">
					<div
						key={currentStep}
						className={cn(
							"flex-1 flex flex-col",
							direction === "next"
								? "animate-onboarding-slide-right"
								: "animate-onboarding-slide-left",
						)}
					>
						{/* STEP 1: WELCOME TO FIN */}
						{currentStep === 0 && (
							<div className="flex flex-col items-center text-center gap-6 my-auto">
								{/* Hero Visual */}
								<div className="relative flex items-center justify-center p-6 animate-onboarding-bounce">
									<div
										className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
										style={{ backgroundColor: activeTheme.glowColor1 }}
									/>
									<div className="relative size-24 sm:size-28 rounded-3xl border border-border/80 bg-background/80 shadow-xl flex items-center justify-center backdrop-blur-xs">
										<FinLogo className="size-16 sm:size-20 drop-shadow-md" />
									</div>
								</div>

								{/* Typography */}
								<div className="flex flex-col gap-2 max-w-lg">
									<span
										className="text-xs font-semibold tracking-wider uppercase font-mono transition-colors duration-500"
										style={{ color: activeTheme.badgeText }}
									>
										YOUR PERSONAL FINANCE TRACKER
									</span>
									<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
										Welcome to fin
									</h2>
									<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
										fin is a local-first finance app that lives entirely on your
										device. No cloud sync, no subscriptions — just a clear
										picture of your money.
									</p>
								</div>

								{/* Feature Badges */}
								<div className="flex flex-wrap items-center justify-center gap-2 mt-2">
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-xs font-medium text-foreground">
										<ShieldCheck className="size-3.5 text-primary" />
										<span>100% Local Device Storage</span>
									</div>
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-xs font-medium text-foreground">
										<Check className="size-3.5 text-primary" />
										<span>Zero Cloud Tracking</span>
									</div>
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-xs font-medium text-foreground">
										<Sparkles className="size-3.5 text-primary" />
										<span>No Recurring Fees</span>
									</div>
								</div>
							</div>
						)}

						{/* STEP 2: WORKS WITH ANY BANK (IMPORT TRANSACTIONS) */}
						{currentStep === 1 && (
							<div className="flex flex-col items-center text-center gap-6 my-auto">
								{/* Visual Dropzone Mock */}
								<div className="w-full max-w-md p-4 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 flex flex-col items-center gap-3 animate-onboarding-bounce">
									<div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center animate-onboarding-float">
										<FileSpreadsheet className="size-7" />
									</div>
									<div className="flex flex-col gap-1 items-center">
										<div className="flex items-center gap-2">
											<span className="text-xs font-medium text-foreground">
												Chase_Checking_2026.csv
											</span>
											<Badge
												variant="secondary"
												className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none"
											>
												42 rows
											</Badge>
										</div>
										<span className="text-[11px] text-muted-foreground">
											Drag and drop bank exports anytime
										</span>
									</div>

									{/* Parsing rules mock */}
									<div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-border/50 text-[11px]">
										<div className="flex items-center gap-1.5 text-muted-foreground justify-center">
											<Check className="size-3 text-emerald-500" />
											<span>Auto-detect headers</span>
										</div>
										<div className="flex items-center gap-1.5 text-muted-foreground justify-center">
											<Check className="size-3 text-emerald-500" />
											<span>Smart auto-categorize</span>
										</div>
									</div>
								</div>

								{/* Typography */}
								<div className="flex flex-col gap-2 max-w-lg">
									<span
										className="text-xs font-semibold tracking-wider uppercase font-mono transition-colors duration-500"
										style={{ color: activeTheme.badgeText }}
									>
										WORKS WITH ANY BANK
									</span>
									<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
										Import transactions
									</h2>
									<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
										Download a CSV from your bank and drag it into fin.
										Transactions are parsed automatically and categorised with
										smart rules.
									</p>
								</div>
							</div>
						)}

						{/* STEP 3: MONTHLY AT A GLANCE (DASHBOARD PREVIEW) */}
						{currentStep === 2 && (
							<div className="flex flex-col items-center text-center gap-6 my-auto">
								{/* Mini Metrics Preview */}
								<div className="grid grid-cols-3 gap-2.5 w-full max-w-md animate-onboarding-bounce">
									<div className="flex flex-col items-start p-3 rounded-2xl border border-border/80 bg-background/80 shadow-xs text-left">
										<span className="text-[11px] text-muted-foreground">
											Net Inflow
										</span>
										<span className="text-sm font-bold text-foreground mt-0.5">
											+$14,250
										</span>
										<span className="text-[10px] text-emerald-500 flex items-center gap-0.5 mt-1 font-medium">
											<ArrowUpRight className="size-3" /> +4.2%
										</span>
									</div>
									<div className="flex flex-col items-start p-3 rounded-2xl border border-border/80 bg-background/80 shadow-xs text-left">
										<span className="text-[11px] text-muted-foreground">
											Monthly Out
										</span>
										<span className="text-sm font-bold text-foreground mt-0.5">
											-$6,840
										</span>
										<span className="text-[10px] text-sky-500 flex items-center gap-0.5 mt-1 font-medium">
											On budget
										</span>
									</div>
									<div className="flex flex-col items-start p-3 rounded-2xl border border-border/80 bg-background/80 shadow-xs text-left">
										<span className="text-[11px] text-muted-foreground">
											Net Flow
										</span>
										<span className="text-sm font-bold text-emerald-500 mt-0.5">
											+$7,410
										</span>
										<span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-1">
											Saved 52%
										</span>
									</div>
								</div>

								{/* Typography */}
								<div className="flex flex-col gap-2 max-w-lg">
									<span
										className="text-xs font-semibold tracking-wider uppercase font-mono transition-colors duration-500"
										style={{ color: activeTheme.badgeText }}
									>
										MONTHLY AT A GLANCE
									</span>
									<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
										See the big picture
									</h2>
									<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
										The dashboard shows your income, spending, and net cash flow
										every month. Drill into any category or account to
										understand exactly where your money goes.
									</p>
								</div>
							</div>
						)}

						{/* STEP 4: CATEGORIES SETUP */}
						{currentStep === 3 && (
							<div className="flex flex-col gap-5 my-auto">
								<div className="flex flex-col gap-1 text-center sm:text-left">
									<span
										className="text-xs font-semibold tracking-wider uppercase font-mono transition-colors duration-500"
										style={{ color: activeTheme.badgeText }}
									>
										SMART CATEGORIZATION
									</span>
									<h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
										Add and edit categories
									</h2>
									<p className="text-xs sm:text-sm text-muted-foreground">
										fin uses categories to organize your expenses. Customize
										your default categories or add new ones:
									</p>
								</div>

								{/* Add Category Form */}
								<form
									onSubmit={handleAddCategorySubmit}
									className="flex items-center gap-2"
								>
									<Input
										ref={inputRef}
										value={newCategoryName}
										onChange={(e) => setNewCategoryName(e.target.value)}
										placeholder="e.g. Subscriptions, Health, Utilities..."
										className="text-xs sm:text-sm h-9 bg-background/80"
										maxLength={30}
									/>
									<Button
										type="submit"
										size="sm"
										className="h-9 px-4 shrink-0 cursor-pointer font-medium"
										disabled={!newCategoryName.trim()}
									>
										<Plus data-icon="inline-start" className="size-3.5" />
										Add
									</Button>
								</form>

								{/* Categories Pills Container */}
								<div className="p-4 rounded-2xl border border-border/80 bg-background/60 shadow-xs flex flex-col gap-3 min-h-[140px] justify-between">
									<div className="flex flex-wrap items-center gap-2">
										{settings.categories.map((cat) => {
											const isRecent = recentlyAddedCategory === cat;
											return (
												<div
													key={cat}
													className={cn(
														"group inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 select-none",
														isRecent
															? "animate-onboarding-pop border-fuchsia-500 bg-fuchsia-500/15 text-foreground ring-1 ring-fuchsia-500/30"
															: "border-border/70 bg-muted/40 hover:bg-muted/80 text-foreground",
													)}
												>
													<span
														className="size-1.5 rounded-full shrink-0"
														style={{ backgroundColor: activeTheme.accentColor }}
													/>
													<span>{cat}</span>
													{settings.categories.length > 1 && (
														<button
															type="button"
															onClick={() => removeCategory(cat)}
															className="size-4 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-foreground/10 transition-opacity cursor-pointer ml-0.5"
															title={`Remove ${cat}`}
														>
															<X className="size-3" />
														</button>
													)}
												</div>
											);
										})}
									</div>

									<div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
										<span>{settings.categories.length} active categories</span>
										<button
											type="button"
											onClick={resetCategories}
											className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
										>
											<RotateCcw className="size-3" />
											Reset to defaults
										</button>
									</div>
								</div>
							</div>
						)}

						{/* STEP 5: OPTIONAL DEMO ACCOUNTS (SAMPLE DATA) */}
						{currentStep === 4 && (
							<div className="flex flex-col gap-5 my-auto">
								<div className="flex flex-col gap-1 text-center sm:text-left">
									<span
										className="text-xs font-semibold tracking-wider uppercase font-mono transition-colors duration-500"
										style={{ color: activeTheme.badgeText }}
									>
										OPTIONAL DEMO ACCOUNTS
									</span>
									<h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
										Sample data
									</h2>
									<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
										Load a few demo accounts and months of transactions to
										explore the dashboard and imports with realistic numbers.
										Turn this off if you prefer to start from a blank ledger and
										add your own data.
									</p>
								</div>

								{/* Toggle Card */}
								<div className="flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-background/80 shadow-xs">
									<div className="flex flex-col gap-1 max-w-sm">
										<div className="flex items-center gap-2">
											<span className="text-sm font-semibold text-foreground">
												Load sample data
											</span>
											<Badge
												variant={
													settings.loadSampleData ? "default" : "secondary"
												}
												className="text-[10px] font-medium"
											>
												{settings.loadSampleData ? "Active" : "Blank Ledger"}
											</Badge>
										</div>
										<span className="text-[11px] text-muted-foreground leading-snug">
											Turn this off to start with no accounts or transactions.
											You can add sample data later from settings.
										</span>
									</div>

									<Switch
										checked={settings.loadSampleData}
										onCheckedChange={(checked) => setSampleData(checked)}
									/>
								</div>

								{/* Live Preview of Selected State */}
								<div className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 flex flex-col gap-2 min-h-[90px] justify-center transition-all duration-300">
									{settings.loadSampleData ? (
										<div className="flex flex-col gap-1.5 animate-onboarding-bounce">
											<span className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
												<Wallet className="size-3.5 text-amber-500" />
												Will include 4 sample accounts & 20+ transactions:
											</span>
											<div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
												<span className="p-1.5 rounded-lg bg-background border border-border/50 truncate">
													Checking · $4,250
												</span>
												<span className="p-1.5 rounded-lg bg-background border border-border/50 truncate">
													Savings · $32,100
												</span>
												<span className="p-1.5 rounded-lg bg-background border border-border/50 truncate">
													Card · -$840
												</span>
											</div>
										</div>
									) : (
										<div className="flex items-center gap-2.5 text-xs text-muted-foreground animate-onboarding-bounce">
											<div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
												<Banknote className="size-4" />
											</div>
											<div>
												<span className="font-medium text-foreground block">
													Clean Slate Mode
												</span>
												<span className="text-[11px]">
													0 accounts, 0 transactions. Completely empty ledger.
												</span>
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Modal Footer Controls */}
				<div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/20">
					{/* Left: Back Button */}
					<div className="w-24">
						{currentStep > 0 ? (
							<Button
								variant="outline"
								size="sm"
								onClick={handlePrev}
								className="gap-1.5 cursor-pointer text-xs h-8"
							>
								<ArrowLeft className="size-3.5" />
								Back
							</Button>
						) : (
							<span />
						)}
					</div>

					{/* Center: Step Indicator Dots */}
					<div className="flex items-center gap-1.5">
						{[0, 1, 2, 3, 4].map((stepIdx) => {
							const isActive = currentStep === stepIdx;
							return (
								<button
									type="button"
									key={stepIdx}
									onClick={() => {
										setDirection(stepIdx > currentStep ? "next" : "prev");
										setCurrentStep(stepIdx);
									}}
									className={cn(
										"h-2 rounded-full transition-all duration-500 ease-out cursor-pointer",
										isActive
											? "w-7"
											: "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
									)}
									style={{
										backgroundColor: isActive
											? activeTheme.dotColor
											: undefined,
									}}
									aria-label={`Go to step ${stepIdx + 1}`}
								/>
							);
						})}
					</div>

					{/* Right: Continue / Finish Button */}
					<div className="w-28 flex justify-end">
						<Button
							size="sm"
							onClick={handleNext}
							className={cn(
								"gap-1.5 cursor-pointer font-medium text-xs h-8 transition-all duration-300",
								currentStep === 4 &&
									"bg-emerald-600 hover:bg-emerald-500 text-white shadow-md animate-onboarding-bounce",
							)}
						>
							{currentStep < 4 ? (
								<>
									Continue
									<ArrowRight className="size-3.5" />
								</>
							) : (
								<>
									<Sparkles className="size-3.5" />
									Get Started
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
