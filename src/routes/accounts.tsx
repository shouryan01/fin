import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { accounts, db, useDatabase } from "#/db";

export const Route = createFileRoute("/accounts")({
	component: AccountsPage,
});

function AccountsPage() {
	const { isReady } = useDatabase();

	const { data: accountList = [], isLoading } = useQuery({
		queryKey: ["accounts"],
		queryFn: async () => {
			return await db.select().from(accounts);
		},
		enabled: isReady,
	});

	return (
		<div className="flex flex-1 flex-col gap-4 p-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view your financial accounts.
				</p>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground text-sm">Loading accounts...</p>
			) : accountList.length === 0 ? (
				<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
					<p className="text-sm">
						No accounts found. Create or import your first account to get
						started.
					</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{accountList.map((account) => (
						<div key={account.id} className="rounded-lg border p-4 shadow-sm">
							<h3 className="font-semibold">{account.name}</h3>
							<p className="text-sm text-muted-foreground capitalize">
								{account.type}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
