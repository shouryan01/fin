import { useId, useMemo } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useTheme } from "#/components/theme-provider";
import { chartFillForExpenseBreakdown, getChartTheme } from "#/lib/chart-fill";
import { formatCompactCurrency, formatCurrency } from "#/lib/format";
import type { SpendVsPriorSeries } from "../../shared/finance";

type SpendVsPriorChartProps = {
	series: SpendVsPriorSeries;
	accent?: string;
};

const DEFAULT_ACCENT = chartFillForExpenseBreakdown(0);
const PRIOR_STROKE = "#94a3b8";

export function SpendVsPriorChart({
	series,
	accent = DEFAULT_ACCENT,
}: SpendVsPriorChartProps) {
	const { theme } = useTheme();
	const gradientId = useId().replace(/:/g, "");

	const chartColors = useMemo(() => getChartTheme(theme === "dark"), [theme]);

	const hasData = series.points.some(
		(p) =>
			(p.currentCumulativeCents ?? 0) > 0 || (p.priorCumulativeCents ?? 0) > 0,
	);

	if (!hasData) {
		return (
			<div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
				No spending data to compare.
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart
				data={series.points}
				margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
			>
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={accent} stopOpacity={0.28} />
						<stop offset="60%" stopColor={accent} stopOpacity={0.08} />
						<stop offset="100%" stopColor={accent} stopOpacity={0} />
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
					interval="preserveStartEnd"
					minTickGap={16}
				/>
				<YAxis
					axisLine={{ stroke: chartColors.grid }}
					tickFormatter={(value) => formatCompactCurrency(Number(value))}
					tick={{ fill: chartColors.axis, fontSize: 12 }}
					tickLine={{ stroke: chartColors.grid }}
					width={52}
				/>
				<Tooltip
					wrapperStyle={{ outline: "none", opacity: 1 }}
					content={({ active, payload, label }) => {
						if (!active || !payload?.length) return null;
						return (
							<div className="pointer-events-none min-w-[180px] rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-xl">
								<div className="mb-2 font-semibold text-foreground">{label}</div>
								<div className="space-y-1.5">
									{payload.map((entry) => (
										<div
											key={String(entry.dataKey)}
											className="flex items-center justify-between gap-6"
										>
											<span className="inline-flex items-center gap-2 text-muted-foreground">
												<span
													className="h-2 w-2 shrink-0 rounded-full"
													style={{ backgroundColor: String(entry.color ?? "") }}
												/>
												{String(entry.name)}
											</span>
											<span className="tabular-nums font-medium text-foreground">
												{entry.value === null || entry.value === undefined
													? "—"
													: formatCurrency(Number(entry.value))}
											</span>
										</div>
									))}
								</div>
							</div>
						);
					}}
				/>
				<Legend
					wrapperStyle={{ color: chartColors.axis, fontSize: 12 }}
					iconType="plainline"
				/>
				<Area
					type="monotone"
					dataKey="priorCumulativeCents"
					name={series.priorLabel}
					stroke={PRIOR_STROKE}
					strokeWidth={1.75}
					strokeDasharray="4 4"
					fill="transparent"
					dot={false}
					activeDot={{ r: 3.5, fill: PRIOR_STROKE }}
					connectNulls
					isAnimationActive={false}
				/>
				<Area
					type="monotone"
					dataKey="currentCumulativeCents"
					name={series.currentLabel}
					stroke={accent}
					strokeWidth={2.5}
					fill={`url(#${gradientId})`}
					fillOpacity={1}
					dot={false}
					activeDot={{ r: 4, fill: accent }}
					connectNulls={false}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
