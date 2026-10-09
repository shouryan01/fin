import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { desc } from "drizzle-orm";
import {
	ArrowDownRight,
	ArrowUpRight,
	DollarSign,
	Inbox,
	Loader2,
	Plus,
	Search,
	Sparkles,
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
import { Input } from "#/components/ui/input";
import {
	accounts,
	categories,
	db,
	seedSampleData,
	transactions,
	useDatabase,
} from "#/db";
import { useOnboardingSettings } from "#/lib/onboarding";

export const Route = createFileRoute("/transactions")({
	component: TransactionsPage,
});

function formatCurrency(cents: number): string {
	const dollars = Math.abs(cents) / 100;
	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(dollars);
	return cents < 0 ? `-${formatted}` : `+${formatted}`;
}

function formatDate(dateStr: string): string {
	try {
		const [year, month, day] = dateStr.split("-").map(Number);
		const d = new Date(year, month - 1, day);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return dateStr;
	}
}

function TransactionsPage() {
	const { isReady } = useDatabase();
	const queryClient = useQueryClient();
	const { setSampleData } = useOnboardingSettings();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isSeeding, setIsSeeding] = React.useState(false);

	const { data: transactionList = [], isLoading } = useQuery({
		queryKey: ["transactions"],
		queryFn: async () => {
			const txs = await db
				.select()
				.from(transactions)
				.orderBy(desc(transactions.postedOn));
			const accs = await db.select().from(accounts);
			const cats = await db.select().from(categories);

			const accMap = new Map(accs.map((a) => [a.id, a]));
			const catMap = new Map(cats.map((c) => [c.id, c]));

			return txs.map((t) => ({
				...t,
				account: accMap.get(t.accountId),
				category: t.categoryId ? catMap.get(t.categoryId) : undefined,
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

	const filteredTransactions = React.useMemo(() => {
		if (!searchQuery.trim()) return transactionList;
		const q = searchQuery.toLowerCase();
		return transactionList.filter(
			(t) =>
				t.merchant.toLowerCase().includes(q) ||
				t.description.toLowerCase().includes(q) ||
				Boolean(t.memo?.toLowerCase().includes(q)) ||
				Boolean(t.category?.name.toLowerCase().includes(q)) ||
				Boolean(t.account?.name.toLowerCase().includes(q)),
		);
	}, [transactionList, searchQuery]);

	const totalInflow = transactionList
		.filter((t) => t.amountCents > 0)
		.reduce((sum, t) => sum + t.amountCents, 0);

	const totalOutflow = transactionList
		.filter((t) => t.amountCents < 0)
		.reduce((sum, t) => sum + Math.abs(t.amountCents), 0);

	return (
		<div className="flex flex-1 flex-col gap-6 p-6 lg:p-8 max-w-7xl mx-auto w-full">
			{/* Top greeting & actions bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
							Transactions
						</h1>
						<Badge variant="secondary">
							{transactionList.length}{" "}
							{transactionList.length === 1 ? "Record" : "Records"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Complete ledger of all your incoming and outgoing transactions.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					{transactionList.length === 0 && (
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
							Load Demo Data
						</Button>
					)}
					<Button size="sm">
						<Plus data-icon="inline-start" className="size-4" />
						Add Transaction
					</Button>
				</div>
			</div>

			{/* Metric Cards */}
			{transactionList.length > 0 && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card size="sm">
						<CardHeader>
							<CardDescription>Total Inflow</CardDescription>
							<CardAction>
								<ArrowUpRight className="size-4 text-primary" />
							</CardAction>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold tracking-tight text-primary">
								{formatCurrency(totalInflow)}
							</div>
						</CardContent>
					</Card>

					<Card size="sm">
						<CardHeader>
							<CardDescription>Total Outflow</CardDescription>
							<CardAction>
								<ArrowDownRight className="size-4 text-destructive" />
							</CardAction>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold tracking-tight text-foreground">
								-
								{formatCurrency(totalOutflow).replace("+", "").replace("-", "")}
							</div>
						</CardContent>
					</Card>

					<Card size="sm">
						<CardHeader>
							<CardDescription>Net Activity</CardDescription>
							<CardAction>
								<DollarSign className="size-4 text-muted-foreground" />
							</CardAction>
						</CardHeader>
						<CardContent>
							<div
								className={`text-2xl font-bold tracking-tight ${
									totalInflow - totalOutflow >= 0
										? "text-primary"
										: "text-destructive"
								}`}
							>
								{formatCurrency(totalInflow - totalOutflow)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Transactions Search & List */}
			<Card className="overflow-hidden">
				<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
					<div className="flex flex-col gap-0.5">
						<CardTitle className="text-base font-semibold">
							Ledger History
						</CardTitle>
						<CardDescription>
							Showing {filteredTransactions.length} of {transactionList.length}{" "}
							transactions
						</CardDescription>
					</div>

					{transactionList.length > 0 && (
						<div className="relative w-full sm:w-64">
							<Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
							<Input
								placeholder="Search merchant, memo, category..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-xs"
							/>
						</div>
					)}
				</CardHeader>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin mr-2" />
							Loading transactions from SQLite database...
						</div>
					) : transactionList.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
							<div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center border border-border/60">
								<Inbox className="size-6 text-muted-foreground" />
							</div>
							<div className="flex flex-col gap-1 max-w-sm">
								<span className="text-sm font-semibold text-foreground">
									No transactions recorded yet
								</span>
								<p className="text-xs text-muted-foreground">
									Load realistic sample transactions to explore categorization,
									inflow/outflow stats, and dashboard graphs.
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
									Load Demo Transactions
								</Button>
							</div>
						</div>
					) : filteredTransactions.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
							<span className="text-sm font-semibold text-foreground">
								No matching transactions
							</span>
							<p className="text-xs text-muted-foreground">
								Try adjusting your search query "{searchQuery}"
							</p>
						</div>
					) : (
						<div className="divide-y divide-border">
							{filteredTransactions.map((tx) => {
								const isPositive = tx.amountCents > 0;

								return (
									<div
										key={tx.id}
										className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-muted/30"
									>
										<div className="flex items-center gap-3.5 min-w-0">
											<div
												className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
													isPositive
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground"
												}`}
											>
												{isPositive ? (
													<ArrowUpRight className="size-4 text-primary" />
												) : (
													<ArrowDownRight className="size-4" />
												)}
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<span className="text-xs font-semibold text-foreground truncate">
														{tx.merchant || tx.description}
													</span>
													{tx.memo && (
														<span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
															· {tx.memo}
														</span>
													)}
												</div>
												<div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
													<span>{formatDate(tx.postedOn)}</span>
													{tx.account && (
														<>
															<span>•</span>
															<span>{tx.account.name}</span>
														</>
													)}
												</div>
											</div>
										</div>

										<div className="flex items-center gap-3 shrink-0">
											{tx.category && (
												<Badge
													variant="outline"
													className="text-[11px] font-normal hidden sm:inline-flex"
													style={{
														borderColor: `${tx.category.color}40`,
														backgroundColor: `${tx.category.color}15`,
														color: tx.category.color,
													}}
												>
													{tx.category.name}
												</Badge>
											)}
											<Badge
												variant={isPositive ? "secondary" : "outline"}
												className={`text-xs font-medium tabular-nums ${
													isPositive
														? "text-primary border-primary/20 bg-primary/10"
														: "text-foreground"
												}`}
											>
												{formatCurrency(tx.amountCents)}
											</Badge>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
