import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions")({
	component: TransactionsPage,
});

function TransactionsPage() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
				<p className="text-muted-foreground text-sm">
					View and manage all your transactions.
				</p>
			</div>
		</div>
	);
}
