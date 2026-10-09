import {
	ArrowLeft,
	ArrowRight,
	Banknote,
	Check,
	CreditCard,
	FileSpreadsheet,
	Landmark,
	PiggyBank,
	Plus,
	RotateCcw,
	ShieldCheck,
	Sparkles,
	X,
} from "lucide-react";
import * as React from "react";
import { FinLogo } from "#/components/fin-logo";
import {
	getStoredOnboardingSettings,
	useOnboardingSettings,
} from "#/lib/onboarding";
import { cn } from "#/lib/utils";

const FIN_BLUE = "#3b82f6";

const STEPS = [
	{
		eyebrow: "Your personal finance tracker",
		title: "Welcome to fin",
		body: "fin is a local-first finance app that lives entirely on your device. No cloud sync, no subscriptions — just a clear picture of your money.",
		accent: FIN_BLUE,
	},
	{
		eyebrow: "Works with any bank",
		title: "Import transactions",
		body: "Download a CSV from your bank and drag it into fin. Transactions are parsed automatically and categorised with smart rules.",
		accent: "#10b981",
	},
	{
		eyebrow: "Monthly at a glance",
		title: "See the big picture",
		body: "The dashboard shows your income, spending, and net cash flow every month. Drill into any category or account to understand exactly where your money goes.",
		accent: "#0ea5e9",
	},
	{
		eyebrow: "Make it yours",
		title: "Your categories",
		body: "Start with the essentials, then add, rename, or remove categories to match how you actually spend.",
		accent: "#d946ef",
	},
	{
		eyebrow: "Optional demo accounts",
		title: "Sample data",
		body: "Load a few demo accounts and months of transactions to explore the dashboard and imports with realistic numbers. Turn this off if you prefer to start from a blank ledger and add your own data.",
		accent: "#f59e0b",
	},
] as const;

const SUGGESTED_CATEGORIES = [
	"Utilities",
	"Subscriptions",
	"Health",
	"Shopping",
	"Coffee",
	"Travel",
];

const LAST_STEP = STEPS.length - 1;
const EXIT_MS = 240;

const glass =
	"rounded-3xl border border-foreground/10 bg-card/60 shadow-2xl shadow-black/5 backdrop-blur-2xl";

function delay(ms: number): React.CSSProperties {
	return { animationDelay: `${ms}ms` };
}

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
	const [step, setStep] = React.useState(0);
	const [dir, setDir] = React.useState<1 | -1>(1);
	const [leaving, setLeaving] = React.useState(false);
	const [draft, setDraft] = React.useState("");
	const [justAdded, setJustAdded] = React.useState<string | null>(null);
	const [isLaunching, setIsLaunching] = React.useState(false);
	const [isFadingOut, setIsFadingOut] = React.useState(false);
	const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const launchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const fadeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const accent = isLaunching ? FIN_BLUE : STEPS[step].accent;

	const suggestedCategories = React.useMemo(() => {
		const current = new Set(settings.categories.map((c) => c.toLowerCase()));
		return SUGGESTED_CATEGORIES.filter((c) => !current.has(c.toLowerCase()));
	}, [settings.categories]);

	React.useEffect(() => {
		if (!getStoredOnboardingSettings().completed) setIsOpen(true);
	}, []);

	React.useEffect(() => {
		const handleOpen = (e: Event) => {
			const start = (e as CustomEvent<{ startStep?: number }>).detail
				?.startStep;
			setStep(Math.min(Math.max(start ?? 0, 0), LAST_STEP));
			setDir(1);
			setLeaving(false);
			setIsLaunching(false);
			setIsFadingOut(false);
			setIsOpen(true);
		};
		window.addEventListener("fin:open-onboarding", handleOpen);
		return () => window.removeEventListener("fin:open-onboarding", handleOpen);
	}, []);

	React.useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
			if (launchTimer.current) clearTimeout(launchTimer.current);
			if (fadeTimer.current) clearTimeout(fadeTimer.current);
		},
		[],
	);

	const goTo = React.useCallback(
		(next: number) => {
			if (
				leaving ||
				isLaunching ||
				next === step ||
				next < 0 ||
				next > LAST_STEP
			)
				return;
			setDir(next > step ? 1 : -1);
			setLeaving(true);
			timer.current = setTimeout(() => {
				setStep(next);
				setLeaving(false);
			}, EXIT_MS);
		},
		[leaving, isLaunching, step],
	);

	const finish = React.useCallback(() => {
		if (isLaunching) return;
		setIsLaunching(true);
		fadeTimer.current = setTimeout(() => {
			setIsFadingOut(true);
		}, 950);
		launchTimer.current = setTimeout(() => {
			markCompleted(true);
			setIsOpen(false);
			setIsLaunching(false);
			setIsFadingOut(false);
		}, 1400);
	}, [isLaunching, markCompleted]);

	const handleSkip = React.useCallback(() => {
		markCompleted(true);
		setIsOpen(false);
	}, [markCompleted]);

	const next = React.useCallback(() => {
		if (step < LAST_STEP) goTo(step + 1);
		else finish();
	}, [step, goTo, finish]);

	const prev = React.useCallback(() => goTo(step - 1), [step, goTo]);

	React.useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (isLaunching) return;
			if (e.key === "Escape") return handleSkip();
			if (e.target instanceof HTMLInputElement) return;
			if (e.key === "ArrowRight" || e.key === "Enter") next();
			else if (e.key === "ArrowLeft") prev();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isOpen, isLaunching, next, prev, handleSkip]);

	const submitCategory = (e: React.FormEvent) => {
		e.preventDefault();
		const name = draft.trim();
		if (!name) return;
		addCategory(name);
		setJustAdded(name);
		setDraft("");
		setTimeout(() => setJustAdded(null), 700);
	};

	if (!isOpen) return null;

	const current = STEPS[step];

	return (
		<div
			className={cn(
				"fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background text-foreground transition-all duration-500 ease-out",
				isFadingOut &&
					"opacity-0 scale-[1.02] filter blur-xs pointer-events-none",
			)}
		>
			{/* Ambient backdrop: one layer per step, cross-faded for smooth colour morphing */}
			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				{STEPS.map((s, i) => (
					<div
						key={s.title}
						className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
						style={{
							opacity: !isLaunching && i === step ? 1 : 0,
							background: `radial-gradient(60% 55% at 18% 12%, color-mix(in oklab, ${s.accent} 26%, transparent), transparent 70%), radial-gradient(55% 50% at 88% 88%, color-mix(in oklab, ${s.accent} 18%, transparent), transparent 70%)`,
						}}
					/>
				))}
				<div
					className="animate-onb-breathe absolute left-1/2 top-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-[1200ms]"
					style={{
						backgroundColor: `color-mix(in oklab, ${accent} ${isLaunching ? "30%" : "10%"}, transparent)`,
					}}
				/>
			</div>

			{isLaunching ? (
				/* Celebratory Launch Animation */
				<div className="relative z-20 flex flex-1 flex-col items-center justify-center gap-7 p-8">
					<div className="relative flex items-center justify-center">
						<div
							className="absolute size-44 rounded-full border border-primary/40 animate-onb-launch-ring pointer-events-none"
							style={{ borderColor: accent }}
						/>
						<div
							className="absolute size-64 rounded-full blur-3xl opacity-75 animate-onb-breathe pointer-events-none"
							style={{
								backgroundColor: `color-mix(in oklab, ${accent} 40%, transparent)`,
							}}
						/>
						<div className="relative animate-onb-launch-pop">
							<FinLogo
								animate="always"
								className="size-28 drop-shadow-[0_24px_50px_rgba(59,130,246,0.45)]"
							/>
						</div>
					</div>

					<div className="flex flex-col items-center gap-3 text-center animate-onb-rise">
						<h2 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
							Welcome to fin
						</h2>
						<p className="text-sm text-muted-foreground">
							Preparing your local financial command center…
						</p>

						<div className="relative h-1 w-48 overflow-hidden rounded-full bg-foreground/10 mt-2">
							<div
								className="h-full w-24 rounded-full animate-onb-shimmer"
								style={{ backgroundColor: accent }}
							/>
						</div>
					</div>
				</div>
			) : (
				<>
					{/* Header (also the window drag region, clear of the macOS traffic lights) */}
					<header
						data-tauri-drag-region
						className="relative z-10 flex h-14 shrink-0 items-center justify-between pl-[84px] pr-6"
					>
						<div data-tauri-drag-region className="flex-1 self-stretch" />
						<button
							type="button"
							onClick={handleSkip}
							className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
						>
							Skip
						</button>
					</header>

					{/* Stage */}
					<main className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-8 py-6 sm:px-12">
						<div
							key={step}
							className={cn(
								"grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20",
								leaving && "animate-onb-exit",
							)}
							style={{ "--onb-x": `${dir * 28}px` } as React.CSSProperties}
						>
							{/* Copy */}
							<div className="flex max-w-md flex-col gap-5">
								<span
									className="animate-onb-rise text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-700"
									style={{ ...delay(0), color: accent }}
								>
									{current.eyebrow}
								</span>
								<h1
									className="animate-onb-rise font-heading text-4xl font-semibold tracking-tight sm:text-5xl"
									style={delay(70)}
								>
									{current.title}
								</h1>
								<p
									className="animate-onb-rise text-base leading-relaxed text-muted-foreground"
									style={delay(140)}
								>
									{current.body}
								</p>
							</div>

							{/* Visual */}
							<div className="animate-onb-rise" style={delay(180)}>
								{step === 0 && <WelcomeVisual accent={accent} />}
								{step === 1 && <ImportVisual />}
								{step === 2 && <GlanceVisual accent={accent} />}
								{step === 3 && (
									<div className={cn(glass, "flex flex-col gap-4 p-6")}>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span
													className="size-2 rounded-full animate-pulse"
													style={{ backgroundColor: accent }}
												/>
												<span className="text-xs font-semibold text-foreground">
													Customise Categories
												</span>
											</div>
											<span className="text-[11px] font-medium text-muted-foreground">
												Click{" "}
												<span className="text-foreground font-bold">×</span> to
												remove, or add new
											</span>
										</div>

										{/* Add Category Form */}
										<form onSubmit={submitCategory} className="flex gap-2">
											<input
												value={draft}
												onChange={(e) => setDraft(e.target.value)}
												placeholder="Add a category (e.g. Subscriptions)…"
												maxLength={30}
												className="h-10 min-w-0 flex-1 rounded-full border border-foreground/15 bg-background/80 px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[var(--ring-c)] focus-visible:border-transparent"
												style={{ "--ring-c": accent } as React.CSSProperties}
											/>
											<button
												type="submit"
												disabled={!draft.trim()}
												className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
												style={{ backgroundColor: accent }}
											>
												<Plus className="size-4" />
												Add
											</button>
										</form>

										{/* Quick suggestions to invite clicking */}
										{suggestedCategories.length > 0 && (
											<div className="flex items-center gap-1.5 flex-wrap text-xs">
												<span className="text-[11px] text-muted-foreground mr-1">
													Quick add:
												</span>
												{suggestedCategories.slice(0, 4).map((sug) => (
													<button
														key={sug}
														type="button"
														onClick={() => addCategory(sug)}
														className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-foreground/20 hover:border-solid hover:text-foreground text-muted-foreground text-xs transition-all active:scale-95 hover:bg-foreground/5"
													>
														<Plus className="size-3 text-muted-foreground" />
														{sug}
													</button>
												))}
											</div>
										)}

										{/* Active Category Chips */}
										<div className="flex min-h-[110px] flex-wrap content-start gap-2 rounded-2xl border border-foreground/10 bg-background/50 p-3.5">
											{settings.categories.map((cat, i) => (
												<span
													key={cat}
													className={cn(
														"group inline-flex items-center gap-2 rounded-full border py-1.5 pl-3.5 pr-2 text-sm font-medium transition-all shadow-2xs hover:scale-105",
														justAdded === cat
															? "border-transparent text-white animate-onb-pop"
															: "border-foreground/15 bg-background hover:bg-background/90 hover:border-foreground/30",
													)}
													style={{
														...delay(i * 30),
														backgroundColor:
															justAdded === cat ? accent : undefined,
													}}
												>
													<span
														className="size-1.5 rounded-full shrink-0"
														style={{
															backgroundColor:
																justAdded === cat ? "white" : accent,
														}}
													/>
													<span>{cat}</span>
													{settings.categories.length > 1 && (
														<button
															type="button"
															onClick={() => removeCategory(cat)}
															aria-label={`Remove ${cat}`}
															className="flex size-5 cursor-pointer items-center justify-center rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/15 hover:text-destructive transition-colors ml-0.5"
														>
															<X className="size-3" />
														</button>
													)}
												</span>
											))}
										</div>

										<div className="flex items-center justify-between border-t border-foreground/10 pt-3 text-xs text-muted-foreground">
											<span>
												{settings.categories.length} active categories
											</span>
											<button
												type="button"
												onClick={resetCategories}
												className="inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground hover:underline"
											>
												<RotateCcw className="size-3" />
												Reset to defaults
											</button>
										</div>
									</div>
								)}
								{step === 4 && (
									<div className={cn(glass, "flex flex-col gap-4 p-6")}>
										<div className="flex items-center justify-between">
											<div className="flex flex-col gap-0.5">
												<span className="text-xs font-semibold text-foreground">
													Choose Your Ledger State
												</span>
												<span className="text-[11px] text-muted-foreground">
													Click either card to select how you want to start:
												</span>
											</div>
											<span className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
												Click to toggle
											</span>
										</div>

										{/* 2 Big Clickable Option Cards */}
										<div className="grid grid-cols-2 gap-3">
											<button
												type="button"
												onClick={() => setSampleData(true)}
												className={cn(
													"cursor-pointer flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all duration-300 relative",
													settings.loadSampleData
														? "border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/40"
														: "border-foreground/10 bg-background/50 hover:bg-background/80 hover:border-foreground/20 opacity-70 hover:opacity-100",
												)}
											>
												<div className="flex items-center justify-between w-full">
													<span className="flex size-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
														<Sparkles className="size-3.5" />
													</span>
													<span
														className={cn(
															"size-4 rounded-full border flex items-center justify-center text-[10px]",
															settings.loadSampleData
																? "border-amber-500 bg-amber-500 text-white"
																: "border-muted-foreground/40",
														)}
													>
														{settings.loadSampleData && (
															<Check className="size-2.5 stroke-[3]" />
														)}
													</span>
												</div>
												<div>
													<span className="text-sm font-semibold text-foreground block">
														Sample data
													</span>
													<span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
														Load 3 demo accounts & transactions
													</span>
												</div>
											</button>

											<button
												type="button"
												onClick={() => setSampleData(false)}
												className={cn(
													"cursor-pointer flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all duration-300 relative",
													!settings.loadSampleData
														? "border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/40"
														: "border-foreground/10 bg-background/50 hover:bg-background/80 hover:border-foreground/20 opacity-70 hover:opacity-100",
												)}
											>
												<div className="flex items-center justify-between w-full">
													<span className="flex size-7 items-center justify-center rounded-xl bg-foreground/10 text-muted-foreground">
														<Banknote className="size-3.5" />
													</span>
													<span
														className={cn(
															"size-4 rounded-full border flex items-center justify-center text-[10px]",
															!settings.loadSampleData
																? "border-amber-500 bg-amber-500 text-white"
																: "border-muted-foreground/40",
														)}
													>
														{!settings.loadSampleData && (
															<Check className="size-2.5 stroke-[3]" />
														)}
													</span>
												</div>
												<div>
													<span className="text-sm font-semibold text-foreground block">
														Blank ledger
													</span>
													<span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
														Start fresh with 0 accounts
													</span>
												</div>
											</button>
										</div>

										{/* Live Preview of Selected Mode */}
										<div
											key={String(settings.loadSampleData)}
											className="animate-onb-rise flex min-h-[140px] flex-col justify-center gap-2 rounded-2xl border border-foreground/10 bg-background/50 p-4 transition-all"
										>
											{settings.loadSampleData ? (
												[
													{
														icon: Landmark,
														name: "Everyday Checking",
														amt: "$4,250.00",
													},
													{
														icon: PiggyBank,
														name: "High-yield Savings",
														amt: "$32,100.00",
													},
													{
														icon: CreditCard,
														name: "Travel Card",
														amt: "-$840.20",
													},
												].map((a, i) => (
													<div
														key={a.name}
														className="animate-onb-rise flex items-center gap-3 text-sm"
														style={delay(i * 60)}
													>
														<span
															className="flex size-8 items-center justify-center rounded-xl"
															style={{
																backgroundColor: `color-mix(in oklab, ${accent} 16%, transparent)`,
																color: accent,
															}}
														>
															<a.icon className="size-4" />
														</span>
														<span className="flex-1 font-medium">{a.name}</span>
														<span className="tabular-nums text-muted-foreground">
															{a.amt}
														</span>
													</div>
												))
											) : (
												<div className="flex flex-col items-center gap-2 text-center py-2">
													<span className="flex size-10 items-center justify-center rounded-2xl bg-foreground/5 text-muted-foreground">
														<Banknote className="size-5" />
													</span>
													<span className="text-sm font-medium">
														A completely blank ledger
													</span>
													<span className="text-xs text-muted-foreground max-w-xs">
														Starting with 0 accounts or transactions. You can
														always add sample data later from Settings.
													</span>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</main>

					{/* Footer */}
					<footer className="relative z-10 grid shrink-0 grid-cols-3 items-center px-8 pb-8 pt-4 sm:px-12">
						<div>
							<button
								type="button"
								onClick={prev}
								className={cn(
									"inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-foreground/5 hover:text-foreground",
									step === 0 && "pointer-events-none opacity-0",
								)}
							>
								<ArrowLeft className="size-4" />
								Back
							</button>
						</div>

						<div className="flex items-center justify-center gap-2">
							{STEPS.map((s, i) => (
								<button
									type="button"
									key={s.title}
									onClick={() => goTo(i)}
									aria-label={`Go to step ${i + 1}`}
									className="h-1.5 cursor-pointer rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
									style={{
										width: i === step ? 28 : 6,
										backgroundColor:
											i === step
												? accent
												: "color-mix(in oklab, var(--foreground) 20%, transparent)",
									}}
								/>
							))}
						</div>

						<div className="flex justify-end">
							<button
								type="button"
								onClick={next}
								className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-6 text-sm font-semibold text-white shadow-lg transition-all duration-500 hover:brightness-110 active:scale-95"
								style={{
									backgroundColor: accent,
									boxShadow: `0 10px 30px -10px ${accent}`,
								}}
							>
								{step < LAST_STEP ? (
									<>
										Continue
										<ArrowRight className="size-4" />
									</>
								) : (
									<>
										<Sparkles className="size-4" />
										Get started
									</>
								)}
							</button>
						</div>
					</footer>
				</>
			)}
		</div>
	);
}

function WelcomeVisual({ accent }: { accent: string }) {
	return (
		<div className="relative flex h-[340px] items-center justify-center">
			<div
				className="animate-onb-breathe absolute size-72 rounded-full blur-3xl"
				style={{
					backgroundColor: `color-mix(in oklab, ${accent} 35%, transparent)`,
				}}
			/>
			<div className="animate-onb-float relative">
				<FinLogo
					animate="always"
					className="size-40 drop-shadow-[0_24px_40px_rgba(59,130,246,0.35)]"
				/>
			</div>
			<div className="absolute bottom-2 flex flex-wrap justify-center gap-2">
				{[
					{ icon: ShieldCheck, label: "On-device" },
					{ icon: Check, label: "No cloud" },
					{ icon: Sparkles, label: "No subscription" },
				].map((c, i) => (
					<span
						key={c.label}
						className="animate-onb-pop inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-card/60 px-3 py-1.5 text-xs font-medium backdrop-blur-xl"
						style={delay(500 + i * 90)}
					>
						<c.icon className="size-3.5" style={{ color: accent }} />
						{c.label}
					</span>
				))}
			</div>
		</div>
	);
}

function ImportVisual() {
	const rows = [
		{ name: "Whole Foods", cat: "Groceries", amt: "-$84.20" },
		{ name: "Uber", cat: "Transport", amt: "-$18.50" },
		{ name: "Blue Bottle", cat: "Dining", amt: "-$6.75" },
		{ name: "Rent — Oct", cat: "Housing", amt: "-$2,100.00" },
	];
	return (
		<div className={cn(glass, "overflow-hidden")}>
			<div className="flex items-center gap-3 border-b border-foreground/10 px-5 py-4">
				<span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
					<FileSpreadsheet className="size-4" />
				</span>
				<div className="flex flex-1 flex-col">
					<span className="text-sm font-medium">checking_october.csv</span>
					<span className="text-xs text-muted-foreground">
						42 rows · parsed
					</span>
				</div>
				<Check className="size-4 text-emerald-500" />
			</div>
			<div className="flex flex-col divide-y divide-foreground/5">
				{rows.map((r, i) => (
					<div
						key={r.name}
						className="animate-onb-rise flex items-center gap-3 px-5 py-3.5 text-sm"
						style={delay(300 + i * 110)}
					>
						<span className="flex-1 font-medium">{r.name}</span>
						<span
							className="animate-onb-pop rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
							style={delay(700 + i * 110)}
						>
							{r.cat}
						</span>
						<span className="w-20 text-right tabular-nums text-muted-foreground">
							{r.amt}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function GlanceVisual({ accent }: { accent: string }) {
	const bars = [48, 62, 40, 74, 58, 88];
	const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
	return (
		<div className={cn(glass, "flex flex-col gap-6 p-6")}>
			<div className="grid grid-cols-3 gap-3">
				{[
					{ label: "Income", value: "$14,250", tone: "" },
					{ label: "Spending", value: "$6,840", tone: "" },
					{ label: "Net", value: "+$7,410", tone: "text-emerald-500" },
				].map((m, i) => (
					<div
						key={m.label}
						className="animate-onb-rise flex flex-col gap-1 rounded-2xl border border-foreground/10 bg-background/50 p-3.5"
						style={delay(300 + i * 90)}
					>
						<span className="text-xs text-muted-foreground">{m.label}</span>
						<span className={cn("text-lg font-semibold tabular-nums", m.tone)}>
							{m.value}
						</span>
					</div>
				))}
			</div>
			{/* Monthly Cashflow Bar Chart */}
			<div className="flex h-36 items-end gap-3 pt-2">
				{bars.map((h, i) => {
					const isLatest = i === bars.length - 1;
					return (
						<div
							key={months[i]}
							className="flex h-full flex-1 flex-col items-center justify-end gap-2"
						>
							<div className="relative flex h-28 w-full items-end justify-center rounded-lg bg-foreground/[0.04] p-1">
								<div
									className="animate-onb-grow w-full rounded-md shadow-xs transition-all duration-500"
									style={{
										height: `${h}%`,
										...delay(400 + i * 70),
										backgroundColor: accent,
										opacity: isLatest ? 1 : 0.45,
									}}
								/>
							</div>
							<span
								className={cn(
									"text-[11px] font-medium transition-colors",
									isLatest
										? "text-foreground font-semibold"
										: "text-muted-foreground",
								)}
							>
								{months[i]}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
