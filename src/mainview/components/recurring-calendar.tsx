import { format, parseISO, startOfToday } from "date-fns";
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
	RecurringCalendar,
	RecurringCalendarDay,
	RecurringCalendarTransaction,
} from "../../shared/finance";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type RecurringCalendarProps = {
	calendar: RecurringCalendar;
};

function totalCentsForDay(day: RecurringCalendarDay) {
	return day.transactions.reduce((sum, tx) => {
		return sum + (tx.isIncome ? tx.amountCents : -tx.amountCents);
	}, 0);
}

function compactAmount(cents: number) {
	const dollars = Math.round(cents / 100);
	if (Math.abs(dollars) < 1000) {
		return `$${Math.abs(dollars)}`;
	}
	return new Intl.NumberFormat("en-US", {
		notation: "compact",
		maximumFractionDigits: 1,
	})
		.format(Math.abs(dollars))
		.replace(/^/, "$");
}

export function RecurringCalendarView({ calendar }: RecurringCalendarProps) {
	const { firstDayOfWeek, days, label } = calendar;

	const monthTotals = useMemo(() => {
		let incomeCents = 0;
		let expenseCents = 0;
		for (const day of days) {
			for (const tx of day.transactions) {
				if (tx.isIncome) {
					incomeCents += tx.amountCents;
				} else {
					expenseCents += tx.amountCents;
				}
			}
		}
		return { incomeCents, expenseCents };
	}, [days]);

	const leadingCells = useMemo(
		() => Array.from({ length: firstDayOfWeek }),
		[firstDayOfWeek],
	);

	const todayIso = format(startOfToday(), "yyyy-MM-dd");

	const hasAnyRecurring = days.some((day) => day.transactions.length > 0);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="flex flex-col gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-baseline gap-3">
						<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
							{label}
						</span>
					</div>
					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<span className="h-2 w-2 rounded-full bg-emerald-500" />
							<span className="tabular-nums text-foreground">
								+{formatCurrency(monthTotals.incomeCents)}
							</span>
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2 w-2 rounded-full bg-rose-500" />
							<span className="tabular-nums text-foreground">
								-{formatCurrency(monthTotals.expenseCents)}
							</span>
						</span>
					</div>
				</div>

				{hasAnyRecurring ? (
					<div className="grid grid-cols-7 gap-1.5 text-center">
						{DAY_NAMES.map((name) => (
							<div
								key={name}
								className="pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
							>
								{name}
							</div>
						))}
						{leadingCells.map((_, i) => (
							<div
								key={`leading-${
									// biome-ignore lint/suspicious/noArrayIndexKey: leading placeholder cells
									i
								}`}
								aria-hidden="true"
							/>
						))}
						{days.map((day) => {
							const isToday = day.date === todayIso;
							const isPast = day.date < todayIso;
							const netCents = totalCentsForDay(day);
							const hasTransactions = day.transactions.length > 0;
							const isNetPositive = hasTransactions && netCents > 0;
							const isNetNegative = hasTransactions && netCents < 0;

							const cell = (
								<div
									className={cn(
										"relative flex aspect-square min-h-[56px] flex-col items-stretch justify-between rounded-lg border p-1.5 text-left transition-colors",
										isNetPositive
											? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15"
											: isNetNegative
												? "border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/15"
												: hasTransactions
													? "border-border/70 bg-card/30"
													: "border-dashed border-border/40 bg-card/30",
										isToday ? "ring-1 ring-primary/60 border-primary" : null,
										isPast && !isToday ? "opacity-80" : null,
									)}
								>
									<span
										className={cn(
											"text-[10px] font-semibold leading-none",
											isToday
												? "text-primary"
												: isNetPositive
													? "text-emerald-700 dark:text-emerald-300"
													: isNetNegative
														? "text-rose-700 dark:text-rose-300"
														: hasTransactions
															? "text-foreground/80"
															: "text-muted-foreground/60",
										)}
									>
										{day.dayOfMonth}
									</span>
									{hasTransactions ? (
										<div className="flex flex-col gap-0.5">
											<div className="flex flex-wrap gap-0.5">
												{day.transactions.slice(0, 3).map((tx) => (
													<span
														key={tx.id}
														className={cn(
															"flex h-4 w-4 items-center justify-center rounded-sm border",
															tx.isIncome
																? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
																: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
														)}
													>
														<CategoryGlyph
															iconId={tx.categoryIcon ?? "CircleDot"}
															className="h-3 w-3"
														/>
													</span>
												))}
												{day.transactions.length > 3 ? (
													<span className="flex h-4 min-w-4 items-center justify-center rounded-sm border border-border/70 bg-muted/40 px-0.5 text-[9px] font-medium text-muted-foreground">
														+{day.transactions.length - 3}
													</span>
												) : null}
											</div>
											<span
												className={cn(
													"truncate text-[10px] font-semibold leading-none tabular-nums",
													isNetPositive
														? "text-emerald-700 dark:text-emerald-300"
														: isNetNegative
															? "text-rose-700 dark:text-rose-300"
															: "text-muted-foreground",
												)}
											>
												{netCents > 0 ? "+" : netCents < 0 ? "-" : ""}
												{compactAmount(netCents)}
											</span>
										</div>
									) : null}
								</div>
							);

							if (!hasTransactions) {
								return <div key={day.date}>{cell}</div>;
							}

							return (
								<Tooltip key={day.date}>
									<TooltipTrigger asChild>
										<div>{cell}</div>
									</TooltipTrigger>
									<TooltipContent className="max-w-64">
										<div className="flex flex-col gap-1 text-xs">
											<div className="font-semibold">
												{format(parseISO(day.date), "EEE, MMM d")}
											</div>
											{day.transactions.map(
												(tx: RecurringCalendarTransaction) => (
													<div
														key={tx.id}
														className="flex items-center justify-between gap-3"
													>
														<div className="flex min-w-0 items-center gap-1.5">
															<CategoryGlyph
																iconId={tx.categoryIcon ?? "CircleDot"}
																className="h-3.5 w-3.5"
															/>
															<span className="truncate">{tx.merchant}</span>
														</div>
														<span
															className={cn(
																"shrink-0 tabular-nums font-semibold",
																tx.isIncome
																	? "text-emerald-500"
																	: "text-foreground",
															)}
														>
															{tx.isIncome
																? formatSignedCurrency(tx.amountCents)
																: `-${formatCurrency(tx.amountCents)}`}
														</span>
													</div>
												),
											)}
										</div>
									</TooltipContent>
								</Tooltip>
							);
						})}
					</div>
				) : (
					<div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
						No recurring transactions posted this month.
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
