import {
	addDays,
	addMonths,
	differenceInCalendarDays,
	endOfMonth,
	endOfQuarter,
	endOfWeek,
	endOfYear,
	format,
	getISOWeek,
	isSameMonth,
	parseISO,
	startOfMonth,
	startOfQuarter,
	startOfWeek,
	startOfYear,
	subWeeks,
} from "date-fns";

export const accountTypes = [
	"checking",
	"savings",
	"credit",
	"investment",
	"loan",
	"cash",
] as const;

export type AccountType = (typeof accountTypes)[number];

export type AccountClassification = "asset" | "liability";

export const categoryKinds = ["income", "expense", "transfer"] as const;

export type CategoryKind = (typeof categoryKinds)[number];

export type DashboardRange =
	| "1m"
	| "3m"
	| "6m"
	| "ytd"
	| "1y"
	| "3y"
	| "5y"
	| "10y"
	| "all";

export const dashboardPeriods = [
	"weekly",
	"bi-weekly",
	"monthly",
	"quarterly",
	"yearly",
] as const;

export type DashboardPeriod = (typeof dashboardPeriods)[number];

export const transactionRecurringRules = [
	"auto",
	"recurring",
	"not-recurring",
] as const;

export type TransactionRecurringRule =
	(typeof transactionRecurringRules)[number];

export interface AccountSummary {
	id: string;
	name: string;
	type: AccountType;
	classification: AccountClassification;
	institutionName: string | null;
	currency: string;
	last4: string | null;
	includeInNetWorth: boolean;
	archived: boolean;
	currentBalanceCents: number;
	lastSnapshotOn: string | null;
}

export interface CategoryRecord {
	id: string;
	name: string;
	kind: CategoryKind;
	/** Lucide icon component name, e.g. "ShoppingBag" */
	icon: string;
	hidden: boolean;
}

export interface CreateCategoryInput {
	name: string;
	kind: CategoryKind;
	icon?: string;
	hidden?: boolean;
}

export interface UpdateCategoryInput {
	id: string;
	name?: string;
	kind?: CategoryKind;
	icon?: string;
	hidden?: boolean;
}

export interface DeleteCategoryInput {
	id: string;
}

export interface TransactionRecord {
	id: string;
	accountId: string;
	accountName: string;
	postedOn: string;
	description: string;
	merchant: string;
	memo: string | null;
	amountCents: number;
	categoryId: string | null;
	categoryName: string | null;
	categoryIcon: string | null;
	categoryKind: CategoryKind | null;
	importId: string | null;
	importSourceName: string | null;
	isRecurring: boolean;
	recurringRule: TransactionRecurringRule;
}

export const transactionPageSizeOptions = [
	10, 25, 50, 100, 200, 500, 1000,
] as const;

export type TransactionPageSize = (typeof transactionPageSizeOptions)[number];

export interface TransactionFilters {
	search?: string;
	categoryId?: string;
	accountId?: string;
	from?: string;
	to?: string;
	/** Server clamps to {@link transactionPageSizeOptions}. */
	limit?: number;
	offset?: number;
}

export interface TransactionListPage {
	items: TransactionRecord[];
	totalCount: number;
}

export interface UpdateTransactionInput {
	id: string;
	accountId?: string;
	postedOn?: string;
	description?: string;
	merchant?: string;
	memo?: string | null;
	categoryId?: string | null;
	amountCents?: number;
	recurringRule?: TransactionRecurringRule;
}

export interface AddAccountInput {
	name: string;
	type: AccountType;
	institutionName?: string | null;
	last4?: string | null;
	currency?: string;
	openingBalanceCents?: number;
}

export interface UpdateAccountBalanceInput {
	accountId: string;
	balanceCents: number;
	snapshotOn?: string;
}

export interface DeleteAccountInput {
	accountId: string;
}

export interface ImportTransactionRowInput {
	date?: unknown;
	postedOn?: unknown;
	description?: unknown;
	merchant?: unknown;
	memo?: unknown;
	amount?: unknown;
	debit?: unknown;
	credit?: unknown;
	category?: unknown;
	balance?: unknown;
	accountName?: unknown;
	_custom_fields?: Record<string, unknown>;
	_unmatched?: Record<string, unknown>;
}

export interface ImportTransactionsInput {
	accountId: string;
	sourceName: string;
	rows: ImportTransactionRowInput[];
}

export interface ImportTransactionsResult {
	importId: string;
	importedCount: number;
	duplicateCount: number;
	skippedCount: number;
	createdSnapshotCount: number;
}

export interface TransactionImportRecord {
	id: string;
	accountId: string;
	accountName: string;
	sourceName: string;
	rowCount: number;
	importedCount: number;
	duplicateCount: number;
	skippedCount: number;
	createdSnapshotCount: number;
	createdAt: number;
	canUndo: boolean;
}

export interface UndoTransactionImportInput {
	importId: string;
}

export interface UndoTransactionImportResult {
	importId: string;
	deletedTransactionCount: number;
	deletedSnapshotCount: number;
}

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AppSettings {
	sampleDataEnabled: boolean;
	sampleDataLoaded: boolean;
	hasSeenOnboarding: boolean;
	/** 0 = Sunday, 1 = Monday, ... 6 = Saturday. Defaults to 1. */
	weekStartDay: WeekStartDay;
	/**
	 * yyyy-MM-dd. The user's most recent paycheck date. When set, the
	 * "Paycheck" dashboard period (`bi-weekly`) renders 14-day windows phased
	 * to this date so each period represents spending between paychecks.
	 */
	biWeekAnchorDate: string | null;
	/** Default number of rows shown per page on the transactions screen. */
	transactionPageSize: TransactionPageSize;
	/** Whether the Income category trend chart is visible on the dashboard. Defaults to false. */
	showIncomeChart: boolean;
	/**
	 * Category names to exclude from the expense category trend chart.
	 * Defaults to ["Housing"] to keep large fixed costs from dominating the view.
	 */
	expenseChartExcludedCategories: string[];
}

export interface UpdateAppSettingsInput {
	sampleDataEnabled?: boolean;
	hasSeenOnboarding?: boolean;
	weekStartDay?: WeekStartDay;
	biWeekAnchorDate?: string | null;
	transactionPageSize?: TransactionPageSize;
	showIncomeChart?: boolean;
	expenseChartExcludedCategories?: string[];
}

export interface PeriodConfig {
	weekStartDay?: WeekStartDay;
	biWeekAnchor?: Date | null;
}

export interface MonthlyCategoryTotal {
	categoryId: string | null;
	categoryName: string;
	icon: string;
	amountCents: number;
}

export interface MonthlyTrendPoint {
	month: string;
	label: string;
	incomeCents: number;
	expenseCents: number;
	netCents: number;
}

export interface NetWorthPoint {
	date: string;
	label: string;
	assetsCents: number;
	liabilitiesCents: number;
	netWorthCents: number;
}

export interface DailyCategoryBreakdownEntry {
	categoryId: string | null;
	categoryName: string;
	/** Lucide icon id from category-icons. */
	icon: string;
	amountCents: number;
}

export interface DailyCashFlowPoint {
	/** yyyy-MM-dd */
	date: string;
	dayOfMonth: number;
	expenseCents: number;
	incomeCents: number;
	/**
	 * Per-category expense totals for this day, sorted descending by amount.
	 * Empty when the day has no expenses (income-only or no activity).
	 */
	expenseCategoryBreakdown: DailyCategoryBreakdownEntry[];
}

/** One point on the period-over-period spend-vs-prior chart. */
export interface SpendVsPriorPoint {
	/** Zero-based index inside the period (day for W/P/M, month for Q/Y). */
	index: number;
	/** Display label for the tick (e.g. day-of-month, month abbreviation). */
	label: string;
	/** Cumulative expense in cents up to and including this index. */
	currentCumulativeCents: number | null;
	/** Cumulative expense in cents at the same index of the prior period. */
	priorCumulativeCents: number | null;
}

export interface SpendVsPriorSeries {
	currentLabel: string;
	priorLabel: string;
	/** "day" | "month" — informs the axis tick formatter on the client. */
	granularity: "day" | "month";
	points: SpendVsPriorPoint[];
}

export interface CategoryBucketPoint {
	/** Period key (matches {@link PeriodBounds.key}) — e.g. "2024-04", "2024-Q1". */
	key: string;
	/** Display label — e.g. "Apr", "Q1", "Apr 14". */
	label: string;
	/** Per-category cents for this bucket, keyed by categoryName. */
	categories: Record<string, number>;
	/** Total for this bucket. */
	totalCents: number;
}

/**
 * Category breakdown across the last N periods ending at the dashboard anchor.
 * N and period length track {@link DashboardPeriod} via {@link trendPeriodCount}.
 */
export interface CategoryTrendSeries {
	/** The period granularity these buckets represent. */
	period: DashboardPeriod;
	/** One bucket per period, oldest first. */
	buckets: CategoryBucketPoint[];
	/** Totals across all buckets by category, sorted desc by amount. */
	categoryTotals: MonthlyCategoryTotal[];
}

export interface RecurringCalendarTransaction {
	id: string;
	merchant: string;
	categoryIcon: string | null;
	amountCents: number;
	isIncome: boolean;
}

export interface RecurringCalendarDay {
	/** yyyy-MM-dd */
	date: string;
	dayOfMonth: number;
	transactions: RecurringCalendarTransaction[];
}

export interface RecurringCalendar {
	/** The month this calendar represents. */
	year: number;
	/** 1-12 */
	month: number;
	/** Month label e.g. "April 2026". */
	label: string;
	/** 0-6, mirrors JS getDay(): 0 = Sunday. */
	firstDayOfWeek: number;
	/** Total days in month. */
	daysInMonth: number;
	/** Day-indexed array of length daysInMonth (1-indexed into the month). */
	days: RecurringCalendarDay[];
}

export interface RecurringSubscription {
	/** Stable id — merchant name lowercased. */
	id: string;
	merchant: string;
	categoryIcon: string | null;
	categoryName: string | null;
	/** Average monthly cost in cents, always positive for expenses. */
	monthlyCents: number;
	/** Estimated yearly cost = monthlyCents * 12. */
	yearlyCents: number;
	/** How many recent months of data this estimate is based on. */
	observedMonths: number;
}

export interface DashboardData {
	period: DashboardPeriod;
	periodKey: string;
	periodLabel: string;
	spentInMonthCents: number;
	totalIncomeCents: number;
	totalExpenseCents: number;
	totalTransferCents: number;
	netCashFlowCents: number;
	averageTransactionCents: number;
	expenseVsThreeMonthAverageCents: number;
	incomeVsThreeMonthAverageCents: number;
	monthlyCategoryTotals: MonthlyCategoryTotal[];
	monthlyTrend: MonthlyTrendPoint[];
	netWorthTrend: NetWorthPoint[];
	dailyCashFlow: DailyCashFlowPoint[];
	assetsCents: number;
	liabilitiesCents: number;
	netWorthCents: number;
	recentTransactions: TransactionRecord[];
	/** Cumulative spend for the selected period vs the prior period. */
	spendVsPrior: SpendVsPriorSeries;
	/** Expense breakdown by category across the last N periods, reactive to the period toggle. */
	expenseCategoryTrend: CategoryTrendSeries;
	/** Income breakdown by category across the last N periods, reactive to the period toggle. */
	incomeCategoryTrend: CategoryTrendSeries;
	/** Recurring transactions for the current calendar month. */
	recurringCalendar: RecurringCalendar;
	/** Recurring subscriptions summary with monthly + estimated yearly cost. */
	recurringSubscriptions: RecurringSubscription[];
}

export interface PeriodBounds {
	start: Date;
	end: Date;
	label: string;
	key: string;
}

export const periodShortLabels: Record<DashboardPeriod, string> = {
	weekly: "W",
	"bi-weekly": "P",
	monthly: "M",
	quarterly: "Q",
	yearly: "Y",
};

export const periodLongLabels: Record<DashboardPeriod, string> = {
	weekly: "Weekly",
	"bi-weekly": "Paycheck",
	monthly: "Monthly",
	quarterly: "Quarterly",
	yearly: "Yearly",
};

/**
 * Returns the lowercase noun for the given period, pluralized when count != 1.
 * Example: `periodPluralLabel("weekly", 6)` → `"weeks"`.
 */
export function periodPluralLabel(
	period: DashboardPeriod,
	count: number,
): string {
	const suffix = count === 1 ? "" : "s";
	switch (period) {
		case "weekly":
			return `week${suffix}`;
		case "bi-weekly":
			return `paycheck${suffix}`;
		case "monthly":
			return `month${suffix}`;
		case "quarterly":
			return `quarter${suffix}`;
		case "yearly":
			return `year${suffix}`;
	}
}

export function computePeriodBounds(
	period: DashboardPeriod,
	anchor: Date,
	config: PeriodConfig = {},
): PeriodBounds {
	const weekStartsOn = (config.weekStartDay ?? 1) as WeekStartDay;
	switch (period) {
		case "weekly": {
			const start = startOfWeek(anchor, { weekStartsOn });
			const end = endOfWeek(anchor, { weekStartsOn });
			const label = isSameMonth(start, end)
				? `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
				: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
			return { start, end, label, key: format(start, "yyyy-MM-dd") };
		}
		case "bi-weekly": {
			let biWeekStart: Date;
			if (config.biWeekAnchor instanceof Date) {
				const daysDiff = differenceInCalendarDays(anchor, config.biWeekAnchor);
				const stepIndex = Math.floor(daysDiff / 14);
				biWeekStart = addDays(config.biWeekAnchor, stepIndex * 14);
			} else {
				const weekStart = startOfWeek(anchor, { weekStartsOn });
				const isoWeek = getISOWeek(anchor);
				biWeekStart = isoWeek % 2 === 1 ? weekStart : subWeeks(weekStart, 1);
			}
			const biWeekEnd = addDays(biWeekStart, 13);
			const label = isSameMonth(biWeekStart, biWeekEnd)
				? `${format(biWeekStart, "MMM d")} – ${format(biWeekEnd, "d, yyyy")}`
				: `${format(biWeekStart, "MMM d")} – ${format(biWeekEnd, "MMM d, yyyy")}`;
			return {
				start: biWeekStart,
				end: biWeekEnd,
				label,
				key: format(biWeekStart, "yyyy-MM-dd"),
			};
		}
		case "monthly": {
			const start = startOfMonth(anchor);
			const end = endOfMonth(anchor);
			return {
				start,
				end,
				label: format(start, "MMMM yyyy"),
				key: format(start, "yyyy-MM"),
			};
		}
		case "quarterly": {
			const start = startOfQuarter(anchor);
			const end = endOfQuarter(anchor);
			const q = Math.ceil((start.getMonth() + 1) / 3);
			return {
				start,
				end,
				label: `Q${q} ${format(start, "yyyy")}`,
				key: `${format(start, "yyyy")}-Q${q}`,
			};
		}
		case "yearly": {
			const start = startOfYear(anchor);
			const end = endOfYear(anchor);
			return {
				start,
				end,
				label: format(start, "yyyy"),
				key: format(start, "yyyy"),
			};
		}
	}
}

export function periodConfigFromSettings(
	settings:
		| Pick<AppSettings, "weekStartDay" | "biWeekAnchorDate">
		| null
		| undefined,
): PeriodConfig {
	if (!settings) return {};
	const biWeekAnchor =
		settings.biWeekAnchorDate &&
		/^\d{4}-\d{2}-\d{2}$/.test(settings.biWeekAnchorDate)
			? parseISO(settings.biWeekAnchorDate)
			: null;
	return {
		weekStartDay: settings.weekStartDay,
		biWeekAnchor,
	};
}

export function stepPeriod(
	period: DashboardPeriod,
	anchor: Date,
	steps: number,
): Date {
	switch (period) {
		case "weekly":
			return addDays(anchor, steps * 7);
		case "bi-weekly":
			return addDays(anchor, steps * 14);
		case "monthly":
			return addMonths(anchor, steps);
		case "quarterly":
			return addMonths(anchor, steps * 3);
		case "yearly":
			return addMonths(anchor, steps * 12);
	}
}

export function trendPeriodCount(period: DashboardPeriod): number {
	switch (period) {
		case "weekly":
			return 8;
		case "bi-weekly":
			return 6;
		case "monthly":
			return 6;
		case "quarterly":
			return 6;
		case "yearly":
			return 5;
	}
}

export function trendPointLabel(
	period: DashboardPeriod,
	bounds: PeriodBounds,
): string {
	switch (period) {
		case "weekly":
			return format(bounds.start, "MMM d");
		case "bi-weekly":
			return format(bounds.start, "MMM d");
		case "monthly":
			return format(bounds.start, "MMM");
		case "quarterly": {
			const q = Math.ceil((bounds.start.getMonth() + 1) / 3);
			return `Q${q}`;
		}
		case "yearly":
			return format(bounds.start, "yyyy");
	}
}
