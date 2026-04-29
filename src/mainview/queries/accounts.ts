import { queryOptions } from "@tanstack/react-query";
import {
	createAccount,
	deleteAccount,
	listAccounts,
	updateAccountBalance,
} from "#/db";

export const accountsQueryOptions = () =>
	queryOptions({
		queryKey: ["accounts"],
		queryFn: () => listAccounts(),
	});

export const createAccountMutation = {
	mutationKey: ["accounts", "create"],
	mutationFn: createAccount,
};

export const updateAccountBalanceMutation = {
	mutationKey: ["accounts", "update-balance"],
	mutationFn: updateAccountBalance,
};

export const deleteAccountMutation = {
	mutationKey: ["accounts", "delete"],
	mutationFn: deleteAccount,
};
