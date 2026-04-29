import { Database } from "bun:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import {
	addDays,
	differenceInCalendarDays,
	eachDayOfInterval,
	endOfMonth,
	format,
	getDaysInMonth,
	parseISO,
	startOfMonth,
	subMonths,
} from "date-fns";
import { and, count, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Utils } from "electrobun/bun";
import {
	accountBalanceSnapshots,
	accounts,
	categories,
	transactionImportMappings,
	transactionImports,
	transactionRules,
	transactions,
} from "../mainview/db/schema";
import {
	isValidCategoryIconId,
	suggestCategoryIconId,
} from "../shared/category-icons";
import {
	type AccountClassification,
	type AccountSummary,
	type AccountType,
	type AddAccountInput,
	type AppSettings,
	type CategoryBucketPoint,
	type CategoryKind,
	type CategoryRecord,
	type CategoryTrendSeries,
	type CreateCategoryInput,
	categoryKinds,
	computePeriodBounds,
	type DailyCashFlowPoint,
	type DashboardData,
	type DashboardPeriod,
	type DeleteCategoryInput,
	dashboardPeriods,
	type ImportTransactionRowInput,
	type ImportTransactionsInput,
	type ImportTransactionsResult,
	type MonthlyCategoryTotal,
	type MonthlyTrendPoint,
	type NetWorthPoint,
	type PeriodBounds,
	type PeriodConfig,
	periodConfigFromSettings,
	type RecurringCalendar,
	type RecurringCalendarDay,
	type RecurringCalendarTransaction,
	type RecurringSubscription,
	type SpendVsPriorPoint,
	type SpendVsPriorSeries,
	stepPeriod,
	type TransactionFilters,
	type TransactionImportRecord,
	type TransactionListPage,
	type TransactionPageSize,
	type TransactionRecord,
	type TransactionRecurringRule,
	transactionPageSizeOptions,
	transactionRecurringRules,
	trendPeriodCount,
	trendPointLabel,
	type UndoTransactionImportInput,
	type UndoTransactionImportResult,
	type UpdateAccountBalanceInput,
	type UpdateAppSettingsInput,
	type UpdateCategoryInput,
	type UpdateTransactionInput,
	type WeekStartDay,
} from "../shared/finance";

const databaseDirectory = Utils.paths.userData;
export const databasePath = `${databaseDirectory}/finance.sqlite`;

mkdirSync(databaseDirectory, { recursive: true });

const sqlite = new Database(databasePath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite);

const assetAccountTypes = new Set<AccountType>([
	"checking",
	"savings",
	"investment",
	"cash",
]);

const defaultCategories = [
	{ id: "income-salary", name: "Salary", kind: "income", icon: "Banknote" },
	{ id: "income-interest", name: "Interest", kind: "income", icon: "Percent" },
	{ id: "expense-housing", name: "Housing", kind: "expense", icon: "Home" },
	{
		id: "expense-groceries",
		name: "Groceries",
		kind: "expense",
		icon: "ShoppingBasket",
	},
	{
		id: "expense-dining",
		name: "Dining",
		kind: "expense",
		icon: "UtensilsCrossed",
	},
	{
		id: "expense-utilities",
		name: "Utilities",
		kind: "expense",
		icon: "Zap",
	},
	{
		id: "expense-shopping",
		name: "Shopping",
		kind: "expense",
		icon: "ShoppingBag",
	},
	{
		id: "expense-transport",
		name: "Transport",
		kind: "expense",
		icon: "Car",
	},
	{
		id: "expense-entertainment",
		name: "Entertainment",
		kind: "expense",
		icon: "Tv",
	},
	{
		id: "transfer-internal",
		name: "Transfer",
		kind: "transfer",
		icon: "ArrowLeftRight",
	},
] as const satisfies Array<{
	id: string;
	name: string;
	kind: CategoryKind;
	icon: string;
}>;

const defaultRules = [
	{ merchantPattern: "netflix", categoryId: "expense-entertainment" },
	{ merchantPattern: "whole foods", categoryId: "expense-groceries" },
	{ merchantPattern: "uber", categoryId: "expense-transport" },
	{ merchantPattern: "rent", categoryId: "expense-housing" },
	{ merchantPattern: "payroll", categoryId: "income-salary" },
];

const sampleDataSettingKey = "sample_data_enabled";
const hasSeenOnboardingSettingKey = "has_seen_onboarding";
const weekStartDaySettingKey = "week_start_day";
const biWeekAnchorDateSettingKey = "bi_week_anchor_date";
const transactionPageSizeSettingKey = "transaction_page_size";
const showIncomeChartSettingKey = "show_income_chart";
const expenseChartExcludedCategoriesSettingKey =
	"expense_chart_excluded_categories";
const sampleAccountIds = [
	"acct-checking",
	"acct-savings",
	"acct-brokerage",
	"acct-credit",
] as const;

function nowTimestamp() {
	return Math.floor(Date.now() / 1000);
}

function normalizeWhitespace(value: string) {
	return value.replace(/\s+/g, " ").trim();
}

function normalizeMerchantKey(value: string) {
	return normalizeWhitespace(value).toLowerCase();
}

const transactionPageLimits = new Set([10, 25, 50, 100, 200, 500, 1000]);

function normalizeTransactionPageLimit(value: number | undefined): number {
	if (value !== undefined && transactionPageLimits.has(value)) {
		return value;
	}
	return 100;
}

function normalizeTransactionOffset(value: number | undefined): number {
	if (value === undefined) {
		return 0;
	}
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}
	return Math.floor(value);
}

type TransactionListFilters = Omit<TransactionFilters, "limit" | "offset">;

function pushTransactionFilterConditions(
	filters: TransactionListFilters,
	conditions: SQL[],
	options: { searchHaystack?: SQL },
) {
	if (filters.accountId) {
		conditions.push(eq(transactions.accountId, filters.accountId));
	}
	if (filters.categoryId) {
		conditions.push(eq(transactions.categoryId, filters.categoryId));
	}
	if (filters.from) {
		conditions.push(sql`${transactions.postedOn} >= ${filters.from}`);
	}
	if (filters.to) {
		conditions.push(sql`${transactions.postedOn} <= ${filters.to}`);
	}
	if (filters.search?.trim() && options.searchHaystack) {
		const term = normalizeMerchantKey(filters.search);
		conditions.push(sql`instr(${options.searchHaystack}, ${term}) > 0`);
	}
}

function loadAllTransactionRecordsUnfiltered(): TransactionRecord[] {
	const rows = db.select().from(transactions).all();
	const serialized = serializeTransactionRows(rows).sort((left, right) => {
		const dateComparison = right.postedOn.localeCompare(left.postedOn);
		if (dateComparison !== 0) {
			return dateComparison;
		}
		return right.amountCents - left.amountCents;
	});
	return serialized;
}

function findTransactionRecordById(id: string): TransactionRecord | undefined {
	const row = db
		.select()
		.from(transactions)
		.where(eq(transactions.id, id))
		.get();
	if (!row) {
		return undefined;
	}
	return serializeTransactionRows([row])[0];
}

function recurringRuleFromOverride(
	value: boolean | null | undefined,
): TransactionRecurringRule {
	if (value === true) {
		return "recurring";
	}
	if (value === false) {
		return "not-recurring";
	}
	return "auto";
}

function recurringOverrideFromRule(rule: TransactionRecurringRule | undefined) {
	if (rule === undefined) {
		return undefined;
	}
	if (rule === "auto") {
		return null;
	}
	return rule === "recurring";
}

function resolveRecurringFlag(
	rule: TransactionRecurringRule,
	autoDetected: boolean,
) {
	if (rule === "auto") {
		return autoDetected;
	}
	return rule === "recurring";
}

function centsFromNumber(amount: number) {
	return Math.round(amount * 100);
}

function parseAmountCandidate(value: unknown): number | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null;
	}

	const raw = String(value).trim();
	if (!raw) {
		return null;
	}

	const negative = raw.includes("(") || raw.startsWith("-");
	const cleaned = raw.replace(/[$,()\s]/g, "").replace(/^\+/, "");
	const numeric = Number(cleaned);
	if (Number.isNaN(numeric)) {
		return null;
	}

	return negative ? -Math.abs(numeric) : numeric;
}

function parseAmountCents(row: ImportTransactionRowInput) {
	const amount = parseAmountCandidate(row.amount);
	if (amount !== null) {
		return centsFromNumber(amount);
	}

	const debit = parseAmountCandidate(row.debit);
	const credit = parseAmountCandidate(row.credit);

	if (debit !== null || credit !== null) {
		return centsFromNumber((credit ?? 0) - Math.abs(debit ?? 0));
	}

	return null;
}

function parseDateInput(value: unknown) {
	if (value instanceof Date && !Number.isNaN(value.valueOf())) {
		return format(value, "yyyy-MM-dd");
	}

	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	const isoLike = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (isoLike) {
		const normalized = `${isoLike[1]}-${isoLike[2].padStart(2, "0")}-${isoLike[3].padStart(2, "0")}`;
		return normalized;
	}

	const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
	if (slash) {
		const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
		return `${year}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
	}

	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.valueOf())) {
		return null;
	}

	return format(parsed, "yyyy-MM-dd");
}

function accountClassification(type: AccountType): AccountClassification {
	return assetAccountTypes.has(type) ? "asset" : "liability";
}

function currencyOrDefault(currency?: string | null) {
	return currency?.trim() || "USD";
}

function resolveCategoryIconForCreate(
	name: string,
	inputIcon: string | undefined,
): string {
	if (inputIcon !== undefined && inputIcon.trim() !== "") {
		if (!isValidCategoryIconId(inputIcon.trim())) {
			throw new Error(`Invalid category icon "${inputIcon.trim()}"`);
		}
		return inputIcon.trim();
	}
	return suggestCategoryIconId(name);
}

function resolveCategoryIconForUpdate(
	inputIcon: string | undefined,
	currentIcon: string,
): string {
	if (inputIcon === undefined) {
		return currentIcon;
	}
	if (inputIcon.trim() === "") {
		throw new Error("Category icon cannot be empty");
	}
	if (!isValidCategoryIconId(inputIcon.trim())) {
		throw new Error(`Invalid category icon "${inputIcon.trim()}"`);
	}
	return inputIcon.trim();
}

function ensureTables() {
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS accounts (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			type TEXT NOT NULL,
			institution_name TEXT,
			currency TEXT NOT NULL DEFAULT 'USD',
			last4 TEXT,
			include_in_net_worth INTEGER NOT NULL DEFAULT 1,
			archived INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
		CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			kind TEXT NOT NULL,
			icon TEXT NOT NULL,
			hidden INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
		CREATE TABLE IF NOT EXISTS transaction_imports (
			id TEXT PRIMARY KEY NOT NULL,
			account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			source_name TEXT NOT NULL,
			row_count INTEGER NOT NULL DEFAULT 0,
			imported_count INTEGER NOT NULL DEFAULT 0,
			duplicate_count INTEGER NOT NULL DEFAULT 0,
			skipped_count INTEGER NOT NULL DEFAULT 0,
			created_snapshot_count INTEGER NOT NULL DEFAULT 0,
			undo_version INTEGER NOT NULL DEFAULT 0,
			mapping_json TEXT,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
		CREATE TABLE IF NOT EXISTS transaction_import_mappings (
			id TEXT PRIMARY KEY NOT NULL,
			account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			source_name TEXT NOT NULL,
			mapping_json TEXT NOT NULL,
			updated_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
		CREATE TABLE IF NOT EXISTS transaction_rules (
			id TEXT PRIMARY KEY NOT NULL,
			merchant_pattern TEXT NOT NULL,
			category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
			priority INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
		CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY NOT NULL,
			account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			import_id TEXT REFERENCES transaction_imports(id) ON DELETE SET NULL,
			posted_on TEXT NOT NULL,
			description TEXT NOT NULL,
			merchant TEXT NOT NULL,
			memo TEXT,
			amount_cents INTEGER NOT NULL,
			currency TEXT NOT NULL DEFAULT 'USD',
			category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
			external_hash TEXT NOT NULL,
			raw_json TEXT,
			recurring_override INTEGER,
			is_recurring INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			updated_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
		CREATE UNIQUE INDEX IF NOT EXISTS transactions_external_hash_idx
			ON transactions(external_hash);
		CREATE TABLE IF NOT EXISTS account_balance_snapshots (
			id TEXT PRIMARY KEY NOT NULL,
			account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			snapshot_on TEXT NOT NULL,
			balance_cents INTEGER NOT NULL,
			source TEXT NOT NULL DEFAULT 'manual',
			created_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
		CREATE UNIQUE INDEX IF NOT EXISTS account_snapshot_unique_idx
			ON account_balance_snapshots(account_id, snapshot_on);
		CREATE TABLE IF NOT EXISTS app_settings (
			key TEXT PRIMARY KEY NOT NULL,
			value TEXT NOT NULL,
			updated_at INTEGER NOT NULL DEFAULT (unixepoch())
		);
	`);
}

function tableColumnNames(tableName: string) {
	const rows = sqlite.query(`PRAGMA table_info(${tableName})`).all() as Array<{
		name: string;
	}>;
	return new Set(rows.map((row) => row.name));
}

function ensureCategoryIconMigration() {
	const cols = tableColumnNames("categories");
	if (cols.has("icon") && !cols.has("color")) {
		return;
	}

	if (cols.has("color") && !cols.has("icon")) {
		sqlite.exec(`
			ALTER TABLE categories
			ADD COLUMN icon TEXT NOT NULL DEFAULT 'Tag'
		`);
		const rows = db.select().from(categories).all();
		for (const row of rows) {
			const icon = suggestCategoryIconId(row.name);
			db.update(categories)
				.set({ icon })
				.where(eq(categories.id, row.id))
				.run();
		}
		/* `icon` column now exists; drizzle can read this table */
		try {
			sqlite.exec("ALTER TABLE categories DROP COLUMN color");
		} catch {
			/* SQLite < 3.35: legacy column left unused */
		}
		return;
	}

	if (cols.has("icon") && cols.has("color")) {
		try {
			sqlite.exec("ALTER TABLE categories DROP COLUMN color");
		} catch {
			/* ignore */
		}
	}
}

function ensureRuntimeCompatibility() {
	ensureCategoryIconMigration();

	const importColumns = tableColumnNames("transaction_imports");
	const transactionColumns = tableColumnNames("transactions");

	if (!importColumns.has("created_snapshot_count")) {
		sqlite.exec(`
			ALTER TABLE transaction_imports
			ADD COLUMN created_snapshot_count INTEGER NOT NULL DEFAULT 0
		`);
	}

	if (!importColumns.has("undo_version")) {
		sqlite.exec(`
			ALTER TABLE transaction_imports
			ADD COLUMN undo_version INTEGER NOT NULL DEFAULT 0
		`);
	}

	if (!transactionColumns.has("recurring_override")) {
		sqlite.exec(`
			ALTER TABLE transactions
			ADD COLUMN recurring_override INTEGER
		`);
	}
}

function getAppSetting(key: string) {
	const row = sqlite
		.query("SELECT value FROM app_settings WHERE key = ?1")
		.get(key) as { value: string } | null;
	return row?.value ?? null;
}

function setAppSetting(key: string, value: string) {
	sqlite
		.query(`
			INSERT INTO app_settings (key, value, updated_at)
			VALUES (?1, ?2, unixepoch())
			ON CONFLICT(key) DO UPDATE SET
				value = excluded.value,
				updated_at = excluded.updated_at
		`)
		.run(key, value);
}

function sampleDataEnabled() {
	const storedValue = getAppSetting(sampleDataSettingKey);
	return storedValue === null ? true : storedValue === "true";
}

function sampleDataLoaded() {
	return db
		.select()
		.from(accounts)
		.all()
		.some((account) =>
			sampleAccountIds.includes(
				account.id as (typeof sampleAccountIds)[number],
			),
		);
}

function hasSeenOnboarding() {
	return getAppSetting(hasSeenOnboardingSettingKey) === "true";
}

function weekStartDay(): WeekStartDay {
	const stored = getAppSetting(weekStartDaySettingKey);
	if (stored === null) return 1;
	const parsed = Number.parseInt(stored, 10);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 6) return 1;
	return parsed as WeekStartDay;
}

function biWeekAnchorDate(): string | null {
	const stored = getAppSetting(biWeekAnchorDateSettingKey);
	if (!stored) return null;
	return /^\d{4}-\d{2}-\d{2}$/.test(stored) ? stored : null;
}

function transactionPageSize(): TransactionPageSize {
	const stored = getAppSetting(transactionPageSizeSettingKey);
	if (stored === null) return 25;
	const parsed = Number.parseInt(stored, 10);
	if (transactionPageSizeOptions.includes(parsed as TransactionPageSize)) {
		return parsed as TransactionPageSize;
	}
	return 25;
}

function showIncomeChart() {
	return getAppSetting(showIncomeChartSettingKey) === "true";
}

function expenseChartExcludedCategories(): string[] {
	const stored = getAppSetting(expenseChartExcludedCategoriesSettingKey);
	if (stored === null) return ["Housing"];
	try {
		const parsed = JSON.parse(stored);
		if (Array.isArray(parsed)) {
			return parsed.filter((item) => typeof item === "string");
		}
	} catch {
		/* fall through to default */
	}
	return [];
}

function buildTransactionHash(input: {
	accountId: string;
	postedOn: string;
	amountCents: number;
	description: string;
	merchant: string;
}) {
	return createHash("sha1")
		.update(
			[
				input.accountId,
				input.postedOn,
				String(input.amountCents),
				normalizeMerchantKey(input.description),
				normalizeMerchantKey(input.merchant),
			].join("|"),
		)
		.digest("hex");
}

function matchCategoryId(
	name: string | null,
	categoryMap: Map<string, CategoryRecord>,
) {
	if (!name) {
		return null;
	}

	const key = normalizeMerchantKey(name);
	return categoryMap.get(key)?.id ?? null;
}

function inferCategoryId(
	merchant: string,
	rules: Array<{ merchantPattern: string; categoryId: string | null }>,
) {
	const merchantKey = normalizeMerchantKey(merchant);
	for (const rule of rules) {
		if (merchantKey.includes(rule.merchantPattern)) {
			return rule.categoryId;
		}
	}

	return null;
}

function normalizeRecurringFlags() {
	const rows = db.select().from(transactions).all();
	const grouped = new Map<string, typeof rows>();
	const autoRecurringIds = new Set<string>();

	for (const row of rows) {
		const key = `${normalizeMerchantKey(row.merchant)}|${Math.abs(row.amountCents)}`;
		const existing = grouped.get(key) ?? [];
		existing.push(row);
		grouped.set(key, existing);
	}

	for (const group of grouped.values()) {
		group.sort((left, right) => left.postedOn.localeCompare(right.postedOn));
		for (let index = 1; index < group.length; index += 1) {
			const previous = group[index - 1];
			const current = group[index];
			const gap = Math.abs(
				differenceInCalendarDays(
					parseISO(current.postedOn),
					parseISO(previous.postedOn),
				),
			);
			if (gap >= 25 && gap <= 35) {
				autoRecurringIds.add(previous.id);
				autoRecurringIds.add(current.id);
			}
		}
	}

	for (const row of rows) {
		const recurringRule = recurringRuleFromOverride(row.recurringOverride);
		db.update(transactions)
			.set({
				isRecurring: resolveRecurringFlag(
					recurringRule,
					autoRecurringIds.has(row.id),
				),
				updatedAt: nowTimestamp(),
			})
			.where(eq(transactions.id, row.id))
			.run();
	}
}

function ensureDefaultCategoriesAndRules() {
	const existingCategoryIds = new Set(
		db
			.select()
			.from(categories)
			.all()
			.map((category) => category.id),
	);
	const missingCategories = defaultCategories
		.filter((category) => !existingCategoryIds.has(category.id))
		.map((category) => ({
			...category,
			hidden: false,
			createdAt: nowTimestamp(),
		}));
	if (missingCategories.length > 0) {
		db.insert(categories).values(missingCategories).run();
	}

	const existingRuleIds = new Set(
		db
			.select()
			.from(transactionRules)
			.all()
			.map((rule) => rule.id),
	);
	const missingRules = defaultRules
		.map((rule, index) => ({
			id: `rule-${index + 1}`,
			merchantPattern: rule.merchantPattern,
			categoryId: rule.categoryId,
			priority: index,
			createdAt: nowTimestamp(),
		}))
		.filter((rule) => !existingRuleIds.has(rule.id));
	if (missingRules.length > 0) {
		db.insert(transactionRules).values(missingRules).run();
	}
}

function seedDatabase() {
	ensureDefaultCategoriesAndRules();
	if (sampleDataLoaded()) {
		return;
	}

	const seededAccounts = [
		{
			id: "acct-checking",
			name: "Everyday Checking",
			type: "checking",
			institutionName: "Local Credit Union",
			currency: "USD",
			last4: "1842",
			includeInNetWorth: true,
			archived: false,
			createdAt: nowTimestamp(),
		},
		{
			id: "acct-savings",
			name: "Emergency Savings",
			type: "savings",
			institutionName: "Local Credit Union",
			currency: "USD",
			last4: "0309",
			includeInNetWorth: true,
			archived: false,
			createdAt: nowTimestamp(),
		},
		{
			id: "acct-brokerage",
			name: "Brokerage",
			type: "investment",
			institutionName: "Vanguard",
			currency: "USD",
			last4: "9912",
			includeInNetWorth: true,
			archived: false,
			createdAt: nowTimestamp(),
		},
		{
			id: "acct-credit",
			name: "Travel Card",
			type: "credit",
			institutionName: "Chase",
			currency: "USD",
			last4: "5521",
			includeInNetWorth: true,
			archived: false,
			createdAt: nowTimestamp(),
		},
	];

	db.insert(accounts).values(seededAccounts).run();

	const transactionRows: Array<typeof transactions.$inferInsert> = [];
	const snapshotRows: Array<typeof accountBalanceSnapshots.$inferInsert> = [];
	const today = new Date();

	for (let offset = 5; offset >= 0; offset -= 1) {
		const monthDate = subMonths(today, offset);
		const monthStart = startOfMonth(monthDate);
		const monthEnd = endOfMonth(monthDate);
		const monthIndex = 5 - offset;
		const monthKey = format(monthDate, "yyyy-MM");

		const checkingBalance = 510000 + monthIndex * 18000;
		const savingsBalance = 980000 + monthIndex * 12000;
		const brokerageBalance = 1860000 + monthIndex * 55000;
		const creditBalance = -(62000 + (monthIndex % 3) * 8000);

		const snapshotDate =
			monthEnd > today
				? format(today, "yyyy-MM-dd")
				: format(monthEnd, "yyyy-MM-dd");

		snapshotRows.push(
			{
				id: `snapshot-checking-${monthKey}`,
				accountId: "acct-checking",
				snapshotOn: snapshotDate,
				balanceCents: checkingBalance,
				source: "seed",
				createdAt: nowTimestamp(),
			},
			{
				id: `snapshot-savings-${monthKey}`,
				accountId: "acct-savings",
				snapshotOn: snapshotDate,
				balanceCents: savingsBalance,
				source: "seed",
				createdAt: nowTimestamp(),
			},
			{
				id: `snapshot-brokerage-${monthKey}`,
				accountId: "acct-brokerage",
				snapshotOn: snapshotDate,
				balanceCents: brokerageBalance,
				source: "seed",
				createdAt: nowTimestamp(),
			},
			{
				id: `snapshot-credit-${monthKey}`,
				accountId: "acct-credit",
				snapshotOn: snapshotDate,
				balanceCents: creditBalance,
				source: "seed",
				createdAt: nowTimestamp(),
			},
		);

		const seededTransactions = [
			{
				accountId: "acct-checking",
				postedOn: `${format(monthStart, "yyyy-MM")}-01`,
				description: "Payroll Deposit",
				merchant: "Payroll",
				amountCents: 420000,
				categoryId: "income-salary",
			},
			{
				accountId: "acct-checking",
				postedOn: `${format(monthStart, "yyyy-MM")}-02`,
				description: "Apartment Rent",
				merchant: "Rent Payment",
				amountCents: -185000,
				categoryId: "expense-housing",
			},
			{
				accountId: "acct-checking",
				postedOn: `${format(monthStart, "yyyy-MM")}-05`,
				description: "Whole Foods Market",
				merchant: "Whole Foods",
				amountCents: -13240 - monthIndex * 90,
				categoryId: "expense-groceries",
			},
			{
				accountId: "acct-credit",
				postedOn: `${format(monthStart, "yyyy-MM")}-08`,
				description: "Netflix",
				merchant: "Netflix",
				amountCents: -1599,
				categoryId: "expense-entertainment",
			},
			{
				accountId: "acct-credit",
				postedOn: `${format(monthStart, "yyyy-MM")}-10`,
				description: "Dinner with friends",
				merchant: "Little Lemon",
				amountCents: -6845 - monthIndex * 75,
				categoryId: "expense-dining",
			},
			{
				accountId: "acct-checking",
				postedOn: `${format(monthStart, "yyyy-MM")}-12`,
				description: "Electric bill",
				merchant: "City Utilities",
				amountCents: -9210 + monthIndex * 12,
				categoryId: "expense-utilities",
			},
			{
				accountId: "acct-checking",
				postedOn: `${format(monthStart, "yyyy-MM")}-15`,
				description: "Transfer to Brokerage",
				merchant: "Internal Transfer",
				amountCents: -90000,
				categoryId: "transfer-internal",
			},
			{
				accountId: "acct-brokerage",
				postedOn: `${format(monthStart, "yyyy-MM")}-15`,
				description: "Transfer from Checking",
				merchant: "Internal Transfer",
				amountCents: 90000,
				categoryId: "transfer-internal",
			},
			{
				accountId: "acct-credit",
				postedOn: `${format(monthStart, "yyyy-MM")}-18`,
				description: "Rideshare",
				merchant: "Uber",
				amountCents: -2845 - monthIndex * 20,
				categoryId: "expense-transport",
			},
			{
				accountId: "acct-checking",
				postedOn: `${format(monthStart, "yyyy-MM")}-21`,
				description: "Online order",
				merchant: "Amazon",
				amountCents: -4410 - monthIndex * 110,
				categoryId: "expense-shopping",
			},
			{
				accountId: "acct-savings",
				postedOn: `${format(monthStart, "yyyy-MM")}-25`,
				description: "Interest payment",
				merchant: "Savings Interest",
				amountCents: 1825 + monthIndex * 15,
				categoryId: "income-interest",
			},
			{
				accountId: "acct-checking",
				postedOn: format(monthEnd, "yyyy-MM-dd"),
				description: "Credit card payment",
				merchant: "Travel Card Payment",
				amountCents: -65000,
				categoryId: "transfer-internal",
			},
		];

		for (const row of seededTransactions) {
			transactionRows.push({
				id: `${row.accountId}-${row.postedOn}-${Math.abs(row.amountCents)}`,
				accountId: row.accountId,
				importId: null,
				postedOn: row.postedOn,
				description: row.description,
				merchant: row.merchant,
				memo: null,
				amountCents: row.amountCents,
				currency: "USD",
				categoryId: row.categoryId,
				externalHash: buildTransactionHash({
					accountId: row.accountId,
					postedOn: row.postedOn,
					amountCents: row.amountCents,
					description: row.description,
					merchant: row.merchant,
				}),
				rawJson: null,
				recurringOverride: null,
				isRecurring: false,
				createdAt: nowTimestamp(),
				updatedAt: nowTimestamp(),
			});
		}
	}

	db.insert(transactions).values(transactionRows).run();
	db.insert(accountBalanceSnapshots).values(snapshotRows).run();
	normalizeRecurringFlags();
}

export function initializeFinanceStore() {
	ensureTables();
	ensureRuntimeCompatibility();
	ensureDefaultCategoriesAndRules();
	if (getAppSetting(sampleDataSettingKey) === null) {
		setAppSetting(sampleDataSettingKey, "true");
	}
	if (getAppSetting(hasSeenOnboardingSettingKey) === null) {
		setAppSetting(hasSeenOnboardingSettingKey, "false");
	}
	if (getAppSetting(weekStartDaySettingKey) === null) {
		setAppSetting(weekStartDaySettingKey, "1");
	}
	if (getAppSetting(biWeekAnchorDateSettingKey) === null) {
		setAppSetting(biWeekAnchorDateSettingKey, "");
	}
	if (getAppSetting(transactionPageSizeSettingKey) === null) {
		setAppSetting(transactionPageSizeSettingKey, "25");
	}
	if (getAppSetting(showIncomeChartSettingKey) === null) {
		setAppSetting(showIncomeChartSettingKey, "false");
	}
	if (getAppSetting(expenseChartExcludedCategoriesSettingKey) === null) {
		setAppSetting(
			expenseChartExcludedCategoriesSettingKey,
			JSON.stringify(["Housing"]),
		);
	}
	if (sampleDataEnabled()) {
		seedDatabase();
	}
}

function clearSampleData() {
	db.delete(accountBalanceSnapshots)
		.where(eq(accountBalanceSnapshots.source, "seed"))
		.run();
	db.delete(transactionImportMappings)
		.where(inArray(transactionImportMappings.accountId, [...sampleAccountIds]))
		.run();
	db.delete(transactionImports)
		.where(inArray(transactionImports.accountId, [...sampleAccountIds]))
		.run();
	db.delete(transactions)
		.where(inArray(transactions.accountId, [...sampleAccountIds]))
		.run();
	db.delete(accounts)
		.where(inArray(accounts.id, [...sampleAccountIds]))
		.run();
}

export function getAppSettings(): AppSettings {
	return {
		sampleDataEnabled: sampleDataEnabled(),
		sampleDataLoaded: sampleDataLoaded(),
		hasSeenOnboarding: hasSeenOnboarding(),
		weekStartDay: weekStartDay(),
		biWeekAnchorDate: biWeekAnchorDate(),
		transactionPageSize: transactionPageSize(),
		showIncomeChart: showIncomeChart(),
		expenseChartExcludedCategories: expenseChartExcludedCategories(),
	};
}

export function updateAppSettings(input: UpdateAppSettingsInput): AppSettings {
	if (typeof input.sampleDataEnabled === "boolean") {
		setAppSetting(sampleDataSettingKey, String(input.sampleDataEnabled));
		if (input.sampleDataEnabled) {
			clearSampleData();
			seedDatabase();
		} else {
			clearSampleData();
		}
	}

	if (typeof input.hasSeenOnboarding === "boolean") {
		setAppSetting(hasSeenOnboardingSettingKey, String(input.hasSeenOnboarding));
	}

	if (typeof input.weekStartDay === "number") {
		const normalized = Math.trunc(input.weekStartDay);
		if (normalized < 0 || normalized > 6 || !Number.isFinite(normalized)) {
			throw new Error("Week start day must be between 0 and 6");
		}
		setAppSetting(weekStartDaySettingKey, String(normalized));
	}

	if (input.biWeekAnchorDate !== undefined) {
		if (input.biWeekAnchorDate === null || input.biWeekAnchorDate === "") {
			setAppSetting(biWeekAnchorDateSettingKey, "");
		} else {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(input.biWeekAnchorDate)) {
				throw new Error("Bi-week anchor date must be yyyy-MM-dd");
			}
			setAppSetting(biWeekAnchorDateSettingKey, input.biWeekAnchorDate);
		}
	}

	if (input.transactionPageSize !== undefined) {
		if (!transactionPageSizeOptions.includes(input.transactionPageSize)) {
			throw new Error("Invalid transaction page size");
		}
		setAppSetting(
			transactionPageSizeSettingKey,
			String(input.transactionPageSize),
		);
	}

	if (typeof input.showIncomeChart === "boolean") {
		setAppSetting(showIncomeChartSettingKey, String(input.showIncomeChart));
	}

	if (Array.isArray(input.expenseChartExcludedCategories)) {
		setAppSetting(
			expenseChartExcludedCategoriesSettingKey,
			JSON.stringify(
				input.expenseChartExcludedCategories.filter(
					(item) => typeof item === "string",
				),
			),
		);
	}

	return getAppSettings();
}

function latestSnapshotMap() {
	const snapshots = db.select().from(accountBalanceSnapshots).all();
	const map = new Map<string, (typeof snapshots)[number]>();
	const todayKey = format(new Date(), "yyyy-MM-dd");

	for (const snapshot of snapshots) {
		// Ignore future-dated demo snapshots so manual user edits remain visible.
		if (snapshot.source === "seed" && snapshot.snapshotOn > todayKey) {
			continue;
		}
		const existing = map.get(snapshot.accountId);
		if (!existing || snapshot.snapshotOn > existing.snapshotOn) {
			map.set(snapshot.accountId, snapshot);
		}
	}

	return map;
}

function categoryLookupMaps() {
	const rows = db.select().from(categories).all();
	const byId = new Map(rows.map((row) => [row.id, row]));
	const byName = new Map(
		rows.map((row) => [
			normalizeMerchantKey(row.name),
			{
				id: row.id,
				name: row.name,
				kind: row.kind as CategoryKind,
				icon: row.icon,
				hidden: row.hidden,
			} satisfies CategoryRecord,
		]),
	);
	return { byId, byName };
}

function importLookupMap() {
	const rows = db.select().from(transactionImports).all();
	return new Map(rows.map((row) => [row.id, row]));
}

function serializeTransactionImportRows(
	rows: Array<typeof transactionImports.$inferSelect>,
): TransactionImportRecord[] {
	const accountMap = new Map(
		db
			.select()
			.from(accounts)
			.all()
			.map((row) => [row.id, row]),
	);

	return rows
		.map((row) => {
			const account = accountMap.get(row.accountId);
			return {
				id: row.id,
				accountId: row.accountId,
				accountName: account?.name ?? "Unknown account",
				sourceName: row.sourceName,
				rowCount: row.rowCount,
				importedCount: row.importedCount,
				duplicateCount: row.duplicateCount,
				skippedCount: row.skippedCount,
				createdSnapshotCount: row.createdSnapshotCount,
				createdAt: row.createdAt,
				canUndo: row.undoVersion >= 1,
			};
		})
		.sort((left, right) => right.createdAt - left.createdAt)
		.slice(0, 10);
}

function serializeTransactionRows(
	rows: Array<typeof transactions.$inferSelect>,
): TransactionRecord[] {
	const accountMap = new Map(
		db
			.select()
			.from(accounts)
			.all()
			.map((row) => [row.id, row]),
	);
	const { byId: categoryMap } = categoryLookupMaps();
	const importMap = importLookupMap();

	return rows.map((row) => {
		const account = accountMap.get(row.accountId);
		const category = row.categoryId ? categoryMap.get(row.categoryId) : null;
		const importRow = row.importId ? importMap.get(row.importId) : null;
		return {
			id: row.id,
			accountId: row.accountId,
			accountName: account?.name ?? "Unknown account",
			postedOn: row.postedOn,
			description: row.description,
			merchant: row.merchant,
			memo: row.memo,
			amountCents: row.amountCents,
			categoryId: row.categoryId,
			categoryName: category?.name ?? null,
			categoryIcon: category ? category.icon : null,
			categoryKind: (category?.kind as CategoryKind | undefined) ?? null,
			importId: row.importId,
			importSourceName: importRow?.sourceName ?? null,
			isRecurring: Boolean(row.isRecurring),
			recurringRule: recurringRuleFromOverride(row.recurringOverride),
		};
	});
}

export function listAccounts(): AccountSummary[] {
	const accountRows = db.select().from(accounts).all();
	const snapshotMap = latestSnapshotMap();
	const transactionRows = db.select().from(transactions).all();
	const transactionTotals = new Map<string, number>();

	for (const row of transactionRows) {
		transactionTotals.set(
			row.accountId,
			(transactionTotals.get(row.accountId) ?? 0) + row.amountCents,
		);
	}

	return accountRows
		.map((row) => {
			const snapshot = snapshotMap.get(row.id);
			return {
				id: row.id,
				name: row.name,
				type: row.type as AccountType,
				classification: accountClassification(row.type as AccountType),
				institutionName: row.institutionName,
				currency: row.currency,
				last4: row.last4,
				includeInNetWorth: Boolean(row.includeInNetWorth),
				archived: Boolean(row.archived),
				currentBalanceCents:
					snapshot?.balanceCents ?? transactionTotals.get(row.id) ?? 0,
				lastSnapshotOn: snapshot?.snapshotOn ?? null,
			};
		})
		.sort((left, right) => {
			if (left.classification !== right.classification) {
				return left.classification.localeCompare(right.classification);
			}
			return right.currentBalanceCents - left.currentBalanceCents;
		});
}

export function createAccount(input: AddAccountInput): AccountSummary {
	const id = randomUUID();
	const createdAt = nowTimestamp();
	db.insert(accounts)
		.values({
			id,
			name: normalizeWhitespace(input.name),
			type: input.type,
			institutionName: input.institutionName?.trim() || null,
			currency: currencyOrDefault(input.currency),
			last4: input.last4?.trim() || null,
			includeInNetWorth: true,
			archived: false,
			createdAt,
		})
		.run();

	if (typeof input.openingBalanceCents === "number") {
		db.insert(accountBalanceSnapshots)
			.values({
				id: randomUUID(),
				accountId: id,
				snapshotOn: format(new Date(), "yyyy-MM-dd"),
				balanceCents: input.openingBalanceCents,
				source: "manual",
				createdAt,
			})
			.run();
	}

	const createdAccount = listAccounts().find((account) => account.id === id);
	if (!createdAccount) {
		throw new Error("Failed to create account");
	}

	return createdAccount;
}

export function updateAccountBalance(
	input: UpdateAccountBalanceInput,
): AccountSummary {
	const existingAccount = db
		.select()
		.from(accounts)
		.all()
		.find((row) => row.id === input.accountId);

	if (!existingAccount) {
		throw new Error("Account not found");
	}

	const snapshotOn = input.snapshotOn ?? format(new Date(), "yyyy-MM-dd");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotOn)) {
		throw new Error("Snapshot date must use yyyy-MM-dd");
	}

	upsertSnapshot(input.accountId, snapshotOn, input.balanceCents, "manual");

	const updatedAccount = listAccounts().find(
		(account) => account.id === input.accountId,
	);
	if (!updatedAccount) {
		throw new Error("Failed to update account balance");
	}

	return updatedAccount;
}

export function deleteAccount(input: { accountId: string }): void {
	const existingAccount = db
		.select()
		.from(accounts)
		.all()
		.find((row) => row.id === input.accountId);

	if (!existingAccount) {
		throw new Error("Account not found");
	}

	db.delete(accounts).where(eq(accounts.id, input.accountId)).run();
}

export function listCategories(): CategoryRecord[] {
	return db
		.select()
		.from(categories)
		.all()
		.map((row) => ({
			id: row.id,
			name: row.name,
			kind: row.kind as CategoryKind,
			icon: row.icon,
			hidden: Boolean(row.hidden),
		}))
		.sort((left, right) => left.name.localeCompare(right.name));
}

export function createCategory(input: CreateCategoryInput): CategoryRecord {
	const name = normalizeWhitespace(input.name);
	if (!name) {
		throw new Error("Category name is required");
	}
	if (!categoryKinds.includes(input.kind)) {
		throw new Error("Category kind is invalid");
	}
	const icon = resolveCategoryIconForCreate(name, input.icon);
	const id = randomUUID();
	const createdAt = nowTimestamp();
	db.insert(categories)
		.values({
			id,
			name,
			kind: input.kind,
			icon,
			hidden: Boolean(input.hidden),
			createdAt,
		})
		.run();

	const created = db
		.select()
		.from(categories)
		.all()
		.find((row) => row.id === id);
	if (!created) {
		throw new Error("Failed to create category");
	}

	return {
		id: created.id,
		name: created.name,
		kind: created.kind as CategoryKind,
		icon: created.icon,
		hidden: Boolean(created.hidden),
	};
}

export function updateCategory(input: UpdateCategoryInput): CategoryRecord {
	const current = db
		.select()
		.from(categories)
		.all()
		.find((row) => row.id === input.id);

	if (!current) {
		throw new Error("Category not found");
	}

	if (input.kind !== undefined && !categoryKinds.includes(input.kind)) {
		throw new Error("Category kind is invalid");
	}

	const nextName =
		input.name !== undefined ? normalizeWhitespace(input.name) : current.name;
	if (!nextName) {
		throw new Error("Category name is required");
	}

	const nextKind = (input.kind ?? current.kind) as CategoryKind;
	const nextIcon = resolveCategoryIconForUpdate(input.icon, current.icon);
	const nextHidden =
		input.hidden !== undefined ? Boolean(input.hidden) : current.hidden;

	db.update(categories)
		.set({
			name: nextName,
			kind: nextKind,
			icon: nextIcon,
			hidden: nextHidden,
		})
		.where(eq(categories.id, input.id))
		.run();

	const updated = listCategories().find((row) => row.id === input.id);
	if (!updated) {
		throw new Error("Failed to update category");
	}

	return updated;
}

export function deleteCategory(input: DeleteCategoryInput): void {
	const existing = db
		.select()
		.from(categories)
		.all()
		.find((row) => row.id === input.id);

	if (!existing) {
		throw new Error("Category not found");
	}

	db.delete(categories).where(eq(categories.id, input.id)).run();
}

export function listTransactionImports(): TransactionImportRecord[] {
	return serializeTransactionImportRows(
		db.select().from(transactionImports).all(),
	);
}

export function listTransactions(
	filters: TransactionFilters,
): TransactionListPage {
	const limit = normalizeTransactionPageLimit(filters.limit);
	const offset = normalizeTransactionOffset(filters.offset);
	const baseFilters: TransactionListFilters = {
		search: filters.search,
		categoryId: filters.categoryId,
		accountId: filters.accountId,
		from: filters.from,
		to: filters.to,
	};
	const hasSearch = Boolean(baseFilters.search?.trim());

	if (!hasSearch) {
		const conditions: SQL[] = [];
		pushTransactionFilterConditions(baseFilters, conditions, {});
		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
		const rows = db
			.select()
			.from(transactions)
			.where(whereClause)
			.orderBy(desc(transactions.postedOn), desc(transactions.amountCents))
			.limit(limit)
			.offset(offset)
			.all();
		const countRow = db
			.select({ total: count() })
			.from(transactions)
			.where(whereClause)
			.get();
		return {
			items: serializeTransactionRows(rows),
			totalCount: countRow?.total ?? 0,
		};
	}

	const searchHaystack = sql`lower(coalesce(${transactions.description}, '') || ' ' || coalesce(${transactions.merchant}, '') || ' ' || coalesce(${transactions.memo}, '') || ' ' || coalesce(${accounts.name}, '') || ' ' || coalesce(${categories.name}, ''))`;
	const conditions: SQL[] = [];
	pushTransactionFilterConditions(baseFilters, conditions, { searchHaystack });
	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const rows = db
		.select()
		.from(transactions)
		.innerJoin(accounts, eq(transactions.accountId, accounts.id))
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.where(whereClause)
		.orderBy(desc(transactions.postedOn), desc(transactions.amountCents))
		.limit(limit)
		.offset(offset)
		.all();

	const countRow = db
		.select({ total: count() })
		.from(transactions)
		.innerJoin(accounts, eq(transactions.accountId, accounts.id))
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.where(whereClause)
		.get();

	const transactionRows = rows.map((row) => row.transactions);

	return {
		items: serializeTransactionRows(transactionRows),
		totalCount: countRow?.total ?? 0,
	};
}

export function updateTransaction(
	input: UpdateTransactionInput,
): TransactionRecord {
	const current = db
		.select()
		.from(transactions)
		.all()
		.find((row) => row.id === input.id);

	if (!current) {
		throw new Error("Transaction not found");
	}

	if (input.accountId !== undefined) {
		const nextAccount = db
			.select()
			.from(accounts)
			.all()
			.find((row) => row.id === input.accountId);
		if (!nextAccount) {
			throw new Error("Account not found");
		}
	}

	if (
		input.amountCents !== undefined &&
		(!Number.isFinite(input.amountCents) ||
			!Number.isInteger(input.amountCents))
	) {
		throw new Error("Amount must be a valid cent value");
	}

	if (
		input.recurringRule !== undefined &&
		!transactionRecurringRules.includes(input.recurringRule)
	) {
		throw new Error("Recurring rule is invalid");
	}

	db.update(transactions)
		.set({
			accountId: input.accountId ?? current.accountId,
			postedOn: input.postedOn ?? current.postedOn,
			description:
				input.description !== undefined
					? normalizeWhitespace(input.description)
					: current.description,
			merchant:
				input.merchant !== undefined
					? normalizeWhitespace(input.merchant)
					: current.merchant,
			memo: input.memo !== undefined ? input.memo : current.memo,
			categoryId:
				input.categoryId !== undefined ? input.categoryId : current.categoryId,
			amountCents: input.amountCents ?? current.amountCents,
			recurringOverride:
				input.recurringRule !== undefined
					? recurringOverrideFromRule(input.recurringRule)
					: current.recurringOverride,
			updatedAt: nowTimestamp(),
		})
		.where(eq(transactions.id, input.id))
		.run();

	normalizeRecurringFlags();
	const updatedTransaction = findTransactionRecordById(input.id);
	if (!updatedTransaction) {
		throw new Error("Failed to update transaction");
	}

	return updatedTransaction;
}

export function undoTransactionImport(
	input: UndoTransactionImportInput,
): UndoTransactionImportResult {
	const importRow = db
		.select()
		.from(transactionImports)
		.all()
		.find((row) => row.id === input.importId);

	if (!importRow) {
		throw new Error("Import not found");
	}

	if (importRow.undoVersion < 1) {
		throw new Error("This import cannot be undone");
	}

	let deletedTransactionCount = 0;
	let deletedSnapshotCount = 0;
	const snapshotSource = `import:${input.importId}`;

	sqlite.transaction(() => {
		deletedTransactionCount = db
			.select()
			.from(transactions)
			.all()
			.filter((row) => row.importId === input.importId).length;
		deletedSnapshotCount = db
			.select()
			.from(accountBalanceSnapshots)
			.all()
			.filter((row) => row.source === snapshotSource).length;

		db.delete(transactions)
			.where(eq(transactions.importId, input.importId))
			.run();
		db.delete(accountBalanceSnapshots)
			.where(eq(accountBalanceSnapshots.source, snapshotSource))
			.run();
		db.delete(transactionImports)
			.where(eq(transactionImports.id, input.importId))
			.run();
	})();

	normalizeRecurringFlags();

	return {
		importId: input.importId,
		deletedTransactionCount,
		deletedSnapshotCount,
	};
}

function threeMonthAverage(
	series: MonthlyTrendPoint[],
	selector: (point: MonthlyTrendPoint) => number,
) {
	const previousThree = series.slice(-4, -1);
	if (previousThree.length === 0) {
		return 0;
	}

	return Math.round(
		previousThree.reduce((sum, point) => sum + selector(point), 0) /
			previousThree.length,
	);
}

/**
 * Builds a spend-vs-prior cumulative series:
 * - For W/P/M periods, x-axis = day index inside the period.
 * - For Q/Y periods, x-axis = month index (0..2 for Q, 0..11 for Y).
 */
function buildSpendVsPriorSeries(
	period: DashboardPeriod,
	currentBounds: { start: Date; end: Date; label: string },
	priorBounds: { start: Date; end: Date; label: string },
	transactions: TransactionRecord[],
	todayIso: string,
): SpendVsPriorSeries {
	const granularity: "day" | "month" =
		period === "quarterly" || period === "yearly" ? "month" : "day";

	const isSpend = (t: TransactionRecord) =>
		t.categoryKind !== "transfer" && t.amountCents < 0;

	const currentFrom = format(currentBounds.start, "yyyy-MM-dd");
	const currentTo = format(currentBounds.end, "yyyy-MM-dd");
	const priorFrom = format(priorBounds.start, "yyyy-MM-dd");
	const priorTo = format(priorBounds.end, "yyyy-MM-dd");

	const currentSpend = transactions.filter(
		(t) => isSpend(t) && t.postedOn >= currentFrom && t.postedOn <= currentTo,
	);
	const priorSpend = transactions.filter(
		(t) => isSpend(t) && t.postedOn >= priorFrom && t.postedOn <= priorTo,
	);

	if (granularity === "day") {
		const currentDays = eachDayOfInterval({
			start: currentBounds.start,
			end: currentBounds.end,
		});
		const priorDays = eachDayOfInterval({
			start: priorBounds.start,
			end: priorBounds.end,
		});
		const bucketCount = Math.max(currentDays.length, priorDays.length);

		const currentByDate = new Map<string, number>();
		for (const t of currentSpend) {
			currentByDate.set(
				t.postedOn,
				(currentByDate.get(t.postedOn) ?? 0) + Math.abs(t.amountCents),
			);
		}
		const priorByDate = new Map<string, number>();
		for (const t of priorSpend) {
			priorByDate.set(
				t.postedOn,
				(priorByDate.get(t.postedOn) ?? 0) + Math.abs(t.amountCents),
			);
		}

		const points: SpendVsPriorPoint[] = [];
		let currentCum = 0;
		let priorCum = 0;
		for (let i = 0; i < bucketCount; i += 1) {
			const currentDay = currentDays[i];
			const priorDay = priorDays[i];
			const currentIso = currentDay ? format(currentDay, "yyyy-MM-dd") : null;
			const priorIso = priorDay ? format(priorDay, "yyyy-MM-dd") : null;

			let currentCumulativeCents: number | null = null;
			if (currentIso) {
				currentCum += currentByDate.get(currentIso) ?? 0;
				currentCumulativeCents = currentIso <= todayIso ? currentCum : null;
			}
			let priorCumulativeCents: number | null = null;
			if (priorIso) {
				priorCum += priorByDate.get(priorIso) ?? 0;
				priorCumulativeCents = priorCum;
			}

			const labelSource = currentDay ?? priorDay;
			const label = labelSource ? format(labelSource, "d") : String(i + 1);

			points.push({
				index: i,
				label,
				currentCumulativeCents,
				priorCumulativeCents,
			});
		}
		return {
			currentLabel: currentBounds.label,
			priorLabel: priorBounds.label,
			granularity,
			points,
		};
	}

	// Month granularity (Q/Y)
	const monthsInRange = (start: Date, end: Date) => {
		const months: Date[] = [];
		let cursor = startOfMonth(start);
		const endMonth = startOfMonth(end);
		while (cursor <= endMonth) {
			months.push(cursor);
			cursor = startOfMonth(
				new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
			);
		}
		return months;
	};
	const currentMonths = monthsInRange(currentBounds.start, currentBounds.end);
	const priorMonths = monthsInRange(priorBounds.start, priorBounds.end);
	const bucketCount = Math.max(currentMonths.length, priorMonths.length);
	const todayMonth = todayIso.slice(0, 7);

	const currentByMonth = new Map<string, number>();
	for (const t of currentSpend) {
		const key = t.postedOn.slice(0, 7);
		currentByMonth.set(
			key,
			(currentByMonth.get(key) ?? 0) + Math.abs(t.amountCents),
		);
	}
	const priorByMonth = new Map<string, number>();
	for (const t of priorSpend) {
		const key = t.postedOn.slice(0, 7);
		priorByMonth.set(
			key,
			(priorByMonth.get(key) ?? 0) + Math.abs(t.amountCents),
		);
	}

	const points: SpendVsPriorPoint[] = [];
	let currentCum = 0;
	let priorCum = 0;
	for (let i = 0; i < bucketCount; i += 1) {
		const currentMonth = currentMonths[i];
		const priorMonth = priorMonths[i];
		const currentKey = currentMonth ? format(currentMonth, "yyyy-MM") : null;
		const priorKey = priorMonth ? format(priorMonth, "yyyy-MM") : null;

		let currentCumulativeCents: number | null = null;
		if (currentKey) {
			currentCum += currentByMonth.get(currentKey) ?? 0;
			currentCumulativeCents = currentKey <= todayMonth ? currentCum : null;
		}
		let priorCumulativeCents: number | null = null;
		if (priorKey) {
			priorCum += priorByMonth.get(priorKey) ?? 0;
			priorCumulativeCents = priorCum;
		}

		const labelSource = currentMonth ?? priorMonth;
		const label = labelSource ? format(labelSource, "MMM") : String(i + 1);

		points.push({
			index: i,
			label,
			currentCumulativeCents,
			priorCumulativeCents,
		});
	}

	return {
		currentLabel: currentBounds.label,
		priorLabel: priorBounds.label,
		granularity,
		points,
	};
}

/**
 * Aggregates the last N periods of transactions into a series of per-category
 * totals, filtered by category kind. N and period granularity are determined
 * by the dashboard period (via {@link trendPeriodCount}). Uncategorized
 * transactions are bucketed separately.
 */
function buildCategoryTrendSeries(
	kind: "expense" | "income",
	period: DashboardPeriod,
	anchorBounds: PeriodBounds,
	periodConfig: PeriodConfig,
	allTransactions: TransactionRecord[],
	categoryRows: CategoryRecord[],
): CategoryTrendSeries {
	const categoriesById = new Map(categoryRows.map((c) => [c.id, c]));
	const count = trendPeriodCount(period);

	const periodBoundsList: PeriodBounds[] = [];
	for (let i = count - 1; i >= 0; i -= 1) {
		const periodAnchor = stepPeriod(period, anchorBounds.start, -i);
		periodBoundsList.push(
			computePeriodBounds(period, periodAnchor, periodConfig),
		);
	}

	const isMatch = (t: TransactionRecord) => {
		if (t.categoryKind === "transfer") return false;
		if (kind === "expense") {
			return t.amountCents < 0;
		}
		return t.categoryKind === "income" || t.amountCents > 0;
	};

	const fromStr = format(periodBoundsList[0].start, "yyyy-MM-dd");
	const toStr = format(
		periodBoundsList[periodBoundsList.length - 1].end,
		"yyyy-MM-dd",
	);
	const relevant = allTransactions.filter(
		(t) => isMatch(t) && t.postedOn >= fromStr && t.postedOn <= toStr,
	);

	const fallback = {
		name: "Uncategorized",
		icon: kind === "expense" ? "CircleDot" : "Banknote",
	};

	const totalsByCategory = new Map<
		string,
		{ name: string; icon: string; amountCents: number }
	>();
	const buckets: CategoryBucketPoint[] = periodBoundsList.map((bounds) => ({
		key: bounds.key,
		label: trendPointLabel(period, bounds),
		categories: {},
		totalCents: 0,
	}));
	const bucketIndexByKey = new Map(
		buckets.map((b, index) => [b.key, index] as const),
	);

	for (const tx of relevant) {
		const txBounds = computePeriodBounds(
			period,
			parseISO(tx.postedOn),
			periodConfig,
		);
		const bucketIndex = bucketIndexByKey.get(txBounds.key);
		if (bucketIndex === undefined) continue;

		const category = tx.categoryId ? categoriesById.get(tx.categoryId) : null;
		const key = category?.id ?? "uncategorized";
		const name = category?.name ?? fallback.name;
		const icon = category?.icon ?? fallback.icon;
		const amountAbs = Math.abs(tx.amountCents);

		const entry = totalsByCategory.get(key) ?? {
			name,
			icon,
			amountCents: 0,
		};
		entry.amountCents += amountAbs;
		totalsByCategory.set(key, entry);

		const bucket = buckets[bucketIndex];
		bucket.categories[name] = (bucket.categories[name] ?? 0) + amountAbs;
		bucket.totalCents += amountAbs;
	}

	const categoryTotals: MonthlyCategoryTotal[] = [...totalsByCategory.entries()]
		.map(([categoryId, value]) => ({
			categoryId: categoryId === "uncategorized" ? null : categoryId,
			categoryName: value.name,
			icon: value.icon,
			amountCents: value.amountCents,
		}))
		.sort((left, right) => right.amountCents - left.amountCents);

	return { period, buckets, categoryTotals };
}

/**
 * Current calendar month's recurring transactions, bucketed by day.
 */
function buildRecurringCalendar(
	anchor: Date,
	allTransactions: TransactionRecord[],
): RecurringCalendar {
	const monthStart = startOfMonth(anchor);
	const monthEnd = endOfMonth(anchor);
	const daysInMonth = getDaysInMonth(monthStart);
	const fromStr = format(monthStart, "yyyy-MM-dd");
	const toStr = format(monthEnd, "yyyy-MM-dd");

	const days: RecurringCalendarDay[] = [];
	for (let d = 0; d < daysInMonth; d += 1) {
		const day = addDays(monthStart, d);
		days.push({
			date: format(day, "yyyy-MM-dd"),
			dayOfMonth: d + 1,
			transactions: [],
		});
	}
	const dayIndex = new Map(days.map((day, idx) => [day.date, idx] as const));

	for (const tx of allTransactions) {
		if (!tx.isRecurring) continue;
		if (tx.categoryKind === "transfer") continue;
		if (tx.postedOn < fromStr || tx.postedOn > toStr) continue;
		const idx = dayIndex.get(tx.postedOn);
		if (idx === undefined) continue;
		const bucket = days[idx];
		const recurringTx: RecurringCalendarTransaction = {
			id: tx.id,
			merchant: tx.merchant || tx.description || "Recurring",
			categoryIcon: tx.categoryIcon,
			amountCents: Math.abs(tx.amountCents),
			isIncome: tx.amountCents > 0 || tx.categoryKind === "income",
		};
		bucket.transactions.push(recurringTx);
	}

	return {
		year: monthStart.getFullYear(),
		month: monthStart.getMonth() + 1,
		label: format(monthStart, "MMMM yyyy"),
		firstDayOfWeek: monthStart.getDay(),
		daysInMonth,
		days,
	};
}

/**
 * Collapses recurring transactions into a "subscriptions" list: one entry per
 * merchant, with a monthly cents estimate based on the last 6 calendar months.
 */
function buildRecurringSubscriptions(
	anchor: Date,
	allTransactions: TransactionRecord[],
): RecurringSubscription[] {
	const windowStart = startOfMonth(subMonths(anchor, 5));
	const windowEnd = endOfMonth(anchor);
	const fromStr = format(windowStart, "yyyy-MM-dd");
	const toStr = format(windowEnd, "yyyy-MM-dd");

	type Bucket = {
		merchant: string;
		categoryIcon: string | null;
		categoryName: string | null;
		totalCents: number;
		months: Set<string>;
	};

	const byMerchant = new Map<string, Bucket>();
	for (const tx of allTransactions) {
		if (!tx.isRecurring) continue;
		if (tx.categoryKind === "transfer") continue;
		if (tx.amountCents >= 0) continue;
		if (tx.postedOn < fromStr || tx.postedOn > toStr) continue;
		const merchant = (tx.merchant || tx.description || "Recurring").trim();
		if (!merchant) continue;
		const key = merchant.toLowerCase();
		const bucket = byMerchant.get(key) ?? {
			merchant,
			categoryIcon: tx.categoryIcon,
			categoryName: tx.categoryName,
			totalCents: 0,
			months: new Set<string>(),
		};
		bucket.totalCents += Math.abs(tx.amountCents);
		bucket.months.add(tx.postedOn.slice(0, 7));
		if (!bucket.categoryIcon && tx.categoryIcon) {
			bucket.categoryIcon = tx.categoryIcon;
		}
		if (!bucket.categoryName && tx.categoryName) {
			bucket.categoryName = tx.categoryName;
		}
		byMerchant.set(key, bucket);
	}

	const subscriptions: RecurringSubscription[] = [];
	for (const [key, bucket] of byMerchant) {
		const observedMonths = Math.max(bucket.months.size, 1);
		const monthlyCents = Math.round(bucket.totalCents / observedMonths);
		subscriptions.push({
			id: key,
			merchant: bucket.merchant,
			categoryIcon: bucket.categoryIcon,
			categoryName: bucket.categoryName,
			monthlyCents,
			yearlyCents: monthlyCents * 12,
			observedMonths,
		});
	}
	subscriptions.sort((left, right) => right.monthlyCents - left.monthlyCents);
	return subscriptions;
}

export function getDashboard(input: {
	period?: string;
	anchor?: string;
}): DashboardData {
	const resolvedPeriod: DashboardPeriod =
		input.period && dashboardPeriods.includes(input.period as DashboardPeriod)
			? (input.period as DashboardPeriod)
			: "monthly";

	const anchorDate =
		input.anchor && /^\d{4}-\d{2}-\d{2}$/.test(input.anchor)
			? parseISO(input.anchor)
			: new Date();

	const periodConfig = periodConfigFromSettings({
		weekStartDay: weekStartDay(),
		biWeekAnchorDate: biWeekAnchorDate(),
	});
	const bounds = computePeriodBounds(resolvedPeriod, anchorDate, periodConfig);
	const fromStr = format(bounds.start, "yyyy-MM-dd");
	const toStr = format(bounds.end, "yyyy-MM-dd");

	const allTransactions = loadAllTransactionRecordsUnfiltered();
	const periodTransactions = allTransactions.filter(
		(t) => t.postedOn >= fromStr && t.postedOn <= toStr,
	);

	const trendCount = trendPeriodCount(resolvedPeriod);
	const monthlyTrend: MonthlyTrendPoint[] = [];
	for (let i = trendCount - 1; i >= 0; i--) {
		const trendAnchor = stepPeriod(resolvedPeriod, bounds.start, -i);
		const trendBounds = computePeriodBounds(
			resolvedPeriod,
			trendAnchor,
			periodConfig,
		);
		const trendFrom = format(trendBounds.start, "yyyy-MM-dd");
		const trendTo = format(trendBounds.end, "yyyy-MM-dd");
		const rows = allTransactions.filter(
			(t) => t.postedOn >= trendFrom && t.postedOn <= trendTo,
		);
		const incomeCents = rows
			.filter((row) => row.categoryKind === "income" || row.amountCents > 0)
			.reduce((sum, row) => sum + Math.max(row.amountCents, 0), 0);
		const expenseCents = Math.abs(
			rows
				.filter((row) => row.categoryKind !== "transfer" && row.amountCents < 0)
				.reduce((sum, row) => sum + row.amountCents, 0),
		);
		monthlyTrend.push({
			month: trendBounds.key,
			label: trendPointLabel(resolvedPeriod, trendBounds),
			incomeCents,
			expenseCents,
			netCents: incomeCents - expenseCents,
		});
	}

	const totalIncomeCents = periodTransactions
		.filter((row) => row.categoryKind === "income" || row.amountCents > 0)
		.reduce((sum, row) => sum + Math.max(row.amountCents, 0), 0);
	const totalExpenseCents = Math.abs(
		periodTransactions
			.filter((row) => row.categoryKind !== "transfer" && row.amountCents < 0)
			.reduce((sum, row) => sum + row.amountCents, 0),
	);
	const totalTransferCents = periodTransactions
		.filter((row) => row.categoryKind === "transfer")
		.reduce((sum, row) => sum + Math.abs(row.amountCents), 0);

	const expenseGroups = new Map<
		string,
		{ name: string; icon: string; amountCents: number }
	>();
	const categoryRows = listCategories();
	const fallbackExpense = {
		name: "Uncategorized",
		icon: "CircleDot",
		amountCents: 0,
	};

	for (const row of periodTransactions) {
		if (row.amountCents >= 0 || row.categoryKind === "transfer") {
			continue;
		}
		const category = categoryRows.find((c) => c.id === row.categoryId);
		const groupKey = category?.id ?? "uncategorized";
		const existing = expenseGroups.get(groupKey) ?? {
			name: category?.name ?? fallbackExpense.name,
			icon: category?.icon ?? fallbackExpense.icon,
			amountCents: 0,
		};
		existing.amountCents += Math.abs(row.amountCents);
		expenseGroups.set(groupKey, existing);
	}

	const accountRows = listAccounts().filter(
		(account) => account.includeInNetWorth,
	);
	const assetsCents = accountRows
		.filter((account) => account.classification === "asset")
		.reduce(
			(sum, account) => sum + Math.max(account.currentBalanceCents, 0),
			0,
		);
	const liabilitiesCents = Math.abs(
		accountRows
			.filter((account) => account.classification === "liability")
			.reduce(
				(sum, account) => sum + Math.min(account.currentBalanceCents, 0),
				0,
			),
	);

	const dailyCashFlow: DailyCashFlowPoint[] = eachDayOfInterval({
		start: bounds.start,
		end: bounds.end,
	}).map((day) => ({
		date: format(day, "yyyy-MM-dd"),
		dayOfMonth: day.getDate(),
		expenseCents: 0,
		incomeCents: 0,
		expenseCategoryBreakdown: [],
	}));
	const dailyIndex = new Map(
		dailyCashFlow.map((point, index) => [point.date, index]),
	);
	const dailyCategoryBuckets = new Map<
		number,
		Map<string, { name: string; icon: string; amountCents: number }>
	>();
	for (const tx of periodTransactions) {
		if (tx.categoryKind === "transfer") {
			continue;
		}
		const index = dailyIndex.get(tx.postedOn);
		if (index === undefined) {
			continue;
		}
		const point = dailyCashFlow[index];
		if (tx.amountCents < 0) {
			const amountAbs = Math.abs(tx.amountCents);
			point.expenseCents += amountAbs;
			let bucket = dailyCategoryBuckets.get(index);
			if (!bucket) {
				bucket = new Map();
				dailyCategoryBuckets.set(index, bucket);
			}
			const key = tx.categoryId ?? "uncategorized";
			const entry = bucket.get(key) ?? {
				name: tx.categoryName ?? "Uncategorized",
				icon: tx.categoryIcon ?? "CircleDot",
				amountCents: 0,
			};
			entry.amountCents += amountAbs;
			bucket.set(key, entry);
		} else if (tx.amountCents > 0) {
			point.incomeCents += tx.amountCents;
		}
	}
	for (const [index, bucket] of dailyCategoryBuckets) {
		dailyCashFlow[index].expenseCategoryBreakdown = [...bucket.entries()]
			.map(([categoryId, value]) => ({
				categoryId: categoryId === "uncategorized" ? null : categoryId,
				categoryName: value.name,
				icon: value.icon,
				amountCents: value.amountCents,
			}))
			.sort((left, right) => right.amountCents - left.amountCents);
	}

	const snapshotRows = db.select().from(accountBalanceSnapshots).all();
	const snapshotDates = [
		...new Set(snapshotRows.map((snapshot) => snapshot.snapshotOn)),
	].sort();
	const accountMap = new Map(
		listAccounts().map((account) => [account.id, account]),
	);
	const netWorthTrend: NetWorthPoint[] = snapshotDates.map((date) => {
		let assets = 0;
		let liabilities = 0;
		for (const snapshot of snapshotRows.filter(
			(row) => row.snapshotOn === date,
		)) {
			const account = accountMap.get(snapshot.accountId);
			if (!account || !account.includeInNetWorth) {
				continue;
			}
			if (account.classification === "asset") {
				assets += snapshot.balanceCents;
			} else {
				liabilities += Math.abs(Math.min(snapshot.balanceCents, 0));
			}
		}
		return {
			date,
			label: format(parseISO(date), "MMM d"),
			assetsCents: assets,
			liabilitiesCents: liabilities,
			netWorthCents: assets - liabilities,
		};
	});

	const priorAnchor = stepPeriod(resolvedPeriod, bounds.start, -1);
	const priorBounds = computePeriodBounds(
		resolvedPeriod,
		priorAnchor,
		periodConfig,
	);
	const todayIso = format(new Date(), "yyyy-MM-dd");
	const spendVsPrior = buildSpendVsPriorSeries(
		resolvedPeriod,
		bounds,
		priorBounds,
		allTransactions,
		todayIso,
	);

	const now = new Date();
	const expenseCategoryTrend = buildCategoryTrendSeries(
		"expense",
		resolvedPeriod,
		bounds,
		periodConfig,
		allTransactions,
		categoryRows,
	);
	const incomeCategoryTrend = buildCategoryTrendSeries(
		"income",
		resolvedPeriod,
		bounds,
		periodConfig,
		allTransactions,
		categoryRows,
	);
	const recurringCalendar = buildRecurringCalendar(now, allTransactions);
	const recurringSubscriptions = buildRecurringSubscriptions(
		now,
		allTransactions,
	);

	return {
		period: resolvedPeriod,
		periodKey: bounds.key,
		periodLabel: bounds.label,
		spentInMonthCents: totalExpenseCents,
		totalIncomeCents,
		totalExpenseCents,
		totalTransferCents,
		netCashFlowCents: totalIncomeCents - totalExpenseCents,
		averageTransactionCents:
			periodTransactions.length > 0
				? Math.round(
						periodTransactions.reduce(
							(sum, row) => sum + Math.abs(row.amountCents),
							0,
						) / periodTransactions.length,
					)
				: 0,
		expenseVsThreeMonthAverageCents:
			totalExpenseCents -
			threeMonthAverage(monthlyTrend, (point) => point.expenseCents),
		incomeVsThreeMonthAverageCents:
			totalIncomeCents -
			threeMonthAverage(monthlyTrend, (point) => point.incomeCents),
		monthlyCategoryTotals: [...expenseGroups.entries()]
			.map(([categoryId, value]) => ({
				categoryId: categoryId === "uncategorized" ? null : categoryId,
				categoryName: value.name,
				icon: value.icon,
				amountCents: value.amountCents,
			}))
			.sort((left, right) => right.amountCents - left.amountCents),
		monthlyTrend,
		netWorthTrend,
		dailyCashFlow,
		assetsCents,
		liabilitiesCents,
		netWorthCents: assetsCents - liabilitiesCents,
		recentTransactions: periodTransactions.slice(0, 8),
		spendVsPrior,
		expenseCategoryTrend,
		incomeCategoryTrend,
		recurringCalendar,
		recurringSubscriptions,
	};
}

function upsertSnapshot(
	accountId: string,
	snapshotOn: string,
	balanceCents: number,
	source: string,
) {
	const existing = db
		.select()
		.from(accountBalanceSnapshots)
		.all()
		.find(
			(snapshot) =>
				snapshot.accountId === accountId && snapshot.snapshotOn === snapshotOn,
		);

	if (existing) {
		db.update(accountBalanceSnapshots)
			.set({ balanceCents, source })
			.where(
				and(
					eq(accountBalanceSnapshots.accountId, accountId),
					eq(accountBalanceSnapshots.snapshotOn, snapshotOn),
				),
			)
			.run();
		return false;
	}

	db.insert(accountBalanceSnapshots)
		.values({
			id: randomUUID(),
			accountId,
			snapshotOn,
			balanceCents,
			source,
			createdAt: nowTimestamp(),
		})
		.run();
	return true;
}

export function importTransactions(
	input: ImportTransactionsInput,
): ImportTransactionsResult {
	const importId = randomUUID();
	const mappingJson = JSON.stringify({
		recognizedColumns: [
			...new Set(
				input.rows.flatMap((row) =>
					Object.entries(row)
						.filter(
							([key, value]) =>
								key !== "_custom_fields" &&
								key !== "_unmatched" &&
								value !== null &&
								value !== undefined &&
								String(value).trim() !== "",
						)
						.map(([key]) => key),
				),
			),
		].sort(),
	});
	const categoryMaps = categoryLookupMaps();
	const rules = db
		.select()
		.from(transactionRules)
		.all()
		.map((rule) => ({
			merchantPattern: normalizeMerchantKey(rule.merchantPattern),
			categoryId: rule.categoryId,
		}));
	const existingHashes = new Set(
		db
			.select()
			.from(transactions)
			.all()
			.map((row) => row.externalHash),
	);

	let importedCount = 0;
	let duplicateCount = 0;
	let skippedCount = 0;
	let createdSnapshotCount = 0;

	db.insert(transactionImports)
		.values({
			id: importId,
			accountId: input.accountId,
			sourceName: input.sourceName,
			rowCount: input.rows.length,
			importedCount: 0,
			duplicateCount: 0,
			skippedCount: 0,
			createdSnapshotCount: 0,
			undoVersion: 0,
			mappingJson,
			createdAt: nowTimestamp(),
		})
		.run();

	const existingMapping = db
		.select()
		.from(transactionImportMappings)
		.all()
		.find(
			(mapping) =>
				mapping.accountId === input.accountId &&
				mapping.sourceName === input.sourceName,
		);

	if (existingMapping) {
		db.update(transactionImportMappings)
			.set({
				mappingJson,
				updatedAt: nowTimestamp(),
			})
			.where(eq(transactionImportMappings.id, existingMapping.id))
			.run();
	} else {
		db.insert(transactionImportMappings)
			.values({
				id: randomUUID(),
				accountId: input.accountId,
				sourceName: input.sourceName,
				mappingJson,
				updatedAt: nowTimestamp(),
			})
			.run();
	}

	const accountRows = db.select().from(accounts).all();
	const recurringByMerchantAmount = new Map<string, string[]>();
	for (const t of db.select().from(transactions).all()) {
		const key = `${normalizeMerchantKey(t.merchant)}|${Math.abs(t.amountCents)}`;
		const dates = recurringByMerchantAmount.get(key) ?? [];
		dates.push(t.postedOn);
		recurringByMerchantAmount.set(key, dates);
	}

	function isRecurringImportCandidate(
		merchantValue: string,
		amount: number,
		postedOnStr: string,
	) {
		const key = `${normalizeMerchantKey(merchantValue)}|${Math.abs(amount)}`;
		const dates = recurringByMerchantAmount.get(key);
		if (!dates?.length) {
			return false;
		}
		const pivot = parseISO(postedOnStr);
		return dates.some((existingOn) => {
			const gap = Math.abs(
				differenceInCalendarDays(pivot, parseISO(existingOn)),
			);
			return gap >= 25 && gap <= 35;
		});
	}

	for (const row of input.rows) {
		const postedOn = parseDateInput(row.postedOn ?? row.date);
		const amountCents = parseAmountCents(row);

		let rowAccountId = input.accountId;
		if (typeof row.accountName === "string" && row.accountName.trim() !== "") {
			const targetName = row.accountName.trim().toLowerCase();
			const foundAccount = accountRows.find(
				(a) =>
					a.name.toLowerCase() === targetName ||
					a.institutionName?.toLowerCase() === targetName,
			);
			if (foundAccount) {
				rowAccountId = foundAccount.id;
			}
		}

		const description = normalizeWhitespace(
			String(
				row.description ?? row.memo ?? row.merchant ?? "Imported transaction",
			),
		);
		const merchant = normalizeWhitespace(
			String(row.merchant ?? row.description ?? "Unknown merchant"),
		);

		if (!postedOn || amountCents === null || !description) {
			skippedCount += 1;
			continue;
		}

		const externalHash = buildTransactionHash({
			accountId: rowAccountId,
			postedOn,
			amountCents,
			description,
			merchant,
		});

		if (existingHashes.has(externalHash)) {
			duplicateCount += 1;
			continue;
		}

		const explicitCategoryName =
			typeof row.category === "string" ? row.category : null;
		const matchedCategoryId =
			matchCategoryId(explicitCategoryName, categoryMaps.byName) ??
			inferCategoryId(merchant, rules);

		const recurringCandidate = isRecurringImportCandidate(
			merchant,
			amountCents,
			postedOn,
		);

		db.insert(transactions)
			.values({
				id: randomUUID(),
				accountId: rowAccountId,
				importId,
				postedOn,
				description,
				merchant,
				memo: typeof row.memo === "string" ? row.memo.trim() || null : null,
				amountCents,
				currency: "USD",
				categoryId: matchedCategoryId,
				externalHash,
				rawJson: JSON.stringify(row),
				recurringOverride: null,
				isRecurring: recurringCandidate,
				createdAt: nowTimestamp(),
				updatedAt: nowTimestamp(),
			})
			.run();

		const recurringKey = `${normalizeMerchantKey(merchant)}|${Math.abs(amountCents)}`;
		const recurringDates = recurringByMerchantAmount.get(recurringKey) ?? [];
		recurringDates.push(postedOn);
		recurringByMerchantAmount.set(recurringKey, recurringDates);

		existingHashes.add(externalHash);
		importedCount += 1;

		const balanceAmount = parseAmountCandidate(row.balance);
		if (balanceAmount !== null) {
			const created = upsertSnapshot(
				rowAccountId,
				postedOn,
				centsFromNumber(balanceAmount),
				`import:${importId}`,
			);
			if (created) {
				createdSnapshotCount += 1;
			}
		}
	}

	db.update(transactionImports)
		.set({
			importedCount,
			duplicateCount,
			skippedCount,
			createdSnapshotCount,
			undoVersion: 1,
		})
		.where(eq(transactionImports.id, importId))
		.run();

	normalizeRecurringFlags();

	return {
		importId,
		importedCount,
		duplicateCount,
		skippedCount,
		createdSnapshotCount,
	};
}
