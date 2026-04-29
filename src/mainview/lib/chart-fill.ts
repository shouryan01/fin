/** Primary chart green — matches net worth area stroke/fill (Tailwind green-500). */
export const CHART_BRAND_GREEN = "#22c55e";

/** Theme-sensitive color values for all chart components. */
export function getChartTheme(isDark: boolean) {
	return {
		grid: isDark ? "#1e293b" : "#e2e8f0",
		axis: isDark ? "#94a3b8" : "#64748b",
		zeroline: isDark ? "#64748b" : "#94a3b8",
		tooltipBg: isDark ? "#020817" : "#ffffff",
		tooltipBorder: isDark ? "#1e293b" : "#e2e8f0",
		tooltipText: isDark ? "#f8fafc" : "#0f172a",
		trendStroke: isDark ? "#cbd5e1" : "#475569",
		trendDot: isDark ? "#f1f5f9" : "#0f172a",
		incomeIdle: isDark ? "#064e3b" : "#d1fae5",
		incomeActive: isDark ? "#34d399" : "#10b981",
		expenseIdle: isDark ? "#881337" : "#ffe4e6",
		expenseActive: isDark ? "#fb7185" : "#f43f5e",
		otherFill: isDark ? "#475569" : "#cbd5e1",
	};
}

/** Semantic colors for net worth composition bar/chart. */
export const NET_WORTH_COLORS = {
	cash: "#4ade80",
	investments: "#0d9488",
	other: "#94a3b8",
	liabilities: "#f43f5e",
} as const;

/** Stable HSL fill for charts from category icon id (no DB color). */
export function chartFillFromCategoryIcon(iconId: string): string {
	let h = 2166136261;
	for (let i = 0; i < iconId.length; i += 1) {
		h = Math.imul(h ^ iconId.charCodeAt(i), 16777619);
	}
	const hue = Math.abs(h) % 360;
	return `hsl(${hue} 84% 52%)`;
}

/**
 * Cohesive, modern palette for the category breakdown — tuned for a
 * translucent/glass look when rendered with fill-opacity on bars. Order is
 * stable by category rank so the same category keeps the same color.
 */
const EXPENSE_BREAKDOWN_FILLS = [
	"#3b82f6", // blue-500
	"#8b5cf6", // violet-500
	"#14b8a6", // teal-500
	"#f59e0b", // amber-500
	"#ec4899", // pink-500
	"#10b981", // emerald-500
	"#06b6d4", // cyan-500
	"#f97316", // orange-500
	"#a855f7", // purple-500
	"#ef4444", // red-500
] as const;

export function chartFillForExpenseBreakdown(index: number): string {
	return EXPENSE_BREAKDOWN_FILLS[index % EXPENSE_BREAKDOWN_FILLS.length];
}
