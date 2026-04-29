import {
	ApplicationMenu,
	BrowserView,
	BrowserWindow,
	Screen,
	Updater,
} from "electrobun/bun";
import type {
	AddAccountInput,
	CreateCategoryInput,
	DeleteAccountInput,
	DeleteCategoryInput,
	ImportTransactionsInput,
	TransactionFilters,
	UndoTransactionImportInput,
	UpdateAccountBalanceInput,
	UpdateAppSettingsInput,
	UpdateCategoryInput,
	UpdateTransactionInput,
} from "../shared/finance";
import type { FinanceRPC } from "../shared/rpc";
import {
	createAccount,
	createCategory,
	deleteAccount,
	deleteCategory,
	getAppSettings,
	getDashboard,
	importTransactions,
	initializeFinanceStore,
	listAccounts,
	listCategories,
	listTransactionImports,
	listTransactions,
	undoTransactionImport,
	updateAccountBalance,
	updateAppSettings,
	updateCategory,
	updateTransaction,
} from "./finance-service";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

// Create the main application window
initializeFinanceStore();

const financeRpc = BrowserView.defineRPC<FinanceRPC>({
	maxRequestTime: 15000,
	handlers: {
		requests: {
			getDashboard: (params: { period?: string; anchor?: string }) =>
				getDashboard(params),
			listTransactions: (filters: TransactionFilters) =>
				listTransactions(filters),
			updateTransaction: (input: UpdateTransactionInput) =>
				updateTransaction(input),
			listAccounts: () => listAccounts(),
			createAccount: (input: AddAccountInput) => createAccount(input),
			updateAccountBalance: (input: UpdateAccountBalanceInput) =>
				updateAccountBalance(input),
			deleteAccount: (input: DeleteAccountInput) => {
				deleteAccount(input);
				return {};
			},
			listCategories: () => listCategories(),
			createCategory: (input: CreateCategoryInput) => createCategory(input),
			updateCategory: (input: UpdateCategoryInput) => updateCategory(input),
			deleteCategory: (input: DeleteCategoryInput) => {
				deleteCategory(input);
				return {};
			},
			importTransactions: (input: ImportTransactionsInput) =>
				importTransactions(input),
			listTransactionImports: () => listTransactionImports(),
			undoTransactionImport: (input: UndoTransactionImportInput) =>
				undoTransactionImport(input),
			getAppSettings: () => getAppSettings(),
			updateAppSettings: (input: UpdateAppSettingsInput) =>
				updateAppSettings(input),
		},
		messages: {},
	},
});

const url = await getMainViewUrl();
const primaryDisplay = Screen.getPrimaryDisplay();
const initialFrame = {
	x: primaryDisplay.workArea.x,
	y: primaryDisplay.workArea.y,
	width: primaryDisplay.workArea.width,
	height: primaryDisplay.workArea.height,
};

ApplicationMenu.setApplicationMenu([
	{
		label: "fin",
		submenu: [
			{ label: "About", role: "about" },
			{ type: "separator" },
			{ label: "Hide fin", role: "hide" },
			{ label: "Hide Others", role: "hideOthers" },
			{ label: "Show All", role: "unhide" },
			{ type: "separator" },
			{ label: "Minimize", role: "minimize", accelerator: "m" },
			{ label: "Quit", role: "quit", accelerator: "q" },
		],
	},
	{
		label: "Edit",
		submenu: [
			{ label: "Undo", role: "undo" },
			{ label: "Redo", role: "redo" },
			{ type: "separator" },
			{ label: "Cut", role: "cut" },
			{ label: "Copy", role: "copy" },
			{ label: "Paste", role: "paste" },
			{ label: "Select All", role: "selectAll" },
		],
	},
	{
		label: "Window",
		submenu: [
			{ label: "Minimize", role: "minimize" },
			{ label: "Zoom", role: "zoom" },
			{ type: "separator" },
			{ label: "Bring All to Front", role: "front" },
		],
	},
]);

const mainWindow = new BrowserWindow({
	title: "fin",
	url,
	rpc: financeRpc,
	frame: initialFrame,
	styleMask: {
		Borderless: true,
		Titled: false,
		Closable: true,
		Miniaturizable: true,
		Resizable: true,
		UnifiedTitleAndToolbar: true,
		FullScreen: false,
	},
	titleBarStyle: "hiddenInset",
});

void mainWindow;

console.log("React Tailwind Vite app started!");
