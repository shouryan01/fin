import { useMemo, useState } from "react";
import {
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { CategoryGlyph } from "#/components/category-glyph";
import { useTheme } from "#/components/theme-provider";
import { Button } from "#/components/ui/button";
import {
	CHART_BRAND_GREEN,
	chartFillForExpenseBreakdown,
	getChartTheme,
} from "#/lib/chart-fill";
import { formatCompactCurrency, formatCurrency } from "#/lib/format";
import {
	type CategoryTrendSeries,
	periodPluralLabel,
} from "../../shared/finance";

type CategoryChart6mProps = {
	series: CategoryTrendSeries;
	kind: "expense" | "income";
	excludedCategories?: string[];
};

const MAX_CATEGORIES_IN_BAR = 6;
const INCOME_ACCENT = CHART_BRAND_GREEN;
const EXPENSE_ACCENT = "#ef4444";

function kindLabel(kind: "expense" | "income") {
	return kind === "expense" ? "Expenses" : "Income";
}

export function CategoryChart6m({
	series,
	kind,
	excludedCategories,
}: CategoryChart6mProps) {
	const [view, setView] = useState<"pie" | "bar">("pie");
	const [isPieHovered, setIsPieHovered] = useState(false);
	const { theme } = useTheme();

	const chartColors = useMemo(() => getChartTheme(theme === "dark"), [theme]);

	const accent = kind === "expense" ? EXPENSE_ACCENT : INCOME_ACCENT;

	const excludedSet = useMemo(
		() => new Set((excludedCategories ?? []).map((n) => n.toLowerCase())),
		[excludedCategories],
	);

	const categoryTotals = useMemo(
		() =>
			excludedSet.size === 0
				? series.categoryTotals
				: series.categoryTotals.filter(
						(c) => !excludedSet.has(c.categoryName.toLowerCase()),
					),
		[series.categoryTotals, excludedSet],
	);

	const grandTotal = useMemo(
		() => categoryTotals.reduce((sum, c) => sum + c.amountCents, 0),
		[categoryTotals],
	);

	const paletteByCategory = useMemo(() => {
		const map = new Map<string, string>();
		categoryTotals.forEach((entry, index) => {
			map.set(entry.categoryName, chartFillForExpenseBreakdown(index));
		});
		return map;
	}, [categoryTotals]);

	const topCategories = useMemo(() => {
		if (categoryTotals.length <= MAX_CATEGORIES_IN_BAR) {
			return categoryTotals;
		}
		return categoryTotals.slice(0, MAX_CATEGORIES_IN_BAR);
	}, [categoryTotals]);

	const barChartData = useMemo(() => {
		const topNames = new Set(topCategories.map((c) => c.categoryName));
		const otherLabel = "Other";
		return series.buckets.map((bucket) => {
			const point: Record<string, number | string> = {
				label: bucket.label,
				key: bucket.key,
			};
			let other = 0;
			let bucketTotal = 0;
			for (const [name, amount] of Object.entries(bucket.categories)) {
				if (excludedSet.has(name.toLowerCase())) continue;
				if (topNames.has(name)) {
					point[name] = amount;
					bucketTotal += amount;
				} else {
					other += amount;
				}
			}
			if (other > 0 && topCategories.length > 0) {
				point[otherLabel] = other;
				bucketTotal += other;
			}
			point.__total = bucketTotal;
			return point;
		});
	}, [series.buckets, topCategories, excludedSet]);

	const hasOther = useMemo(
		() => barChartData.some((row) => "Other" in row && Number(row.Other) > 0),
		[barChartData],
	);

	const bucketCount = series.buckets.length;
	const rangeLabel = `Last ${bucketCount} ${periodPluralLabel(series.period, bucketCount)}`;

	if (grandTotal === 0) {
		return (
			<div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
				No {kind === "expense" ? "expenses" : "income"} in the{" "}
				{rangeLabel.toLowerCase()}.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-baseline gap-3">
					<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
						{rangeLabel}
					</span>
					<span className="text-xl font-semibold tabular-nums text-foreground">
						{formatCurrency(grandTotal)}
					</span>
				</div>
				<div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/30 p-0.5">
					<Button
						size="sm"
						variant={view === "pie" ? "default" : "ghost"}
						className="h-7 px-2.5 text-xs"
						onClick={() => setView("pie")}
					>
						Pie
					</Button>
					<Button
						size="sm"
						variant={view === "bar" ? "default" : "ghost"}
						className="h-7 px-2.5 text-xs"
						onClick={() => setView("bar")}
					>
						Bar
					</Button>
				</div>
			</div>

			{view === "pie" ? (
				<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
					<div className="relative h-[260px] w-full min-w-0">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
								<Pie
									data={categoryTotals}
									dataKey="amountCents"
									nameKey="categoryName"
									innerRadius="60%"
									outerRadius="92%"
									paddingAngle={2.5}
									cornerRadius={5}
									stroke="hsl(var(--card))"
									strokeWidth={2}
									onMouseEnter={() => setIsPieHovered(true)}
									onMouseLeave={() => setIsPieHovered(false)}
								>
									{categoryTotals.map((entry) => (
										<Cell
											key={entry.categoryName}
											fill={paletteByCategory.get(entry.categoryName) ?? accent}
										/>
									))}
								</Pie>
								<Tooltip
									wrapperStyle={{ outline: "none", opacity: 1 }}
									content={({ active, payload }) => {
										if (!active || !payload?.length) return null;
										const entry = payload[0];
										return (
											<div className="pointer-events-none min-w-[160px] rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-xl">
												<div className="mb-1 font-semibold text-foreground">
													{String(entry.name)}
												</div>
												<div className="tabular-nums text-muted-foreground">
													{formatCurrency(Number(entry.value ?? 0))}
												</div>
											</div>
										);
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
						{!isPieHovered && (
							<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
								<span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
									Total
								</span>
								<span className="text-lg font-semibold tabular-nums text-foreground">
									{formatCompactCurrency(grandTotal)}
								</span>
							</div>
						)}
					</div>
					<div className="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto pr-1">
						{categoryTotals.map((entry) => {
							const fill = paletteByCategory.get(entry.categoryName) ?? accent;
							const pct =
								grandTotal > 0 ? (entry.amountCents / grandTotal) * 100 : 0;
							return (
								<div
									key={entry.categoryName}
									className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/25 py-2 pl-2 pr-3 text-sm shadow-sm"
									style={{ borderLeftWidth: 3, borderLeftColor: fill }}
								>
									<div className="flex min-w-0 items-center gap-2.5">
										<span
											className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card shadow-sm"
											style={{ color: fill }}
										>
											<CategoryGlyph iconId={entry.icon} className="h-4 w-4" />
										</span>
										<div className="min-w-0">
											<div className="truncate font-medium text-foreground/90">
												{entry.categoryName}
											</div>
											<div className="text-[11px] text-muted-foreground tabular-nums">
												{pct.toFixed(1)}% of {kindLabel(kind).toLowerCase()}
											</div>
										</div>
									</div>
									<span className="shrink-0 tabular-nums font-semibold text-foreground">
										{formatCurrency(entry.amountCents)}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			) : (
			<div className="h-[260px] w-full min-w-0">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart
						data={barChartData}
						margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
						barCategoryGap="28%"
					>
						<CartesianGrid
							stroke={chartColors.grid}
							strokeDasharray="3 3"
							vertical={false}
						/>
						<XAxis
							axisLine={false}
							tickLine={false}
							dataKey="label"
							tick={{ fill: chartColors.axis, fontSize: 12 }}
							dy={8}
							interval={0}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tickFormatter={(value) => formatCompactCurrency(Number(value))}
							tick={{ fill: chartColors.axis, fontSize: 12 }}
							width={56}
						/>
						<Tooltip
							cursor={{
								fill: theme === "dark" ? "#f8fafc0d" : "#0f172a0d",
							}}
							wrapperStyle={{ outline: "none", opacity: 1, zIndex: 50 }}
							content={({ active, payload, label }) => {
								if (!active || !payload?.length) return null;
								const totalEntry = payload.find((p) => p.dataKey === "__total");
								const categoryEntries = payload
									.filter((p) => p.dataKey !== "__total")
									.slice()
									.reverse();
								return (
									<div className="pointer-events-none min-w-[200px] rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-xl">
										<div className="mb-2 font-semibold text-foreground">
											{label}
										</div>
										<div className="space-y-1.5">
											{categoryEntries.map((entry) => (
												<div
													key={String(entry.dataKey)}
													className="flex items-center justify-between gap-6"
												>
													<span className="inline-flex items-center gap-2 text-muted-foreground">
														<span
															className="h-2 w-2 shrink-0 rounded-full"
															style={{
																backgroundColor: String(entry.color ?? ""),
															}}
														/>
														{String(entry.name)}
													</span>
													<span className="tabular-nums font-medium text-foreground">
														{formatCurrency(Number(entry.value ?? 0))}
													</span>
												</div>
											))}
										</div>
										{totalEntry ? (
											<div className="mt-2.5 flex items-center justify-between gap-6 border-t border-border pt-2">
												<span className="font-semibold text-foreground">
													Total
												</span>
												<span className="tabular-nums font-semibold text-foreground">
													{formatCurrency(Number(totalEntry.value ?? 0))}
												</span>
											</div>
										) : null}
									</div>
								);
							}}
						/>
						<Legend
							wrapperStyle={{
								color: chartColors.axis,
								fontSize: 12,
								paddingTop: 8,
							}}
							iconType="circle"
							iconSize={8}
						/>
						{topCategories.map((entry) => {
							const fill =
								paletteByCategory.get(entry.categoryName) ?? accent;
							const isLastTop =
								!hasOther &&
								entry === topCategories[topCategories.length - 1];
							return (
								<Bar
									key={entry.categoryName}
									dataKey={entry.categoryName}
									stackId="total"
									fill={fill}
									fillOpacity={0.78}
									stroke={fill}
									strokeOpacity={0.95}
									strokeWidth={0}
									name={entry.categoryName}
									radius={isLastTop ? [6, 6, 0, 0] : 0}
									maxBarSize={48}
									isAnimationActive={false}
								/>
							);
						})}
						{hasOther ? (
							<Bar
								dataKey="Other"
								stackId="total"
								fill={chartColors.otherFill}
								fillOpacity={0.78}
								name="Other"
								radius={[6, 6, 0, 0]}
								maxBarSize={48}
								isAnimationActive={false}
							/>
						) : null}
						<Line
							type="monotone"
							dataKey="__total"
							name="Total"
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
							legendType="none"
							isAnimationActive={false}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		)}
		</div>
	);
}
