import { electroview } from "#/lib/electroview";
import type {
	AddAccountInput,
	AppSettings,
	CreateCategoryInput,
	DeleteCategoryInput,
	ImportTransactionsInput,
	TransactionFilters,
	TransactionImportRecord,
	UndoTransactionImportInput,
	UndoTransactionImportResult,
	UpdateAccountBalanceInput,
	UpdateAppSettingsInput,
	UpdateCategoryInput,
	UpdateTransactionInput,
} from "../../shared/finance";

function getRpc() {
	if (!electroview.rpc) {
		throw new Error("Electrobun RPC is not ready");
	}

	return electroview.rpc;
}

export async function getDashboard(period?: string, anchor?: string) {
	return getRpc().request.getDashboard({ period, anchor });
}

export async function listTransactions(filters: TransactionFilters) {
	return getRpc().request.listTransactions(filters);
}

export async function updateTransaction(input: UpdateTransactionInput) {
	return getRpc().request.updateTransaction(input);
}

export async function listAccounts() {
	return getRpc().request.listAccounts({});
}

export async function createAccount(input: AddAccountInput) {
	return getRpc().request.createAccount(input);
}

export async function updateAccountBalance(input: UpdateAccountBalanceInput) {
	return getRpc().request.updateAccountBalance(input);
}

export async function deleteAccount(input: { accountId: string }) {
	return getRpc().request.deleteAccount(input);
}

export async function listCategories() {
	return getRpc().request.listCategories({});
}

export async function createCategory(input: CreateCategoryInput) {
	return getRpc().request.createCategory(input);
}

export async function updateCategory(input: UpdateCategoryInput) {
	return getRpc().request.updateCategory(input);
}

export async function deleteCategory(input: DeleteCategoryInput) {
	return getRpc().request.deleteCategory(input);
}

export async function importTransactions(input: ImportTransactionsInput) {
	return getRpc().request.importTransactions(input);
}

export async function listTransactionImports(): Promise<
	TransactionImportRecord[]
> {
	return getRpc().request.listTransactionImports({});
}

export async function undoTransactionImport(
	input: UndoTransactionImportInput,
): Promise<UndoTransactionImportResult> {
	return getRpc().request.undoTransactionImport(input);
}

export async function getAppSettings(): Promise<AppSettings> {
	return getRpc().request.getAppSettings({});
}

export async function updateAppSettings(input: UpdateAppSettingsInput) {
	return getRpc().request.updateAppSettings(input);
}
