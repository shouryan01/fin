import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	format,
	parseISO,
	startOfToday,
	startOfYear,
	subMonths,
	subYears,
} from "date-fns";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { AnimatedCurrency } from "#/components/animated-currency";
import { CashFlowTrendChart } from "#/components/cash-flow-trend-chart";
import { CategoryChart6m } from "#/components/category-chart-6m";
import { CategoryGlyph } from "#/components/category-glyph";
import { RecurringCalendarView } from "#/components/recurring-calendar";
import { RecurringSummary } from "#/components/recurring-summary";
import { SankeyChart } from "#/components/sankey-chart";
import { SpendVsPriorChart } from "#/components/spend-vs-prior-chart";
import { SpentHeatmap } from "#/components/spent-heatmap";
import { useTheme } from "#/components/theme-provider";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	CHART_BRAND_GREEN,
	chartFillForExpenseBreakdown,
	getChartTheme,
	NET_WORTH_COLORS,
} from "#/lib/chart-fill";
import { formatCompactCurrency, formatCurrency } from "#/lib/format";
import { accountsQueryOptions } from "#/queries/accounts";
import { dashboardQueryOptions } from "#/queries/dashboard";
import { settingsQueryOptions } from "#/queries/settings";
import {
	computePeriodBounds,
	type DashboardPeriod,
	type DashboardRange,
	dashboardPeriods,
	periodConfigFromSettings,
	periodLongLabels,
	periodShortLabels,
	stepPeriod,
} from "../../shared/finance";

const netWorthRangeGroups: { id: string; ranges: DashboardRange[] }[] = [
	{ id: "months", ranges: ["1m", "3m", "6m"] },
	{ id: "years", ranges: ["ytd", "1y", "3y", "5y", "10y"] },
	{ id: "all", ranges: ["all"] },
];

const rangeLabels: Record<DashboardRange, string> = {
	"1m": "1M",
	"3m": "3M",
	"6m": "6M",
	ytd: "YTD",
	"1y": "1Y",
	"3y": "3Y",
	"5y": "5Y",
	"10y": "10Y",
	all: "All",
};

function netWorthRangeStart(range: DashboardRange, today: Date): string | null {
	switch (range) {
		case "1m":
			return format(subMonths(today, 1), "yyyy-MM-dd");
		case "3m":
			return format(subMonths(today, 3), "yyyy-MM-dd");
		case "6m":
			return format(subMonths(today, 6), "yyyy-MM-dd");
		case "ytd":
			return format(startOfYear(today), "yyyy-MM-dd");
		case "1y":
			return format(subYears(today, 1), "yyyy-MM-dd");
		case "3y":
			return format(subYears(today, 3), "yyyy-MM-dd");
		case "5y":
			return format(subYears(today, 5), "yyyy-MM-dd");
		case "10y":
			return format(subYears(today, 10), "yyyy-MM-dd");
		case "all":
			return null;
	}
}

function tooltipCurrencyFormatter(
	value: number | string | ReadonlyArray<number | string> | undefined,
) {
	if (Array.isArray(value)) {
		return formatCurrency(Number(value[0] ?? 0));
	}

	return formatCurrency(Number(value ?? 0));
}

function periodTrendUnitLabel(period: DashboardPeriod, count: number): string {
	const plural = count === 1 ? "" : "s";
	switch (period) {
		case "weekly":
			return `week${plural}`;
		case "bi-weekly":
			return `paycheck${plural}`;
		case "monthly":
			return `month${plural}`;
		case "quarterly":
			return `quarter${plural}`;
		case "yearly":
			return `year${plural}`;
	}
}

function budgetPieTooltipFormatter(
	value: number | string | ReadonlyArray<number | string> | undefined,
	budgetTotalCents: number,
) {
	const cents = Array.isArray(value)
		? Number(value[0] ?? 0)
		: Number(value ?? 0);
	const amount = formatCurrency(cents);
	if (budgetTotalCents <= 0) {
		return amount;
	}
	const pct = (cents / budgetTotalCents) * 100;
	return `${amount} (${pct.toFixed(1)}% of expenses)`;
}

export default function DashboardScreen() {
	const [period, setPeriod] = useState<DashboardPeriod>("monthly");
	const [anchor, setAnchor] = useState(() => format(new Date(), "yyyy-MM-dd"));

	const settingsQuery = useQuery(settingsQueryOptions());
	const periodConfig = useMemo(
		() => periodConfigFromSettings(settingsQuery.data),
		[settingsQuery.data],
	);

	const anchorDate = useMemo(() => parseISO(anchor), [anchor]);
	const currentBounds = useMemo(
		() => computePeriodBounds(period, anchorDate, periodConfig),
		[period, anchorDate, periodConfig],
	);

	const isCurrent = useMemo(() => {
		const todayBounds = computePeriodBounds(period, new Date(), periodConfig);
		return todayBounds.key === currentBounds.key;
	}, [period, currentBounds.key, periodConfig]);

	const prevAnchorDate = useMemo(
		() => stepPeriod(period, currentBounds.start, -1),
		[period, currentBounds.start],
	);
	const nextAnchorDate = useMemo(
		() => stepPeriod(period, currentBounds.start, 1),
		[period, currentBounds.start],
	);
	const prevBounds = useMemo(
		() => computePeriodBounds(period, prevAnchorDate, periodConfig),
		[period, prevAnchorDate, periodConfig],
	);
	const nextBounds = useMemo(
		() => computePeriodBounds(period, nextAnchorDate, periodConfig),
		[period, nextAnchorDate, periodConfig],
	);

	const [range, setRange] = useState<DashboardRange>("3m");
	const { theme } = useTheme();
	const queryClient = useQueryClient();

	const dashboardQuery = useQuery(dashboardQueryOptions(period, anchor));
	const accountsQuery = useQuery(accountsQueryOptions());

	const netWorthComposition = useMemo(() => {
		const accounts = accountsQuery.data ?? [];
		const assets = accounts.filter(
			(a) => a.classification === "asset" && a.includeInNetWorth && !a.archived,
		);
		const liabilities = accounts.filter(
			(a) =>
				a.classification === "liability" && a.includeInNetWorth && !a.archived,
		);
		const cashCents = assets
			.filter((a) => ["checking", "savings", "cash"].includes(a.type))
			.reduce((s, a) => s + a.currentBalanceCents, 0);
		const investmentCents = assets
			.filter((a) => a.type === "investment")
			.reduce((s, a) => s + a.currentBalanceCents, 0);
		const assetTotalCents = assets.reduce(
			(s, a) => s + a.currentBalanceCents,
			0,
		);
		const otherAssetCents = assetTotalCents - cashCents - investmentCents;
		const liabilityCents = Math.abs(
			liabilities.reduce((s, a) => s + a.currentBalanceCents, 0),
		);
		const grandTotal =
			cashCents + investmentCents + otherAssetCents + liabilityCents;
		const segments = [
			{ label: "Cash", cents: cashCents, color: NET_WORTH_COLORS.cash },
			{ label: "Investments", cents: investmentCents, color: NET_WORTH_COLORS.investments },
			...(otherAssetCents > 0
				? [{ label: "Other assets", cents: otherAssetCents, color: NET_WORTH_COLORS.other }]
				: []),
			...(liabilityCents > 0
				? [{ label: "Liabilities", cents: liabilityCents, color: NET_WORTH_COLORS.liabilities }]
				: []),
		].filter((s) => s.cents > 0);
		return { segments, grandTotal, assetTotalCents, liabilityCents };
	}, [accountsQuery.data]);

	useEffect(() => {
		if (!dashboardQuery.data) return;
		const prevStr = format(prevAnchorDate, "yyyy-MM-dd");
		const nextStr = format(nextAnchorDate, "yyyy-MM-dd");
		void queryClient.prefetchQuery(dashboardQueryOptions(period, prevStr));
		void queryClient.prefetchQuery(dashboardQueryOptions(period, nextStr));
	}, [
		dashboardQuery.data,
		queryClient,
		period,
		prevAnchorDate,
		nextAnchorDate,
	]);

	const filteredNetWorth = useMemo(() => {
		const series = dashboardQuery.data?.netWorthTrend ?? [];
		const today = startOfToday();
		const todayStr = format(today, "yyyy-MM-dd");
		const throughToday = series.filter((point) => point.date <= todayStr);
		const startStr = netWorthRangeStart(range, today);
		if (!startStr) {
			return throughToday;
		}
		return throughToday.filter((point) => point.date >= startStr);
	}, [dashboardQuery.data?.netWorthTrend, range]);

	const netWorthGradientId = useId().replace(/:/g, "");

	const chartColors = useMemo(() => getChartTheme(theme === "dark"), [theme]);

	const budgetPieTotalCents = useMemo(() => {
		if (!dashboardQuery.data) {
			return 0;
		}
		return dashboardQuery.data.monthlyCategoryTotals.reduce(
			(s, e) => s + e.amountCents,
			0,
		);
	}, [dashboardQuery.data]);

	const cashFlowTrendAverageNetCents = useMemo(() => {
		const trend = dashboardQuery.data?.monthlyTrend ?? [];
		if (trend.length === 0) return 0;
		const sum = trend.reduce((s, point) => s + point.netCents, 0);
		return Math.round(sum / trend.length);
	}, [dashboardQuery.data?.monthlyTrend]);

	const cashFlowTrendSubtitle = useMemo(() => {
		const count = dashboardQuery.data?.monthlyTrend.length ?? 0;
		if (count === 0) return "No periods available";
		const unit = periodTrendUnitLabel(period, count);
		return `Last ${count} ${unit}`;
	}, [dashboardQuery.data?.monthlyTrend.length, period]);

	if (dashboardQuery.isPending) {
		return (
			<main className="grid gap-6 p-4 lg:p-6">
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{["spent", "cashflow", "networth", "average"].map((key) => (
						<Card key={key}>
							<CardContent className="p-6 text-sm text-muted-foreground">
								Loading dashboard...
							</CardContent>
						</Card>
					))}
				</div>
			</main>
		);
	}

	if (!dashboardQuery.data) {
		return (
			<main className="grid gap-6 p-4 lg:p-6">
				<Card>
					<CardContent className="p-6 text-sm text-muted-foreground">
						Unable to load the dashboard right now.
					</CardContent>
				</Card>
			</main>
		);
	}

	const data = dashboardQuery.data;

	const netWorthAccent =
		data.netWorthCents >= 0
			? { stroke: CHART_BRAND_GREEN, fillStop: CHART_BRAND_GREEN }
			: { stroke: NET_WORTH_COLORS.liabilities, fillStop: NET_WORTH_COLORS.liabilities };

	const todayIso = format(startOfToday(), "yyyy-MM-dd");
	const spentHeatmapLabel =
		period === "monthly"
			? format(currentBounds.start, "MMMM")
			: period === "bi-weekly"
				? isCurrent
					? "this paycheck"
					: `paycheck of ${data.periodLabel}`
				: data.periodLabel;

	return (
		<>
			<header className="sticky top-12 z-10 flex w-full items-center justify-between border-b border-border bg-background/90 px-4 py-2 sm:px-6 sm:py-3 backdrop-blur">
				<button
					type="button"
					className="group relative hidden sm:flex h-10 w-48 cursor-pointer items-center justify-start overflow-hidden rounded-xl text-left"
					onClick={() => setAnchor(format(prevAnchorDate, "yyyy-MM-dd"))}
				>
					<div className="relative z-10 flex w-full items-center px-4 transition-opacity duration-300 group-hover:opacity-0">
						<h3 className="text-sm font-medium tracking-tight text-muted-foreground/60 truncate">
							{prevBounds.label}
						</h3>
					</div>
					<div className="absolute inset-0 z-20 flex items-center px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
						<span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
							<ArrowLeft className="h-4 w-4" /> Previous
						</span>
					</div>
				</button>

				<div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
					<div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/30 p-0.5">
						{dashboardPeriods.map((p) => (
							<Button
								key={p}
								size="sm"
								variant={p === period ? "default" : "ghost"}
								className="h-7 px-2 text-xs"
								onClick={() => setPeriod(p)}
								title={periodLongLabels[p]}
								aria-label={periodLongLabels[p]}
							>
								{periodShortLabels[p]}
							</Button>
						))}
					</div>
					{isCurrent ? null : (
						<button
							type="button"
							onClick={() => setAnchor(format(new Date(), "yyyy-MM-dd"))}
							className="text-xs font-medium text-primary hover:underline transition-colors cursor-pointer flex items-center justify-center mx-auto"
						>
							Return to current
						</button>
					)}
					{period === "bi-weekly" ? (
						<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
							Paycheck period
						</span>
					) : null}
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						{data.periodLabel}
					</h2>
				</div>

				<button
					type="button"
					className="group relative hidden sm:flex h-10 w-48 cursor-pointer items-center justify-end overflow-hidden rounded-xl text-right"
					onClick={() => setAnchor(format(nextAnchorDate, "yyyy-MM-dd"))}
				>
					<div className="relative z-10 flex w-full items-center justify-end px-4 transition-opacity duration-300 group-hover:opacity-0">
						<h3 className="text-sm font-medium tracking-tight text-muted-foreground/60 truncate">
							{nextBounds.label}
						</h3>
					</div>
					<div className="absolute inset-0 z-20 flex items-center justify-end px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
						<span className="text-sm font-semibold text-foreground flex items-center justify-end gap-1.5">
							Next <ArrowRight className="h-4 w-4" />
						</span>
					</div>
				</button>

				{/* Mobile Controls */}
				<div className="flex w-full items-center justify-between sm:hidden">
					<button
						type="button"
						className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
						onClick={() => setAnchor(format(prevAnchorDate, "yyyy-MM-dd"))}
					>
						Prev
					</button>
					<button
						type="button"
						className="rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
						onClick={() => setAnchor(format(nextAnchorDate, "yyyy-MM-dd"))}
					>
						Next
					</button>
				</div>
			</header>
			<main className="grid gap-6 p-4 lg:p-6">
				<section className="w-full min-w-0">
					<Card className="shadow-sm w-full min-w-0">
						<CardHeader className="space-y-4">
							<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
								<div className="space-y-1 min-w-0">
									<CardTitle className="text-base font-semibold">
										Net worth
									</CardTitle>
									<div className="flex items-center gap-2 flex-wrap">
										<AnimatedCurrency
											valueCents={data.netWorthCents}
											signed
											className={
												data.netWorthCents >= 0
													? "text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums"
													: "text-3xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums"
											}
										/>
										<span
											className="relative flex h-3 w-3 mt-1.5"
											title="Chart is live"
										>
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
											<span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
										</span>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									{netWorthRangeGroups.map((group) => (
										<div
											key={group.id}
											className="flex gap-1 rounded-lg border border-border/70 bg-muted/30 p-1"
										>
											{group.ranges.map((option) => (
												<Button
													key={option}
													size="sm"
													variant={option === range ? "default" : "ghost"}
													className="h-8 shrink-0 px-2.5 text-xs"
													onClick={() => setRange(option)}
												>
													{rangeLabels[option]}
												</Button>
											))}
										</div>
									))}
								</div>
							</div>
						</CardHeader>
						<CardContent className="h-[360px] w-full min-w-0 pt-0">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={filteredNetWorth}>
									<defs>
										<linearGradient
											id={netWorthGradientId}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="0%"
												stopColor={netWorthAccent.fillStop}
												stopOpacity={0.32}
											/>
											<stop
												offset="55%"
												stopColor={netWorthAccent.fillStop}
												stopOpacity={0.06}
											/>
											<stop
												offset="100%"
												stopColor={netWorthAccent.fillStop}
												stopOpacity={0}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										stroke={chartColors.grid}
										strokeDasharray="3 3"
										vertical={false}
									/>
									<XAxis
										axisLine={{ stroke: chartColors.grid }}
										dataKey="label"
										tick={{ fill: chartColors.axis, fontSize: 12 }}
										tickLine={{ stroke: chartColors.grid }}
									/>
									<YAxis
										axisLine={{ stroke: chartColors.grid }}
										tickFormatter={(value) => formatCompactCurrency(value)}
										tick={{ fill: chartColors.axis, fontSize: 12 }}
										tickLine={{ stroke: chartColors.grid }}
									/>
									<Tooltip
										wrapperStyle={{ outline: "none" }}
										content={({ active, payload, label }) => {
											if (!active || !payload?.length) return null;
											return (
												<div className="pointer-events-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-xl">
													<div className="mb-1 font-semibold text-foreground">{label}</div>
													<div className="tabular-nums text-muted-foreground">
														{tooltipCurrencyFormatter(payload[0]?.value)}
													</div>
												</div>
											);
										}}
									/>
									<Area
										type="monotone"
										dataKey="netWorthCents"
										name="Net worth"
										stroke={netWorthAccent.stroke}
										strokeWidth={2.5}
										fill={`url(#${netWorthGradientId})`}
										fillOpacity={1}
										dot={false}
										activeDot={{ r: 4, fill: netWorthAccent.stroke }}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</section>

				{netWorthComposition.segments.length > 0 && (
					<section className="w-full min-w-0">
						<Card className="shadow-sm w-full min-w-0">
							<CardHeader className="pb-4">
								<div className="flex items-center justify-between">
									<CardTitle className="text-base font-semibold">
										Net worth composition
									</CardTitle>
									<span className="text-base font-semibold tabular-nums text-foreground">
										{formatCurrency(
											netWorthComposition.assetTotalCents -
												netWorthComposition.liabilityCents,
										)}
									</span>
								</div>
							</CardHeader>
							<CardContent className="pb-5">
								<NetWorthCompositionBar
									segments={netWorthComposition.segments}
									grandTotal={netWorthComposition.grandTotal}
								/>
							</CardContent>
						</Card>
					</section>
				)}

				<section className="w-full min-w-0">
					<Card className="shadow-sm w-full min-w-0">
						<CardHeader>
							<CardTitle>Cash flow</CardTitle>
						</CardHeader>
						<CardContent className="h-[320px] w-full min-w-0 pt-0">
							<SankeyChart
								totalIncomeCents={data.totalIncomeCents}
								totalExpenseCents={data.totalExpenseCents}
								netCashFlowCents={data.netCashFlowCents}
								monthlyCategoryTotals={data.monthlyCategoryTotals}
							/>
						</CardContent>
					</Card>
				</section>

				<section className="w-full min-w-0">
					<Card className="shadow-sm w-full min-w-0">
						<CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
							<div className="space-y-1">
								<CardTitle className="text-base font-semibold">
									Cash flow trend
								</CardTitle>
								<p className="text-xs text-muted-foreground">
									{cashFlowTrendSubtitle}
								</p>
							</div>
							<div className="flex flex-col items-end gap-0.5">
								<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
									Avg net
								</span>
								<AnimatedCurrency
									valueCents={cashFlowTrendAverageNetCents}
									signed
									className={
										cashFlowTrendAverageNetCents >= 0
											? "text-2xl font-semibold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400"
											: "text-2xl font-semibold tracking-tight tabular-nums text-rose-600 dark:text-rose-400"
									}
								/>
							</div>
						</CardHeader>
						<CardContent className="h-[300px] w-full min-w-0 pt-0">
							<CashFlowTrendChart data={data.monthlyTrend} period={period} />
						</CardContent>
					</Card>
				</section>

				<section className="w-full min-w-0">
					<Card className="shadow-sm w-full min-w-0">
						<CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
							<div className="space-y-1">
								<CardTitle className="text-base font-semibold">
									Cumulative spend
								</CardTitle>
								<p className="text-xs text-muted-foreground">
									{data.spendVsPrior.currentLabel}{" "}
									<span className="text-muted-foreground/70">
										vs {data.spendVsPrior.priorLabel}
									</span>
								</p>
							</div>
							<AnimatedCurrency
								valueCents={data.totalExpenseCents}
								className="text-2xl font-semibold tracking-tight text-foreground tabular-nums"
							/>
						</CardHeader>
						<CardContent className="h-[300px] w-full min-w-0 pt-0">
							<SpendVsPriorChart series={data.spendVsPrior} />
						</CardContent>
					</Card>
				</section>

				<section>
					<Card className="overflow-hidden shadow-sm">
						<div className="grid gap-0 lg:grid-cols-2">
							<div className="flex min-w-0 flex-col border-b border-border/70 lg:border-b-0 lg:border-r">
								<div className="flex items-center justify-between px-5 pt-5">
									<Link
										to="/transactions"
										className="group inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
									>
										Spent in {spentHeatmapLabel}
										<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
									</Link>
								</div>
								<div className="px-5 pb-5 pt-3">
									<AnimatedCurrency
										valueCents={data.totalExpenseCents}
										className="text-3xl font-semibold tracking-tight text-foreground tabular-nums"
									/>
								</div>
								<div className="px-5 pb-5">
									<SpentHeatmap
										days={data.dailyCashFlow}
										todayIso={todayIso}
										period={period}
									/>
								</div>
							</div>
							<div className="flex min-w-0 flex-col">
								<div className="px-5 pt-5">
									<h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
										Expenses breakdown
									</h3>
								</div>
								{data.monthlyCategoryTotals.length === 0 ? (
									<div className="px-5 py-8 text-center text-sm text-muted-foreground">
										No expenses in this period.
									</div>
								) : (
									<>
										<div className="h-[240px] w-full min-w-0 shrink-0 px-5 pt-3">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart
													margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
												>
													<Pie
														data={data.monthlyCategoryTotals}
														dataKey="amountCents"
														nameKey="categoryName"
														innerRadius="58%"
														outerRadius="92%"
														paddingAngle={2.5}
														cornerRadius={5}
														stroke="hsl(var(--card))"
														strokeWidth={2}
													>
														{data.monthlyCategoryTotals.map((entry, index) => (
															<Cell
																key={entry.categoryName}
																fill={chartFillForExpenseBreakdown(index)}
															/>
														))}
													</Pie>
													<Tooltip
														wrapperStyle={{ outline: "none" }}
														content={({ active, payload }) => {
															if (!active || !payload?.length) return null;
															const entry = payload[0];
															return (
																<div className="pointer-events-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-xl">
																	<div className="mb-1 font-semibold text-foreground">
																		{String(entry.name)}
																	</div>
																	<div className="tabular-nums text-muted-foreground">
																		{budgetPieTooltipFormatter(
																			entry.value,
																			budgetPieTotalCents,
																		)}
																	</div>
																</div>
															);
														}}
													/>
												</PieChart>
											</ResponsiveContainer>
										</div>
										<div className="grid gap-1.5 px-5 pb-5 pt-3">
											{data.monthlyCategoryTotals
												.slice(0, 5)
												.map((entry, index) => {
													const fill = chartFillForExpenseBreakdown(index);
													return (
														<div
															key={entry.categoryName}
															className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/25 py-2 pl-2 pr-3 text-sm shadow-sm"
															style={{
																borderLeftWidth: 3,
																borderLeftColor: fill,
															}}
														>
															<div className="flex min-w-0 items-center gap-2.5">
																<span
																	className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card shadow-sm"
																	style={{ color: fill }}
																>
																	<CategoryGlyph
																		iconId={entry.icon}
																		className="h-4 w-4"
																	/>
																</span>
																<span className="truncate font-medium text-foreground/90">
																	{entry.categoryName}
																</span>
															</div>
															<span className="shrink-0 tabular-nums font-semibold text-foreground">
																{formatCurrency(entry.amountCents)}
															</span>
														</div>
													);
												})}
										</div>
									</>
								)}
							</div>
						</div>
					</Card>
				</section>

				<section className="w-full min-w-0">
					<div className="grid gap-6">
						<Card className="shadow-sm w-full min-w-0">
							<CardHeader className="pb-2">
								<CardTitle className="text-base font-semibold">
									Expenses
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CategoryChart6m
									series={data.expenseCategoryTrend}
									kind="expense"
									excludedCategories={
										settingsQuery.data?.expenseChartExcludedCategories
									}
								/>
							</CardContent>
						</Card>

						{settingsQuery.data?.showIncomeChart ? (
							<Card className="shadow-sm w-full min-w-0">
								<CardHeader className="pb-2">
									<CardTitle className="text-base font-semibold">
										Income
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CategoryChart6m
										series={data.incomeCategoryTrend}
										kind="income"
									/>
								</CardContent>
							</Card>
						) : null}

						<div className="grid gap-6 lg:grid-cols-2">
							<Card className="shadow-sm w-full min-w-0">
								<CardHeader className="pb-2">
									<CardTitle className="text-base font-semibold">
										Subscriptions
									</CardTitle>
								</CardHeader>
								<CardContent>
									<RecurringSummary
										subscriptions={data.recurringSubscriptions}
									/>
								</CardContent>
							</Card>

							<Card className="shadow-sm w-full min-w-0">
								<CardHeader className="pb-2">
									<CardTitle className="text-base font-semibold">
										Recurring transactions
									</CardTitle>
								</CardHeader>
								<CardContent>
									<RecurringCalendarView calendar={data.recurringCalendar} />
								</CardContent>
							</Card>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}

function NetWorthCompositionBar({
	segments,
	grandTotal,
}: {
	segments: { label: string; cents: number; color: string }[];
	grandTotal: number;
}) {
	const [animated, setAnimated] = useState(false);

	useEffect(() => {
		const id = requestAnimationFrame(() => {
			requestAnimationFrame(() => setAnimated(true));
		});
		return () => cancelAnimationFrame(id);
	}, []);

	if (grandTotal <= 0) return null;

	return (
		<div className="grid gap-4">
			{/* Single segmented bar */}
			<div className="flex h-3 w-full overflow-hidden rounded-full bg-muted gap-px">
				{segments.map((seg, i) => {
					const pct = (seg.cents / grandTotal) * 100;
					const isFirst = i === 0;
					const isLast = i === segments.length - 1;
					return (
						<div
							key={seg.label}
							className="h-full transition-[flex] duration-700 ease-out"
							style={{
								flex: animated ? pct : 0,
								backgroundColor: seg.color,
								borderRadius: isFirst
									? "9999px 0 0 9999px"
									: isLast
										? "0 9999px 9999px 0"
										: 0,
								minWidth: animated && pct > 0 ? 4 : 0,
							}}
						/>
					);
				})}
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-x-5 gap-y-2">
				{segments.map((seg) => {
					const pct = (seg.cents / grandTotal) * 100;
					return (
						<div key={seg.label} className="flex items-center gap-2 min-w-0">
							<span
								className="h-2.5 w-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: seg.color }}
							/>
							<span className="text-sm text-muted-foreground truncate">
								{seg.label}{" "}
								<span className="text-foreground/50">({pct.toFixed(0)}%)</span>
							</span>
							<span className="text-sm font-medium tabular-nums text-foreground ml-1">
								{formatCompactCurrency(seg.cents)}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
