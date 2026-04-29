import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import {
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	Line,
	Tooltip as RechartsTooltip,
	ReferenceLine,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import { useTheme } from "#/components/theme-provider";
import { getChartTheme } from "#/lib/chart-fill";
import {
	formatCompactCurrency,
	formatCurrency,
	formatSignedCurrency,
} from "#/lib/format";
import type { DashboardPeriod, MonthlyTrendPoint } from "../../shared/finance";

type CashFlowTrendChartProps = {
	data: MonthlyTrendPoint[];
	period: DashboardPeriod;
};

type ChartPoint = {
	label: string;
	month: string;
	year: number;
	incomeCents: number;
	/** Negated so the bar renders below the zero baseline. */
	expenseCentsBar: number;
	expenseCents: number;
	netCents: number;
};

function deriveYear(monthKey: string): number {
	const parsed = Number.parseInt(monthKey.slice(0, 4), 10);
	return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
}

/** Adds a year suffix ("Nov'25") for points whose year differs from the
 * rightmost point — mirrors the "Nov'25 / Dec'25 / Jan / Feb / Mar / Apr"
 * pattern in the reference mockup. */
function enhanceLabel(
	point: MonthlyTrendPoint,
	period: DashboardPeriod,
	referenceYear: number,
): string {
	if (period === "yearly") return point.label;
	const year = deriveYear(point.month);
	if (year === referenceYear) return point.label;
	const twoDigit = String(year).slice(-2);
	return `${point.label}'${twoDigit}`;
}

/** Rounds a value magnitude up to a "nice" step (1/2/5 × 10^n) so that Y-axis
 * ticks land on readable boundaries like $1.5K / $3K / $5K. */
function niceStep(rawMagnitudeCents: number): number {
	if (rawMagnitudeCents <= 0) return 10_000;
	const magnitude = 10 ** Math.floor(Math.log10(rawMagnitudeCents));
	const normalized = rawMagnitudeCents / magnitude;
	if (normalized < 1.5) return 0.25 * magnitude;
	if (normalized < 3) return 0.5 * magnitude;
	if (normalized < 7) return 1 * magnitude;
	return 2 * magnitude;
}

function fullPeriodLabel(point: ChartPoint, period: DashboardPeriod): string {
	if (period === "monthly") {
		const [yr, mo] = point.month.split("-");
		const date = new Date(
			Number.parseInt(yr, 10),
			Number.parseInt(mo, 10) - 1,
			1,
		);
		return format(date, "MMMM yyyy");
	}
	if (period === "yearly") return point.month;
	if (period === "quarterly") return point.month.replace("-", " ");
	try {
		return format(parseISO(point.month), "MMM d, yyyy");
	} catch {
		return `${point.label}, ${point.year}`;
	}
}

export function CashFlowTrendChart({ data, period }: CashFlowTrendChartProps) {
	const { theme } = useTheme();
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const chartColors = useMemo(() => getChartTheme(theme === "dark"), [theme]);

	const referenceYear = useMemo(() => {
		if (data.length === 0) return new Date().getFullYear();
		return deriveYear(data[data.length - 1].month);
	}, [data]);

	const chartData: ChartPoint[] = useMemo(
		() =>
			data.map((point) => ({
				label: enhanceLabel(point, period, referenceYear),
				month: point.month,
				year: deriveYear(point.month),
				incomeCents: point.incomeCents,
				expenseCentsBar: -point.expenseCents,
				expenseCents: point.expenseCents,
				netCents: point.netCents,
			})),
		[data, period, referenceYear],
	);

	const hasData = chartData.some(
		(p) => p.incomeCents > 0 || p.expenseCents > 0,
	);

	const { yDomain, yTicks } = useMemo(() => {
		if (chartData.length === 0)
			return { yDomain: [0, 0] as [number, number], yTicks: [0] };
		const maxIncome = chartData.reduce((m, p) => Math.max(m, p.incomeCents), 0);
		const maxExpense = chartData.reduce(
			(m, p) => Math.max(m, p.expenseCents),
			0,
		);
		const span = Math.max(maxIncome, maxExpense, 1);
		const step = niceStep(span);
		const upper = Math.ceil((maxIncome * 1.1) / step) * step;
		const lower = -Math.ceil((maxExpense * 1.1) / step) * step;

		// Build explicit ticks from lower → upper stepping by `step`, always
		// including 0 so the zero line is always labelled on the Y-axis.
		const ticks: number[] = [];
		for (let t = lower; t <= upper + step * 0.01; t += step) {
			ticks.push(Math.round(t));
		}
		if (!ticks.includes(0)) ticks.push(0);
		ticks.sort((a, b) => a - b);

		return { yDomain: [lower, upper] as [number, number], yTicks: ticks };
	}, [chartData]);

	if (!hasData) {
		return (
			<div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
				No cash flow activity for this range.
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart
				data={chartData}
				margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
				barCategoryGap="30%"
				stackOffset="sign"
				onMouseMove={(state) => {
					const idx =
						typeof state?.activeTooltipIndex === "number"
							? state.activeTooltipIndex
							: null;
					if (idx !== activeIndex) setActiveIndex(idx);
				}}
				onMouseLeave={() => setActiveIndex(null)}
			>
				<CartesianGrid
					vertical={false}
					stroke={chartColors.grid}
					strokeDasharray="3 3"
				/>
				<XAxis
					dataKey="label"
					axisLine={false}
					tickLine={false}
					tick={{ fill: chartColors.axis, fontSize: 12 }}
					dy={8}
					interval={0}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: chartColors.axis, fontSize: 12 }}
					tickFormatter={(value) => formatCompactCurrency(Number(value))}
					width={56}
					domain={yDomain}
					ticks={yTicks}
				/>
				<ReferenceLine
					y={0}
					stroke={chartColors.zeroline}
					strokeWidth={1.25}
					ifOverflow="extendDomain"
				/>
				<RechartsTooltip
					cursor={false}
					wrapperStyle={{ outline: "none", opacity: 1 }}
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						const point = payload[0].payload as ChartPoint;
						return (
							<div className="pointer-events-none min-w-[200px] rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-xl">
								<div className="mb-2 font-semibold text-foreground">
									{fullPeriodLabel(point, period)}
								</div>
								<div className="space-y-1.5">
									<div className="flex items-center justify-between gap-6">
										<span className="inline-flex items-center gap-2 text-muted-foreground">
											<span
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: chartColors.incomeActive }}
											/>
											Income
										</span>
										<span className="tabular-nums font-medium text-foreground">
											{formatCurrency(point.incomeCents)}
										</span>
									</div>
									<div className="flex items-center justify-between gap-6">
										<span className="inline-flex items-center gap-2 text-muted-foreground">
											<span
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: chartColors.expenseActive }}
											/>
											Expenses
										</span>
										<span className="tabular-nums font-medium text-foreground">
											{formatCurrency(point.expenseCents)}
										</span>
									</div>
								</div>
								<div className="mt-2.5 flex items-center justify-between gap-6 border-t border-border pt-2">
									<span className="font-semibold text-foreground">
										Net cash flow
									</span>
									<span
										className={
											point.netCents >= 0
												? "tabular-nums font-semibold text-emerald-600 dark:text-emerald-400"
												: "tabular-nums font-semibold text-rose-600 dark:text-rose-400"
										}
									>
										{formatSignedCurrency(point.netCents)}
									</span>
								</div>
							</div>
						);
					}}
				/>
				<Bar
					dataKey="incomeCents"
					stackId="cashflow"
					radius={3}
					maxBarSize={36}
					isAnimationActive={false}
				>
					{chartData.map((entry, index) => (
						<Cell
							key={`income-${entry.month}`}
							fill={
								index === activeIndex
									? chartColors.incomeActive
									: chartColors.incomeIdle
							}
						/>
					))}
				</Bar>
				<Bar
					dataKey="expenseCentsBar"
					stackId="cashflow"
					radius={3}
					maxBarSize={36}
					isAnimationActive={false}
				>
					{chartData.map((entry, index) => (
						<Cell
							key={`expense-${entry.month}`}
							fill={
								index === activeIndex
									? chartColors.expenseActive
									: chartColors.expenseIdle
							}
						/>
					))}
				</Bar>
				<Line
					type="monotone"
					dataKey="netCents"
					stroke={chartColors.trendStroke}
					strokeWidth={1.5}
					strokeDasharray="4 4"
					dot={{
						r: 3,
						fill: chartColors.trendDot,
						stroke: chartColors.trendDot,
					}}
					activeDot={{
						r: 4.5,
						fill: chartColors.trendDot,
						stroke: chartColors.trendDot,
					}}
					isAnimationActive={false}
				/>
			</ComposedChart>
		</ResponsiveContainer>
	);
}
