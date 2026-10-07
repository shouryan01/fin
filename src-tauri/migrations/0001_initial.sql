-- Initial database schema for Fin
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS `accounts` (
    `id` text PRIMARY KEY NOT NULL,
    `name` text NOT NULL,
    `type` text NOT NULL,
    `institution_name` text,
    `currency` text DEFAULT 'USD' NOT NULL,
    `last4` text,
    `include_in_net_worth` integer DEFAULT 1 NOT NULL,
    `archived` integer DEFAULT 0 NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE TABLE IF NOT EXISTS `categories` (
    `id` text PRIMARY KEY NOT NULL,
    `name` text NOT NULL,
    `kind` text NOT NULL,
    `color` text DEFAULT '#64748b' NOT NULL,
    `icon` text DEFAULT 'tag' NOT NULL,
    `hidden` integer DEFAULT 0 NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE TABLE IF NOT EXISTS `account_balance_snapshots` (
    `id` text PRIMARY KEY NOT NULL,
    `account_id` text NOT NULL,
    `snapshot_on` text NOT NULL,
    `balance_cents` integer NOT NULL,
    `source` text DEFAULT 'manual' NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `account_snapshot_unique_idx` ON `account_balance_snapshots` (`account_id`, `snapshot_on`);

CREATE TABLE IF NOT EXISTS `transaction_imports` (
    `id` text PRIMARY KEY NOT NULL,
    `account_id` text NOT NULL,
    `source_name` text NOT NULL,
    `row_count` integer DEFAULT 0 NOT NULL,
    `imported_count` integer DEFAULT 0 NOT NULL,
    `duplicate_count` integer DEFAULT 0 NOT NULL,
    `skipped_count` integer DEFAULT 0 NOT NULL,
    `created_snapshot_count` integer DEFAULT 0 NOT NULL,
    `undo_version` integer DEFAULT 0 NOT NULL,
    `mapping_json` text,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `transaction_import_mappings` (
    `id` text PRIMARY KEY NOT NULL,
    `account_id` text NOT NULL,
    `source_name` text NOT NULL,
    `mapping_json` text NOT NULL,
    `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `transaction_rules` (
    `id` text PRIMARY KEY NOT NULL,
    `merchant_pattern` text NOT NULL,
    `category_id` text,
    `priority` integer DEFAULT 0 NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` text PRIMARY KEY NOT NULL,
    `account_id` text NOT NULL,
    `import_id` text,
    `posted_on` text NOT NULL,
    `description` text NOT NULL,
    `merchant` text NOT NULL,
    `memo` text,
    `amount_cents` integer NOT NULL,
    `currency` text DEFAULT 'USD' NOT NULL,
    `category_id` text,
    `external_hash` text NOT NULL,
    `raw_json` text,
    `recurring_override` integer,
    `is_recurring` integer DEFAULT 0 NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`import_id`) REFERENCES `transaction_imports`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `transactions_external_hash_idx` ON `transactions` (`external_hash`);
