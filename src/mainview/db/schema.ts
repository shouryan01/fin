import { sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
	id: text().primaryKey(),
	name: text().notNull(),
	type: text().notNull(),
	institutionName: text("institution_name"),
	currency: text().notNull().default("USD"),
	last4: text(),
	includeInNetWorth: integer("include_in_net_worth", { mode: "boolean" })
		.notNull()
		.default(true),
	archived: integer({ mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const categories = sqliteTable("categories", {
	id: text().primaryKey(),
	name: text().notNull(),
	kind: text().notNull(),
	icon: text().notNull(),
	hidden: integer({ mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const transactionImports = sqliteTable("transaction_imports", {
	id: text().primaryKey(),
	accountId: text("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),
	sourceName: text("source_name").notNull(),
	rowCount: integer("row_count").notNull().default(0),
	importedCount: integer("imported_count").notNull().default(0),
	duplicateCount: integer("duplicate_count").notNull().default(0),
	skippedCount: integer("skipped_count").notNull().default(0),
	createdSnapshotCount: integer("created_snapshot_count").notNull().default(0),
	undoVersion: integer("undo_version").notNull().default(0),
	mappingJson: text("mapping_json"),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const transactionImportMappings = sqliteTable(
	"transaction_import_mappings",
	{
		id: text().primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		sourceName: text("source_name").notNull(),
		mappingJson: text("mapping_json").notNull(),
		updatedAt: integer("updated_at", { mode: "number" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
);

export const transactionRules = sqliteTable("transaction_rules", {
	id: text().primaryKey(),
	merchantPattern: text("merchant_pattern").notNull(),
	categoryId: text("category_id").references(() => categories.id, {
		onDelete: "set null",
	}),
	priority: integer().notNull().default(0),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const transactions = sqliteTable(
	"transactions",
	{
		id: text().primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		importId: text("import_id").references(() => transactionImports.id, {
			onDelete: "set null",
		}),
		postedOn: text("posted_on").notNull(),
		description: text().notNull(),
		merchant: text().notNull(),
		memo: text(),
		amountCents: integer("amount_cents").notNull(),
		currency: text().notNull().default("USD"),
		categoryId: text("category_id").references(() => categories.id, {
			onDelete: "set null",
		}),
		externalHash: text("external_hash").notNull(),
		rawJson: text("raw_json"),
		recurringOverride: integer("recurring_override", { mode: "boolean" }),
		isRecurring: integer("is_recurring", { mode: "boolean" })
			.notNull()
			.default(false),
		createdAt: integer("created_at", { mode: "number" })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "number" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => ({
		externalHashIdx: uniqueIndex("transactions_external_hash_idx").on(
			table.externalHash,
		),
	}),
);

export const accountBalanceSnapshots = sqliteTable(
	"account_balance_snapshots",
	{
		id: text().primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		snapshotOn: text("snapshot_on").notNull(),
		balanceCents: integer("balance_cents").notNull(),
		source: text().notNull().default("manual"),
		createdAt: integer("created_at", { mode: "number" })
			.notNull()
			.default(sql`(unixepoch())`),
	},
	(table) => ({
		accountSnapshotUnique: uniqueIndex("account_snapshot_unique_idx").on(
			table.accountId,
			table.snapshotOn,
		),
	}),
);
