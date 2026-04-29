import { createFileRoute } from "@tanstack/react-router";
import TransactionsScreen from "#/screens/transactions";

export const Route = createFileRoute("/transactions")({
	component: TransactionsScreen,
});
