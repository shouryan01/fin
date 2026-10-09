-- Migration 0002: Add foreign key and lookup indexes
CREATE INDEX IF NOT EXISTS `transaction_imports_account_id_idx` ON `transaction_imports` (`account_id`);
CREATE INDEX IF NOT EXISTS `transaction_import_mappings_account_id_idx` ON `transaction_import_mappings` (`account_id`);
CREATE INDEX IF NOT EXISTS `transaction_rules_category_id_idx` ON `transaction_rules` (`category_id`);
CREATE INDEX IF NOT EXISTS `transactions_account_id_idx` ON `transactions` (`account_id`);
CREATE INDEX IF NOT EXISTS `transactions_category_id_idx` ON `transactions` (`category_id`);
CREATE INDEX IF NOT EXISTS `transactions_import_id_idx` ON `transactions` (`import_id`);
CREATE INDEX IF NOT EXISTS `transactions_posted_on_idx` ON `transactions` (`posted_on`);
