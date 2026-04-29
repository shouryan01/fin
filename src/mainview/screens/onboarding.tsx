import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Sparkles,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "#/components/brand-logo";
import { Button } from "#/components/ui/button";
import { Switch } from "#/components/ui/switch";
import { cn } from "#/lib/utils";
import { updateAppSettingsMutation } from "#/queries/settings";

const STEPS = [
	{
		icon: BrandLogo,
		title: "Welcome to fin",
		subtitle: "Your personal finance tracker",
		description:
			"fin is a local-first finance app that lives entirely on your device. No cloud sync, no subscriptions — just a clear picture of your money.",
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
	{
		icon: Upload,
		title: "Import transactions",
		subtitle: "Works with any bank",
		description:
			"Download a CSV from your bank and drag it into fin. Transactions are parsed automatically and categorised with smart rules.",
		color: "text-emerald-500",
		bg: "bg-emerald-500/10",
	},
	{
		icon: BarChart3,
		title: "See the big picture",
		subtitle: "Monthly at a glance",
		description:
			"The dashboard shows your income, spending, and net cash flow every month. Drill into any category or account to understand exactly where your money goes.",
		color: "text-amber-500",
		bg: "bg-amber-500/10",
	},
	{
		icon: Sparkles,
		title: "Sample data",
		subtitle: "Optional demo accounts",
		description:
			"Load a few demo accounts and months of transactions to explore the dashboard and imports with realistic numbers. Turn this off if you prefer to start from a blank ledger and add your own data.",
		color: "text-purple-500",
		bg: "bg-purple-500/10",
	},
] as const;

export default function OnboardingScreen() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [step, setStep] = useState(0);
	const [isFinishing, setIsFinishing] = useState(false);
	const [loadSampleData, setLoadSampleData] = useState(true);

	const markSeen = useMutation({
		...updateAppSettingsMutation,
		onSuccess: async () => {
			// Refetch first so FinanceLayout sees hasSeenOnboarding=true
			// before we navigate there, preventing the redirect loop.
			await queryClient.refetchQueries({ queryKey: ["settings"] });
			await navigate({ to: "/", replace: true });
		},
	});

	const isLastStep = step === STEPS.length - 1;
	const current = STEPS[step];
	const Icon = current.icon;

	function handleNext() {
		if (isLastStep) {
			setIsFinishing(true);
			markSeen.mutate({
				hasSeenOnboarding: true,
				sampleDataEnabled: loadSampleData,
			});
		} else {
			setStep((s) => s + 1);
		}
	}

	return (
		<main
			className={cn(
				"flex min-h-screen items-center justify-center px-4 py-10 text-foreground transition-all duration-1000 ease-in-out",
				current.color === "text-blue-500" &&
					"bg-blue-500/10 dark:bg-blue-500/20",
				current.color === "text-emerald-500" &&
					"bg-emerald-500/10 dark:bg-emerald-500/20",
				current.color === "text-amber-500" &&
					"bg-amber-500/10 dark:bg-amber-500/20",
				current.color === "text-purple-500" &&
					"bg-purple-500/10 dark:bg-purple-500/20",
			)}
		>
			<div className="w-full max-w-lg">
				{/* Progress dots */}
				<div className="mb-8 flex items-center justify-center gap-2">
					{STEPS.map((_, i) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: ordered steps
							key={i}
							type="button"
							onClick={() => setStep(i)}
							className={`h-2 rounded-full transition-all duration-300 ${
								i === step
									? "w-8 bg-primary"
									: i < step
										? "w-2 bg-primary/50"
										: "w-2 bg-border"
							}`}
							aria-label={`Go to step ${i + 1}`}
						/>
					))}
				</div>

				{/* Card */}
				<div className="rounded-2xl border border-border bg-card shadow-sm">
					{/* Icon header */}
					<div className="flex flex-col items-center gap-3 border-b border-border px-8 py-10">
						<div className={`rounded-2xl p-4 ${current.bg}`}>
							<Icon className={`h-8 w-8 ${current.color}`} />
						</div>
						<div className="text-center">
							<p
								className={`text-xs font-semibold uppercase tracking-widest ${current.color}`}
							>
								{current.subtitle}
							</p>
							<h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
								{current.title}
							</h1>
						</div>
					</div>

					{/* Body */}
					<div className="flex min-h-[140px] flex-col justify-center gap-5 px-8 py-6">
						<p className="text-center text-sm leading-relaxed text-muted-foreground">
							{current.description}
						</p>
						{isLastStep ? (
							<div
								className={cn(
									"flex items-center gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50",
									loadSampleData && "border-purple-500/30 bg-purple-500/5",
								)}
							>
								<div className="min-w-0 flex-1 text-sm leading-snug text-foreground">
									<label
										htmlFor="onboarding-load-sample"
										className="block cursor-pointer font-medium"
									>
										Load sample data
									</label>
									<p
										id="onboarding-sample-hint"
										className="mt-1 text-muted-foreground"
									>
										Turn this off to start with no accounts or transactions. You
										can add sample data later from settings.
									</p>
								</div>
								<Switch
									id="onboarding-load-sample"
									checked={loadSampleData}
									onCheckedChange={setLoadSampleData}
									className="shrink-0"
									aria-describedby="onboarding-sample-hint"
								/>
							</div>
						) : null}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-between border-t border-border px-8 py-4">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={step === 0 || isFinishing}
							onClick={() => setStep((s) => s - 1)}
							className="gap-1"
						>
							<ChevronLeft className="h-4 w-4" />
							Back
						</Button>

						<span className="text-xs text-muted-foreground">
							{step + 1} / {STEPS.length}
						</span>

						<Button
							type="button"
							size="sm"
							disabled={isFinishing}
							onClick={handleNext}
							className="gap-1"
						>
							{isLastStep ? (
								isFinishing ? (
									"Starting…"
								) : (
									"Get started"
								)
							) : (
								<>
									Next
									<ChevronRight className="h-4 w-4" />
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
