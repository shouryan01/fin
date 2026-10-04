import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts")({
	component: AccountsPage,
});

function AccountsPage() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view your financial accounts.
				</p>
			</div>
		</div>
	);
}
