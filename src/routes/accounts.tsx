import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	CreditCard,
	DollarSign,
	Landmark,
	Loader2,
	PiggyBank,
	Plus,
	Sparkles,
	Wallet,
} from "lucide-react";
import * as React from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	accountBalanceSnapshots,
	accounts,
	db,
	seedSampleData,
	useDatabase,
} from "#/db";
import { useOnboardingSettings } from "#/lib/onboarding";

export const Route = createFileRoute("/accounts")({
	component: AccountsPage,
});

function formatCurrency(cents: number): string {
	const dollars = cents / 100;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(dollars);
}

function getAccountIcon(type: string) {
	switch (type.toLowerCase()) {
		case "credit":
			return CreditCard;
		case "investment":
			return PiggyBank;
		default:
			return Landmark;
	}
}

function AccountsPage() {
	const { isReady } = useDatabase();
	const queryClient = useQueryClient();
	const { setSampleData } = useOnboardingSettings();
	const [isSeeding, setIsSeeding] = React.useState(false);

	const { data: accountList = [], isLoading } = useQuery({
		queryKey: ["accounts"],
		queryFn: async () => {
			const accs = await db.select().from(accounts);
			const snapshots = await db.select().from(accountBalanceSnapshots);
			const snapshotMap = new Map<string, number>();
			for (const s of snapshots) {
				snapshotMap.set(s.accountId, s.balanceCents);
			}
			return accs.map((a) => ({
				...a,
				balanceCents: snapshotMap.get(a.id) ?? 0,
			}));
		},
		enabled: isReady,
	});

	const handleSeedSampleData = async () => {
		setIsSeeding(true);
		setSampleData(true);
		try {
			await seedSampleData({ force: true });
			await queryClient.invalidateQueries();
		} catch (err) {
			console.error("Failed to seed sample data:", err);
		} finally {
			setIsSeeding(false);
		}
	};

	const totalBalance = accountList
		.filter((a) => a.includeInNetWorth && !a.archived)
		.reduce((acc, a) => acc + a.balanceCents, 0);

	return (
		<div className="flex flex-1 flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
							Accounts
						</h1>
						<Badge variant="secondary">
							{accountList.length}{" "}
							{accountList.length === 1 ? "Account" : "Accounts"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Manage and view your bank accounts, credit cards, and investments.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					{accountList.length === 0 && (
						<Button
							variant="outline"
							size="sm"
							disabled={isSeeding}
							onClick={handleSeedSampleData}
							className="cursor-pointer"
						>
							{isSeeding ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<Sparkles data-icon="inline-start" className="size-3.5" />
							)}
							Load Sample Data
						</Button>
					)}
					<Button size="sm">
						<Plus data-icon="inline-start" className="size-4" />
						Add Account
					</Button>
				</div>
			</div>

			{/* Total Net Worth Overview Card */}
			{accountList.length > 0 && (
				<Card size="sm" className="bg-muted/30">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardDescription>Total Account Balance (Net Worth)</CardDescription>
						<CardAction>
							<DollarSign className="size-4 text-muted-foreground" />
						</CardAction>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold tracking-tight text-foreground">
							{formatCurrency(totalBalance)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Accounts Grid */}
			{isLoading ? (
				<div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
					<Loader2 className="size-4 animate-spin mr-2" />
					Loading accounts from SQLite database...
				</div>
			) : accountList.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center gap-3">
					<div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center border border-border/60">
						<Wallet className="size-6 text-muted-foreground" />
					</div>
					<div className="flex flex-col gap-1 max-w-sm">
						<span className="text-sm font-semibold text-foreground">
							No accounts found
						</span>
						<p className="text-xs text-muted-foreground">
							Load sample data to test the application with realistic balances,
							or create your first manual account.
						</p>
					</div>
					<div className="flex items-center gap-2 mt-2">
						<Button
							size="sm"
							onClick={handleSeedSampleData}
							disabled={isSeeding}
							className="cursor-pointer"
						>
							{isSeeding ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<Sparkles data-icon="inline-start" className="size-3.5" />
							)}
							Load Demo Accounts
						</Button>
					</div>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{accountList.map((account) => {
						const Icon = getAccountIcon(account.type);
						const isNegative = account.balanceCents < 0;

						return (
							<Card key={account.id} className="relative overflow-hidden">
								<CardHeader className="flex flex-row items-start justify-between pb-2">
									<div className="flex items-center gap-3">
										<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
											<Icon className="size-5" />
										</div>
										<div>
											<CardTitle className="text-base font-semibold leading-none">
												{account.name}
											</CardTitle>
											<p className="text-xs text-muted-foreground mt-1">
												{account.institutionName || "Local Ledger"}
												{account.last4 ? ` · •••• ${account.last4}` : ""}
											</p>
										</div>
									</div>
									<Badge variant="outline" className="text-[11px] capitalize">
										{account.type}
									</Badge>
								</CardHeader>
								<CardContent>
									<div className="pt-2">
										<span className="text-xs text-muted-foreground block mb-0.5">
											Current Balance
										</span>
										<div
											className={`text-2xl font-bold tracking-tight ${
												isNegative ? "text-destructive" : "text-foreground"
											}`}
										>
											{formatCurrency(account.balanceCents)}
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
