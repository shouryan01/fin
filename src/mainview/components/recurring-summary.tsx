import { useMemo } from "react";
import { CategoryGlyph } from "#/components/category-glyph";
import { chartFillForExpenseBreakdown } from "#/lib/chart-fill";
import { formatCurrency } from "#/lib/format";
import type { RecurringSubscription } from "../../shared/finance";

type RecurringSummaryProps = {
	subscriptions: RecurringSubscription[];
};

export function RecurringSummary({ subscriptions }: RecurringSummaryProps) {
	const { monthlyCents, yearlyCents } = useMemo(() => {
		return subscriptions.reduce(
			(totals, sub) => {
				totals.monthlyCents += sub.monthlyCents;
				totals.yearlyCents += sub.yearlyCents;
				return totals;
			},
			{ monthlyCents: 0, yearlyCents: 0 },
		);
	}, [subscriptions]);

	if (subscriptions.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
				No recurring subscriptions detected yet. Mark transactions as recurring
				to see them here.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="rounded-xl border border-border/70 bg-muted/25 p-4">
					<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
						Monthly total
					</div>
					<div className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">
						{formatCurrency(monthlyCents)}
					</div>
				</div>
				<div className="rounded-xl border border-border/70 bg-muted/25 p-4">
					<div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
						Estimated yearly
					</div>
					<div className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">
						{formatCurrency(yearlyCents)}
					</div>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border/70">
				<div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border/70 bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
					<span>Subscription</span>
					<span className="text-right">Monthly</span>
					<span className="text-right">Yearly</span>
				</div>
				<ul className="divide-y divide-border/70">
					{subscriptions.map((sub, index) => {
						const fill = chartFillForExpenseBreakdown(index);
						return (
							<li
								key={sub.id}
								className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-4 py-3"
							>
								<div className="flex min-w-0 items-center gap-3">
									<span
										className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card shadow-sm"
										style={{ color: fill }}
									>
										<CategoryGlyph
											iconId={sub.categoryIcon ?? "CircleDot"}
											className="h-4 w-4"
										/>
									</span>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{sub.merchant}
										</p>
										<p className="truncate text-[11px] text-muted-foreground">
											{sub.categoryName ?? "Uncategorized"}
											{sub.observedMonths > 1
												? ` · avg of ${sub.observedMonths} mo`
												: null}
										</p>
									</div>
								</div>
								<span className="text-right text-sm font-semibold tabular-nums text-foreground">
									{formatCurrency(sub.monthlyCents)}
								</span>
								<span className="text-right text-sm tabular-nums text-muted-foreground">
									{formatCurrency(sub.yearlyCents)}
								</span>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}
