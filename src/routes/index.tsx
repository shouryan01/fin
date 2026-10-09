import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { desc } from "drizzle-orm";
import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	CreditCard,
	DollarSign,
	Eye,
	FileSpreadsheet,
	Inbox,
	Loader2,
	Maximize2,
	Move,
	SlidersHorizontal,
	Sparkles,
	Wallet,
} from "lucide-react";
import * as React from "react";
import { triggerSplashPreview } from "#/components/splash-screen";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "#/components/ui/alert";
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
	categories,
	db,
	seedSampleData,
	transactions,
	useDatabase,
} from "#/db";
import { useOnboardingSettings } from "#/lib/onboarding";

export const Route = createFileRoute("/")({ component: Home });

function formatCurrency(cents: number): string {
	const dollars = Math.abs(cents) / 100;
	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(dollars);
	return cents < 0 ? `-${formatted}` : formatted;
}

function formatDate(dateStr: string): string {
	try {
		const [year, month, day] = dateStr.split("-").map(Number);
		const d = new Date(year, month - 1, day);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	} catch {
		return dateStr;
	}
}

function Home() {
	const { isReady } = useDatabase();
	const queryClient = useQueryClient();
	const { setSampleData } = useOnboardingSettings();
	const [isSeeding, setIsSeeding] = React.useState(false);

	const { data: dashboardData, isLoading } = useQuery({
		queryKey: ["dashboard-summary"],
		queryFn: async () => {
			const accList = await db.select().from(accounts);
			const snapshots = await db.select().from(accountBalanceSnapshots);
			const txList = await db
				.select()
				.from(transactions)
				.orderBy(desc(transactions.postedOn));
			const catList = await db.select().from(categories);

			const snapshotMap = new Map<string, number>();
			for (const s of snapshots) {
				snapshotMap.set(s.accountId, s.balanceCents);
			}

			const catMap = new Map(catList.map((c) => [c.id, c]));

			const totalBalanceCents = accList
				.filter((a) => a.includeInNetWorth && !a.archived)
				.reduce((acc, a) => acc + (snapshotMap.get(a.id) ?? 0), 0);

			const monthlyInflowCents = txList
				.filter((t) => t.amountCents > 0)
				.reduce((acc, t) => acc + t.amountCents, 0);

			const monthlyOutflowCents = txList
				.filter((t) => t.amountCents < 0)
				.reduce((acc, t) => acc + Math.abs(t.amountCents), 0);

			return {
				accounts: accList,
				totalBalanceCents,
				monthlyInflowCents,
				monthlyOutflowCents,
				recentTransactions: txList.slice(0, 6).map((t) => ({
					...t,
					category: t.categoryId ? catMap.get(t.categoryId) : undefined,
				})),
			};
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

	const hasAccounts = (dashboardData?.accounts.length ?? 0) > 0;
	const recentTransactions = dashboardData?.recentTransactions ?? [];

	return (
		<div className="flex-1 p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
			{/* Top greeting & actions bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
							Dashboard
						</h1>
						<Badge variant="secondary">
							<Sparkles data-icon="inline-start" />
							Desktop v0.1
						</Badge>
						{!hasAccounts && (
							<Badge variant="outline" className="text-xs font-normal">
								Clean Ledger
							</Badge>
						)}
					</div>
					<p className="text-sm text-muted-foreground">
						{hasAccounts
							? "Welcome back to your financial command center."
							: "Your clean ledger is ready for new accounts and transactions."}
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					{!hasAccounts && (
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
					<Button
						variant="outline"
						size="sm"
						onClick={() => triggerSplashPreview()}
						title="Preview splash screen animation"
					>
						<Eye data-icon="inline-start" />
						Preview Splash
					</Button>
					<Button variant="outline" size="sm">
						<SlidersHorizontal data-icon="inline-start" />
						Filter
					</Button>
					<Button size="sm" render={<Link to="/accounts" />}>
						<Wallet data-icon="inline-start" />
						Add Account
					</Button>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card size="sm">
					<CardHeader>
						<CardDescription>Total Balance</CardDescription>
						<CardAction>
							<DollarSign className="size-4 text-muted-foreground" />
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						<div className="text-2xl font-bold tracking-tight text-foreground">
							{isLoading ? (
								<span className="text-muted-foreground text-lg">
									Loading...
								</span>
							) : (
								formatCurrency(dashboardData?.totalBalanceCents ?? 0)
							)}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{hasAccounts ? (
								<>
									<ArrowUpRight className="size-3.5 text-primary" />
									<span className="font-medium text-foreground">+12.4%</span>
									<span>from last month</span>
								</>
							) : (
								<span>No accounts yet</span>
							)}
						</div>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardDescription>Monthly Inflow</CardDescription>
						<CardAction>
							<ArrowUpRight className="size-4 text-muted-foreground" />
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						<div className="text-2xl font-bold tracking-tight text-foreground">
							{isLoading ? (
								<span className="text-muted-foreground text-lg">
									Loading...
								</span>
							) : (
								formatCurrency(dashboardData?.monthlyInflowCents ?? 0)
							)}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{hasAccounts ? (
								<>
									<ArrowUpRight className="size-3.5 text-primary" />
									<span className="font-medium text-foreground">+4.2%</span>
									<span>projected</span>
								</>
							) : (
								<span>$0.00 this month</span>
							)}
						</div>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardDescription>Monthly Outflow</CardDescription>
						<CardAction>
							<ArrowDownRight className="size-4 text-muted-foreground" />
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						<div className="text-2xl font-bold tracking-tight text-foreground">
							{isLoading ? (
								<span className="text-muted-foreground text-lg">
									Loading...
								</span>
							) : (
								formatCurrency(dashboardData?.monthlyOutflowCents ?? 0)
							)}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{hasAccounts ? (
								<>
									<ArrowDownRight className="size-3.5 text-destructive" />
									<span className="font-medium text-foreground">-2.1%</span>
									<span>lower than average</span>
								</>
							) : (
								<span>$0.00 spent</span>
							)}
						</div>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardDescription>Active Accounts</CardDescription>
						<CardAction>
							<CreditCard className="size-4 text-muted-foreground" />
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						<div className="text-2xl font-bold tracking-tight text-foreground">
							{isLoading ? (
								<span className="text-muted-foreground text-lg">
									Loading...
								</span>
							) : (
								`${dashboardData?.accounts.length ?? 0} Accounts`
							)}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<Activity className="size-3.5 text-primary" />
							<span>{hasAccounts ? "All synchronized" : "Ledger empty"}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Window Customization Capabilities Banner */}
			<Alert>
				<Sparkles className="text-primary" />
				<AlertTitle>Modern Frameless Desktop Window Active</AlertTitle>
				<AlertDescription>
					Configured with Tauri v2 macOS Overlay titlebar, custom drag regions,
					and responsive window controls. Try dragging the top bar or
					double-clicking anywhere along the header to maximize/restore.
				</AlertDescription>
				<AlertAction className="hidden sm:flex items-center gap-2">
					<Badge variant="outline">
						<Move data-icon="inline-start" />
						Draggable Header
					</Badge>
					<Badge variant="outline">
						<Maximize2 data-icon="inline-start" />
						2x Click Zoom
					</Badge>
				</AlertAction>
			</Alert>

			{/* Recent Activity Section */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div className="flex flex-col gap-1">
						<CardTitle>Recent Transactions</CardTitle>
						<CardDescription>
							Real-time balance adjustments across linked accounts
						</CardDescription>
					</div>
					<CardAction>
						<Button
							variant="ghost"
							size="sm"
							render={<Link to="/transactions" />}
						>
							View All
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="p-0">
					{hasAccounts && recentTransactions.length > 0 ? (
						<div className="divide-y divide-border">
							{recentTransactions.map((item) => {
								const isPositive = item.amountCents > 0;

								return (
									<div
										key={item.id}
										className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-muted/40"
									>
										<div className="flex items-center gap-3">
											<div
												className={`size-8 rounded-lg flex items-center justify-center ${
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
											<div>
												<div className="text-xs font-medium text-foreground">
													{item.merchant || item.description}
												</div>
												<div className="text-[11px] text-muted-foreground">
													{formatDate(item.postedOn)}
													{item.category ? ` · ${item.category.name}` : ""}
												</div>
											</div>
										</div>
										<Badge
											variant={isPositive ? "secondary" : "outline"}
											className={`text-xs font-medium tabular-nums ${
												isPositive
													? "text-primary border-primary/20 bg-primary/10"
													: ""
											}`}
										>
											{formatCurrency(item.amountCents)}
										</Badge>
									</div>
								);
							})}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
							<div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center border border-border/60">
								<Inbox className="size-6 text-muted-foreground" />
							</div>
							<div className="flex flex-col gap-1 max-w-sm">
								<span className="text-sm font-semibold text-foreground">
									No transactions recorded yet
								</span>
								<p className="text-xs text-muted-foreground">
									Download a CSV from your bank and drag it into fin, or load
									demo data to explore the dashboard with realistic numbers.
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
									Load Demo Data
								</Button>
								<Button size="sm" variant="outline" className="cursor-pointer">
									<FileSpreadsheet
										data-icon="inline-start"
										className="size-3.5"
									/>
									Import CSV
								</Button>
								<Button
									size="sm"
									variant="ghost"
									render={<Link to="/settings" />}
									className="cursor-pointer"
								>
									Open Settings
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
