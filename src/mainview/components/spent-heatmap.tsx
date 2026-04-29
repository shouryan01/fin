import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { CategoryGlyph } from "#/components/category-glyph";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { formatCurrency, formatSignedCurrency } from "#/lib/format";
import { cn } from "#/lib/utils";
import type {
	DailyCashFlowPoint,
	DailyCategoryBreakdownEntry,
	DashboardPeriod,
} from "../../shared/finance";

type SpentHeatmapProps = {
	days: DailyCashFlowPoint[];
	todayIso: string;
	period: DashboardPeriod;
};

const BREAKDOWN_VISIBLE_ROWS = 5;

function compactDollars(cents: number) {
	const dollars = Math.round(cents / 100);
	if (Math.abs(dollars) < 1000) {
		return `$${dollars}`;
	}
	return new Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	})
		.format(dollars)
		.replace(/^/, "$");
}

function heatmapIntensity(expenseCents: number, maxExpenseCents: number) {
	if (expenseCents <= 0 || maxExpenseCents <= 0) {
		return 0;
	}
	return Math.min(1, expenseCents / maxExpenseCents);
}

function cellClassesForIntensity(intensity: number) {
	if (intensity === 0) {
		return "bg-muted/40 text-muted-foreground/70 border-transparent";
	}
	if (intensity < 0.2) {
		return "bg-blue-100 text-blue-900 border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-100 dark:border-blue-400/30";
	}
	if (intensity < 0.45) {
		return "bg-blue-200 text-blue-900 border-blue-300/70 dark:bg-blue-500/30 dark:text-blue-50 dark:border-blue-400/40";
	}
	if (intensity < 0.75) {
		return "bg-blue-400 text-white border-blue-500/70 dark:bg-blue-500/60 dark:text-white dark:border-blue-400/60";
	}
	return "bg-blue-600 text-white border-blue-700/70 dark:bg-blue-500 dark:text-white dark:border-blue-300/60";
}

type MonthlyBucket = {
	key: string;
	label: string;
	expenseCents: number;
	incomeCents: number;
	isFuture: boolean;
	expenseCategoryBreakdown: DailyCategoryBreakdownEntry[];
};

function mergeCategoryBreakdown(
	target: Map<string, DailyCategoryBreakdownEntry>,
	additions: DailyCategoryBreakdownEntry[],
) {
	for (const entry of additions) {
		const key = entry.categoryId ?? `~${entry.categoryName}`;
		const existing = target.get(key);
		if (existing) {
			existing.amountCents += entry.amountCents;
			continue;
		}
		target.set(key, { ...entry });
	}
}

function sortedBreakdown(entries: DailyCategoryBreakdownEntry[]) {
	return [...entries].sort(
		(left, right) => right.amountCents - left.amountCents,
	);
}

function buildMonthlyBuckets(
	days: DailyCashFlowPoint[],
	todayIso: string,
): MonthlyBucket[] {
	const todayMonth = todayIso.slice(0, 7);
	const buckets = new Map<
		string,
		MonthlyBucket & {
			_categoryMap: Map<string, DailyCategoryBreakdownEntry>;
		}
	>();
	for (const day of days) {
		const key = day.date.slice(0, 7);
		let existing = buckets.get(key);
		if (!existing) {
			const parsed = parseISO(`${key}-01`);
			existing = {
				key,
				label: format(parsed, "MMM yyyy"),
				expenseCents: 0,
				incomeCents: 0,
				isFuture: key > todayMonth,
				expenseCategoryBreakdown: [],
				_categoryMap: new Map(),
			};
			buckets.set(key, existing);
		}
		existing.expenseCents += day.expenseCents;
		existing.incomeCents += day.incomeCents;
		mergeCategoryBreakdown(existing._categoryMap, day.expenseCategoryBreakdown);
	}
	return [...buckets.values()]
		.map((bucket) => {
			const { _categoryMap, ...rest } = bucket;
			return {
				...rest,
				expenseCategoryBreakdown: sortedBreakdown([..._categoryMap.values()]),
			};
		})
		.sort((a, b) => a.key.localeCompare(b.key));
}

type HeatmapTooltipProps = {
	label: string;
	expenseCents: number;
	incomeCents: number;
	isFuture?: boolean;
	breakdown: DailyCategoryBreakdownEntry[];
};

function HeatmapTooltipBody({
	label,
	expenseCents,
	incomeCents,
	isFuture = false,
	breakdown,
}: HeatmapTooltipProps) {
	const hasExpense = expenseCents > 0;
	const hasIncome = incomeCents > 0;
	const netCents = incomeCents - expenseCents;
	const summaryLine = isFuture
		? "Upcoming"
		: hasExpense
			? `Spent ${formatCurrency(expenseCents)}`
			: hasIncome
				? `Received ${formatCurrency(incomeCents)}`
				: "No activity";
	const showNet = !isFuture && hasExpense && hasIncome;

	const visible = breakdown.slice(0, BREAKDOWN_VISIBLE_ROWS);
	const hiddenEntries = breakdown.slice(BREAKDOWN_VISIBLE_ROWS);
	const hiddenTotal = hiddenEntries.reduce(
		(sum, entry) => sum + entry.amountCents,
		0,
	);

	return (
		<div className="flex min-w-[200px] max-w-[260px] flex-col gap-1.5 text-xs">
			<div className="flex flex-col gap-0.5">
				<span className="font-semibold">{label}</span>
				<span>{summaryLine}</span>
				{showNet ? (
					<span className="text-primary-foreground/70">
						Net {formatSignedCurrency(netCents)}
					</span>
				) : null}
			</div>
			{visible.length > 0 ? (
				<>
					<div className="h-px bg-primary-foreground/20" />
					<ul className="flex flex-col gap-1">
						{visible.map((entry) => (
							<li
								key={entry.categoryId ?? `~${entry.categoryName}`}
								className="flex items-center justify-between gap-3"
							>
								<span className="flex min-w-0 items-center gap-1.5">
									<CategoryGlyph
										iconId={entry.icon}
										className="h-3 w-3 text-primary-foreground/80"
									/>
									<span className="truncate">{entry.categoryName}</span>
								</span>
								<span className="shrink-0 tabular-nums text-primary-foreground/95">
									{formatCurrency(entry.amountCents)}
								</span>
							</li>
						))}
						{hiddenEntries.length > 0 ? (
							<li className="flex items-center justify-between gap-3 text-primary-foreground/60">
								<span>+{hiddenEntries.length} more</span>
								<span className="shrink-0 tabular-nums">
									{formatCurrency(hiddenTotal)}
								</span>
							</li>
						) : null}
					</ul>
				</>
			) : null}
		</div>
	);
}

export function SpentHeatmap({ days, todayIso, period }: SpentHeatmapProps) {
	const isMonthly = period === "quarterly" || period === "yearly";
	const months = useMemo(
		() => (isMonthly ? buildMonthlyBuckets(days, todayIso) : []),
		[days, todayIso, isMonthly],
	);

	if (days.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
				No spending data for this period.
			</div>
		);
	}

	if (isMonthly) {
		const maxExpense = months.reduce(
			(max, m) => Math.max(max, m.isFuture ? 0 : m.expenseCents),
			0,
		);

		return (
			<TooltipProvider delayDuration={150}>
				<div className="flex flex-col gap-1.5">
					{months.map((month) => {
						const intensity = month.isFuture
							? 0
							: heatmapIntensity(month.expenseCents, maxExpense);
						const baseClasses = cellClassesForIntensity(intensity);
						const hasExpense = month.expenseCents > 0;
						const hasIncome = month.incomeCents > 0;
						const netCents = month.incomeCents - month.expenseCents;

						return (
							<Tooltip key={month.key}>
								<TooltipTrigger asChild>
									<div
										className={cn(
											"flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors",
											month.isFuture
												? "border-dashed border-border/40 bg-transparent text-muted-foreground/40"
												: baseClasses,
										)}
									>
										<span
											className={cn(
												"font-medium",
												month.isFuture
													? "text-muted-foreground/40"
													: intensity >= 0.45
														? "text-white/90"
														: "text-foreground/80",
											)}
										>
											{month.label}
										</span>
										<div className="flex flex-col items-end gap-0.5">
											<span
												className={cn(
													"text-sm font-semibold tabular-nums",
													month.isFuture
														? "text-muted-foreground/40"
														: !hasExpense && hasIncome
															? "text-emerald-600 dark:text-emerald-400"
															: intensity >= 0.45
																? "text-white"
																: intensity === 0
																	? "text-muted-foreground"
																	: "text-foreground",
												)}
											>
												{month.isFuture
													? "—"
													: !hasExpense && hasIncome
														? `+${compactDollars(month.incomeCents)}`
														: compactDollars(month.expenseCents)}
											</span>
											{!month.isFuture && hasExpense && hasIncome ? (
												<span
													className={cn(
														"text-[10px] tabular-nums",
														intensity >= 0.45
															? "text-white/70"
															: "text-muted-foreground",
													)}
												>
													Net {formatSignedCurrency(netCents)}
												</span>
											) : null}
										</div>
									</div>
								</TooltipTrigger>
								<TooltipContent side="right" align="center">
									<HeatmapTooltipBody
										label={month.label}
										expenseCents={month.expenseCents}
										incomeCents={month.incomeCents}
										isFuture={month.isFuture}
										breakdown={month.expenseCategoryBreakdown}
									/>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</TooltipProvider>
		);
	}

	const maxExpenseCents = days.reduce(
		(max, point) => Math.max(max, point.expenseCents),
		0,
	);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="grid grid-cols-7 gap-1.5">
				{days.map((point) => {
					const isFuture = point.date > todayIso;
					const hasExpense = point.expenseCents > 0;
					const hasIncome = point.incomeCents > 0;
					const intensity = hasExpense
						? heatmapIntensity(point.expenseCents, maxExpenseCents)
						: 0;

					const baseClasses = cellClassesForIntensity(intensity);
					const incomeOnly = !hasExpense && hasIncome;
					const parsed = parseISO(point.date);
					const tooltipLabel = format(parsed, "MMM d");

					return (
						<Tooltip key={point.date}>
							<TooltipTrigger asChild>
								<div
									className={cn(
										"group relative flex aspect-[1.15/1] flex-col items-start justify-between rounded-md border px-1.5 py-1 text-left transition-colors",
										isFuture
											? "border-dashed border-border/40 bg-transparent text-muted-foreground/40"
											: baseClasses,
									)}
								>
									<span
										className={cn(
											"text-[10px] font-medium leading-none",
											isFuture
												? "text-muted-foreground/40"
												: intensity >= 0.45
													? "text-white/85"
													: "text-foreground/65 dark:text-foreground/75",
										)}
									>
										{point.dayOfMonth}
									</span>
									<span
										className={cn(
											"text-[11px] font-semibold leading-none tabular-nums",
											isFuture
												? "text-muted-foreground/40"
												: incomeOnly
													? "text-emerald-600 dark:text-emerald-400"
													: intensity >= 0.45
														? "text-white"
														: intensity === 0
															? "text-muted-foreground"
															: "text-foreground",
										)}
									>
										{isFuture
											? "-"
											: incomeOnly
												? `+${compactDollars(point.incomeCents)}`
												: compactDollars(point.expenseCents)}
									</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<HeatmapTooltipBody
									label={tooltipLabel}
									expenseCents={point.expenseCents}
									incomeCents={point.incomeCents}
									isFuture={isFuture}
									breakdown={point.expenseCategoryBreakdown}
								/>
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</TooltipProvider>
	);
}
