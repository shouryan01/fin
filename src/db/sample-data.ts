import { like } from "drizzle-orm";
import { db } from "./client";
import {
	accountBalanceSnapshots,
	accounts,
	categories,
	transactions,
} from "./schema";

export const SAMPLE_CATEGORIES = [
	{
		id: "sample_cat_income",
		name: "Income",
		kind: "income",
		icon: "dollar-sign",
		color: "#10b981",
	},
	{
		id: "sample_cat_groceries",
		name: "Groceries",
		kind: "expense",
		icon: "shopping-cart",
		color: "#3b82f6",
	},
	{
		id: "sample_cat_dining",
		name: "Dining Out",
		kind: "expense",
		icon: "utensils",
		color: "#f59e0b",
	},
	{
		id: "sample_cat_transport",
		name: "Transport",
		kind: "expense",
		icon: "car",
		color: "#6366f1",
	},
	{
		id: "sample_cat_housing",
		name: "Housing & Rent",
		kind: "expense",
		icon: "home",
		color: "#8b5cf6",
	},
	{
		id: "sample_cat_utilities",
		name: "Utilities",
		kind: "expense",
		icon: "zap",
		color: "#06b6d4",
	},
	{
		id: "sample_cat_subscriptions",
		name: "Subscriptions",
		kind: "expense",
		icon: "repeat",
		color: "#ec4899",
	},
	{
		id: "sample_cat_shopping",
		name: "Shopping",
		kind: "expense",
		icon: "shopping-bag",
		color: "#14b8a6",
	},
	{
		id: "sample_cat_health",
		name: "Healthcare",
		kind: "expense",
		icon: "heart-pulse",
		color: "#ef4444",
	},
	{
		id: "sample_cat_misc",
		name: "Misc",
		kind: "expense",
		icon: "tag",
		color: "#64748b",
	},
] as const;

export const SAMPLE_ACCOUNTS = [
	{
		id: "sample_acc_checking",
		name: "Primary Checking",
		type: "depository",
		institutionName: "Chase Bank",
		currency: "USD",
		last4: "4821",
		includeInNetWorth: true,
		archived: false,
		initialBalanceCents: 1524050, // $15,240.50
	},
	{
		id: "sample_acc_savings",
		name: "High-Yield Savings",
		type: "depository",
		institutionName: "Marcus by Goldman Sachs",
		currency: "USD",
		last4: "9102",
		includeInNetWorth: true,
		archived: false,
		initialBalanceCents: 3210000, // $32,100.00
	},
	{
		id: "sample_acc_credit",
		name: "Sapphire Preferred",
		type: "credit",
		institutionName: "Chase Bank",
		currency: "USD",
		last4: "7731",
		includeInNetWorth: true,
		archived: false,
		initialBalanceCents: -84020, // -$840.20
	},
	{
		id: "sample_acc_invest",
		name: "Retirement 401(k)",
		type: "investment",
		institutionName: "Fidelity Investments",
		currency: "USD",
		last4: "3310",
		includeInNetWorth: true,
		archived: false,
		initialBalanceCents: 6845000, // $68,450.00
	},
] as const;

export const SAMPLE_TRANSACTIONS = [
	{
		id: "sample_tx_01",
		accountId: "sample_acc_checking",
		categoryId: "sample_cat_income",
		postedOn: "2026-10-08",
		description: "Client Payment · Invoice #1042",
		merchant: "Acme Corp",
		memo: "Design consulting milestone 2",
		amountCents: 480000, // +$4,800.00
		externalHash: "sample_hash_01",
		isRecurring: false,
	},
	{
		id: "sample_tx_02",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_subscriptions",
		postedOn: "2026-10-08",
		description: "Apple Developer Program",
		merchant: "Apple",
		memo: "Annual developer membership",
		amountCents: -9900, // -$99.00
		externalHash: "sample_hash_02",
		isRecurring: true,
	},
	{
		id: "sample_tx_03",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_dining",
		postedOn: "2026-10-07",
		description: "Sweetgreen Downtown",
		merchant: "Sweetgreen",
		memo: "Team lunch bowl",
		amountCents: -1820, // -$18.20
		externalHash: "sample_hash_03",
		isRecurring: false,
	},
	{
		id: "sample_tx_04",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_groceries",
		postedOn: "2026-10-06",
		description: "Trader Joe's Market",
		merchant: "Trader Joe's",
		memo: "Weekly pantry essentials",
		amountCents: -8640, // -$86.40
		externalHash: "sample_hash_04",
		isRecurring: false,
	},
	{
		id: "sample_tx_05",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_transport",
		postedOn: "2026-10-05",
		description: "Uber Trip · SFO Airport",
		merchant: "Uber Technologies",
		memo: "Rideshare to airport",
		amountCents: -3850, // -$38.50
		externalHash: "sample_hash_05",
		isRecurring: false,
	},
	{
		id: "sample_tx_06",
		accountId: "sample_acc_checking",
		categoryId: "sample_cat_income",
		postedOn: "2026-10-01",
		description: "Stripe Payout · Software Sales",
		merchant: "Stripe",
		memo: "Monthly product earnings",
		amountCents: 625000, // +$6,250.00
		externalHash: "sample_hash_06",
		isRecurring: true,
	},
	{
		id: "sample_tx_07",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_utilities",
		postedOn: "2026-10-01",
		description: "AWS Cloud Infrastructure",
		merchant: "Amazon Web Services",
		memo: "Production servers & DB hosting",
		amountCents: -34218, // -$342.18
		externalHash: "sample_hash_07",
		isRecurring: true,
	},
	{
		id: "sample_tx_08",
		accountId: "sample_acc_checking",
		categoryId: "sample_cat_housing",
		postedOn: "2026-10-01",
		description: "Apartment Rent Payment",
		merchant: "Equitable Properties",
		memo: "October rent transfer",
		amountCents: -240000, // -$2,400.00
		externalHash: "sample_hash_08",
		isRecurring: true,
	},
	{
		id: "sample_tx_09",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_dining",
		postedOn: "2026-09-30",
		description: "Blue Bottle Coffee",
		merchant: "Blue Bottle Coffee",
		memo: "Morning espresso & pastry",
		amountCents: -1475, // -$14.75
		externalHash: "sample_hash_09",
		isRecurring: false,
	},
	{
		id: "sample_tx_10",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_groceries",
		postedOn: "2026-09-28",
		description: "Whole Foods Market",
		merchant: "Whole Foods Market",
		memo: "Organic produce & groceries",
		amountCents: -14250, // -$142.50
		externalHash: "sample_hash_10",
		isRecurring: false,
	},
	{
		id: "sample_tx_11",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_subscriptions",
		postedOn: "2026-09-26",
		description: "Netflix Standard Plan",
		merchant: "Netflix",
		memo: "Streaming subscription",
		amountCents: -2299, // -$22.99
		externalHash: "sample_hash_11",
		isRecurring: true,
	},
	{
		id: "sample_tx_12",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_transport",
		postedOn: "2026-09-24",
		description: "Chevron Fuel Station",
		merchant: "Chevron",
		memo: "Vehicle fuel fill-up",
		amountCents: -5420, // -$54.20
		externalHash: "sample_hash_12",
		isRecurring: false,
	},
	{
		id: "sample_tx_13",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_shopping",
		postedOn: "2026-09-22",
		description: "Target Store #1842",
		merchant: "Target",
		memo: "Home goods & supplies",
		amountCents: -11230, // -$112.30
		externalHash: "sample_hash_13",
		isRecurring: false,
	},
	{
		id: "sample_tx_14",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_health",
		postedOn: "2026-09-20",
		description: "Equinox Fitness Club",
		merchant: "Equinox",
		memo: "Monthly gym membership",
		amountCents: -28000, // -$280.00
		externalHash: "sample_hash_14",
		isRecurring: true,
	},
	{
		id: "sample_tx_15",
		accountId: "sample_acc_checking",
		categoryId: "sample_cat_utilities",
		postedOn: "2026-09-18",
		description: "PG&E Electric & Gas Utility",
		merchant: "Pacific Gas & Electric",
		memo: "September utility bill",
		amountCents: -12540, // -$125.40
		externalHash: "sample_hash_15",
		isRecurring: true,
	},
	{
		id: "sample_tx_16",
		accountId: "sample_acc_savings",
		categoryId: "sample_cat_income",
		postedOn: "2026-09-15",
		description: "High-Yield Monthly Interest",
		merchant: "Marcus by Goldman Sachs",
		memo: "Accrued savings interest",
		amountCents: 12480, // +$124.80
		externalHash: "sample_hash_16",
		isRecurring: true,
	},
	{
		id: "sample_tx_17",
		accountId: "sample_acc_checking",
		categoryId: "sample_cat_income",
		postedOn: "2026-09-15",
		description: "Direct Deposit · Payroll",
		merchant: "Tech Partners LLC",
		memo: "Bi-weekly salary deposit",
		amountCents: 425000, // +$4,250.00
		externalHash: "sample_hash_17",
		isRecurring: true,
	},
	{
		id: "sample_tx_18",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_subscriptions",
		postedOn: "2026-09-12",
		description: "Spotify Premium Family",
		merchant: "Spotify",
		memo: "Music streaming subscription",
		amountCents: -1999, // -$19.99
		externalHash: "sample_hash_18",
		isRecurring: true,
	},
	{
		id: "sample_tx_19",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_shopping",
		postedOn: "2026-09-10",
		description: "REI Co-op Outdoor Goods",
		merchant: "REI",
		memo: "Hiking shoes and gear",
		amountCents: -18550, // -$185.50
		externalHash: "sample_hash_19",
		isRecurring: false,
	},
	{
		id: "sample_tx_20",
		accountId: "sample_acc_checking",
		categoryId: "sample_cat_housing",
		postedOn: "2026-09-01",
		description: "Apartment Rent Payment",
		merchant: "Equitable Properties",
		memo: "September rent transfer",
		amountCents: -240000, // -$2,400.00
		externalHash: "sample_hash_20",
		isRecurring: true,
	},
	{
		id: "sample_tx_21",
		accountId: "sample_acc_checking",
		categoryId: "sample_cat_income",
		postedOn: "2026-09-01",
		description: "Direct Deposit · Payroll",
		merchant: "Tech Partners LLC",
		memo: "Bi-weekly salary deposit",
		amountCents: 425000, // +$4,250.00
		externalHash: "sample_hash_21",
		isRecurring: true,
	},
	{
		id: "sample_tx_22",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_dining",
		postedOn: "2026-08-28",
		description: "Marufuku Ramen",
		merchant: "Marufuku Ramen",
		memo: "Dinner with friends",
		amountCents: -6840, // -$68.40
		externalHash: "sample_hash_22",
		isRecurring: false,
	},
	{
		id: "sample_tx_23",
		accountId: "sample_acc_credit",
		categoryId: "sample_cat_utilities",
		postedOn: "2026-08-25",
		description: "Sonic Fiber Internet 1Gbps",
		merchant: "Sonic Telecom",
		memo: "Home internet connection",
		amountCents: -7000, // -$70.00
		externalHash: "sample_hash_23",
		isRecurring: true,
	},
	{
		id: "sample_tx_24",
		accountId: "sample_acc_invest",
		categoryId: "sample_cat_income",
		postedOn: "2026-08-20",
		description: "Vanguard Total Stock Market Dividend",
		merchant: "Fidelity Investments",
		memo: "Quarterly portfolio dividend",
		amountCents: 34000, // +$340.00
		externalHash: "sample_hash_24",
		isRecurring: true,
	},
];

/**
 * Checks whether sample data currently exists in the SQLite database.
 */
export async function hasSampleData(): Promise<boolean> {
	try {
		const existingSampleAccounts = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(like(accounts.id, "sample_%"));
		return existingSampleAccounts.length > 0;
	} catch {
		return false;
	}
}

/**
 * Seeds sample categories, accounts, balance snapshots, and transactions.
 * If sample data or user accounts already exist and options.force is not set, returns early.
 */
export async function seedSampleData(options?: { force?: boolean }): Promise<{
	seeded: boolean;
	accountCount: number;
	transactionCount: number;
}> {
	// If sample data exists, remove existing sample records first when force is specified
	if (options?.force) {
		await clearSampleData();
	} else {
		const isPresent = await hasSampleData();
		if (isPresent) {
			return {
				seeded: false,
				accountCount: SAMPLE_ACCOUNTS.length,
				transactionCount: SAMPLE_TRANSACTIONS.length,
			};
		}
	}

	// 1. Insert sample categories
	for (const cat of SAMPLE_CATEGORIES) {
		await db
			.insert(categories)
			.values({
				id: cat.id,
				name: cat.name,
				kind: cat.kind,
				icon: cat.icon,
				color: cat.color,
				hidden: false,
			})
			.onConflictDoNothing();
	}

	// 2. Insert sample accounts
	for (const acc of SAMPLE_ACCOUNTS) {
		await db
			.insert(accounts)
			.values({
				id: acc.id,
				name: acc.name,
				type: acc.type,
				institutionName: acc.institutionName,
				currency: acc.currency,
				last4: acc.last4,
				includeInNetWorth: acc.includeInNetWorth,
				archived: acc.archived,
			})
			.onConflictDoNothing();
	}

	// 3. Insert initial balance snapshots
	const todayStr = new Date().toISOString().slice(0, 10);
	for (const acc of SAMPLE_ACCOUNTS) {
		await db
			.insert(accountBalanceSnapshots)
			.values({
				id: `sample_snap_${acc.id}`,
				accountId: acc.id,
				snapshotOn: todayStr,
				balanceCents: acc.initialBalanceCents,
				source: "sample",
			})
			.onConflictDoNothing();
	}

	// 4. Insert sample transactions
	for (const tx of SAMPLE_TRANSACTIONS) {
		await db
			.insert(transactions)
			.values({
				id: tx.id,
				accountId: tx.accountId,
				categoryId: tx.categoryId,
				postedOn: tx.postedOn,
				description: tx.description,
				merchant: tx.merchant,
				memo: tx.memo,
				amountCents: tx.amountCents,
				currency: "USD",
				externalHash: tx.externalHash,
				isRecurring: tx.isRecurring,
			})
			.onConflictDoNothing();
	}

	return {
		seeded: true,
		accountCount: SAMPLE_ACCOUNTS.length,
		transactionCount: SAMPLE_TRANSACTIONS.length,
	};
}

/**
 * Removes all sample accounts, transactions, snapshots, and categories from the SQLite database.
 */
export async function clearSampleData(): Promise<{ cleared: boolean }> {
	try {
		// Foreign keys will cascade delete snapshots and transactions when sample accounts are removed
		await db.delete(transactions).where(like(transactions.id, "sample_%"));

		await db
			.delete(accountBalanceSnapshots)
			.where(like(accountBalanceSnapshots.id, "sample_%"));

		await db.delete(accounts).where(like(accounts.id, "sample_%"));

		await db.delete(categories).where(like(categories.id, "sample_%"));

		return { cleared: true };
	} catch (error) {
		console.error("Failed to clear sample data:", error);
		return { cleared: false };
	}
}
