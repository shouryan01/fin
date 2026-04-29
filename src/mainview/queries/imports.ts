import { queryOptions } from "@tanstack/react-query";
import {
	importTransactions,
	listTransactionImports,
	undoTransactionImport,
} from "#/db";

export const transactionImportsQueryOptions = () =>
	queryOptions({
		queryKey: ["imports", "history"],
		queryFn: () => listTransactionImports(),
	});

export const importTransactionsMutation = {
	mutationKey: ["imports", "transactions"],
	mutationFn: importTransactions,
};

export const undoTransactionImportMutation = {
	mutationKey: ["imports", "undo"],
	mutationFn: undoTransactionImport,
};
