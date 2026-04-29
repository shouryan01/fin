import type { ElectrobunRPCSchema, RPCSchema } from "electrobun/bun";
import type {
	AccountSummary,
	AddAccountInput,
	AppSettings,
	CategoryRecord,
	CreateCategoryInput,
	DashboardData,
	DeleteAccountInput,
	DeleteCategoryInput,
	ImportTransactionsInput,
	ImportTransactionsResult,
	TransactionFilters,
	TransactionImportRecord,
	TransactionListPage,
	TransactionRecord,
	UndoTransactionImportInput,
	UndoTransactionImportResult,
	UpdateAccountBalanceInput,
	UpdateAppSettingsInput,
	UpdateCategoryInput,
	UpdateTransactionInput,
} from "./finance";

type EmptyRPCObject = Record<string, never>;

export interface FinanceRPC extends ElectrobunRPCSchema {
	bun: RPCSchema<{
		requests: {
			getDashboard: {
				params: {
					period?: string;
					anchor?: string;
				};
				response: DashboardData;
			};
			listTransactions: {
				params: TransactionFilters;
				response: TransactionListPage;
			};
			updateTransaction: {
				params: UpdateTransactionInput;
				response: TransactionRecord;
			};
			listAccounts: {
				params: Record<string, never>;
				response: AccountSummary[];
			};
			createAccount: {
				params: AddAccountInput;
				response: AccountSummary;
			};
			updateAccountBalance: {
				params: UpdateAccountBalanceInput;
				response: AccountSummary;
			};
			deleteAccount: {
				params: DeleteAccountInput;
				response: Record<string, never>;
			};
			listCategories: {
				params: Record<string, never>;
				response: CategoryRecord[];
			};
			createCategory: {
				params: CreateCategoryInput;
				response: CategoryRecord;
			};
			updateCategory: {
				params: UpdateCategoryInput;
				response: CategoryRecord;
			};
			deleteCategory: {
				params: DeleteCategoryInput;
				response: Record<string, never>;
			};
			importTransactions: {
				params: ImportTransactionsInput;
				response: ImportTransactionsResult;
			};
			listTransactionImports: {
				params: Record<string, never>;
				response: TransactionImportRecord[];
			};
			undoTransactionImport: {
				params: UndoTransactionImportInput;
				response: UndoTransactionImportResult;
			};
			getAppSettings: {
				params: Record<string, never>;
				response: AppSettings;
			};
			updateAppSettings: {
				params: UpdateAppSettingsInput;
				response: AppSettings;
			};
		};
		messages: EmptyRPCObject;
	}>;
	webview: RPCSchema<{
		requests: EmptyRPCObject;
		messages: EmptyRPCObject;
	}>;
}
