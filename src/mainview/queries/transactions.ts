import { queryOptions } from "@tanstack/react-query";
import { listTransactions, updateTransaction } from "#/db";
import type { TransactionFilters } from "../../shared/finance";

export const transactionsQueryOptions = (filters: TransactionFilters) =>
	queryOptions({
		queryKey: ["transactions", filters],
		queryFn: () => listTransactions(filters),
		placeholderData: (previousData) => previousData,
	});

export const updateTransactionMutation = {
	mutationKey: ["transactions", "update"],
	mutationFn: updateTransaction,
};
