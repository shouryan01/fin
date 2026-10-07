import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Activity,
	ArrowDownRight,
	ArrowUpRight,
	CreditCard,
	DollarSign,
	Eye,
	FileSpreadsheet,
	Inbox,
	Maximize2,
	Move,
	SlidersHorizontal,
	Sparkles,
	Wallet,
} from "lucide-react";
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
import { useOnboardingSettings } from "#/lib/onboarding";

export const Route = createFileRoute("/")({ component: Home });

const transactions = [
	{
		name: "Apple Developer Program",
		date: "Today, 2:15 PM",
		category: "Subscriptions",
		amount: "-$99.00",
		positive: false,
	},
	{
		name: "Client Payment · Invoice #1042",
		date: "Yesterday, 4:30 PM",
		category: "Income",
		amount: "+$4,800.00",
		positive: true,
	},
	{
		name: "AWS Cloud Infrastructure",
		date: "Oct 1, 2026",
		category: "Servers",
		amount: "-$342.18",
		positive: false,
	},
	{
		name: "Stripe Payout",
		date: "Sep 28, 2026",
		category: "Income",
		amount: "+$6,250.00",
		positive: true,
	},
];

function Home() {
	const { settings } = useOnboardingSettings();
	const hasSampleData = settings.loadSampleData;

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
						{!hasSampleData && (
							<Badge variant="outline" className="text-xs font-normal">
								Clean Ledger
							</Badge>
						)}
					</div>
					<p className="text-sm text-muted-foreground">
						{hasSampleData
							? "Welcome back to your financial command center."
							: "Your clean ledger is ready for new accounts and transactions."}
					</p>
				</div>

				<div className="flex items-center gap-2.5">
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
					<Button size="sm">
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
							{hasSampleData ? "$48,290.40" : "$0.00"}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{hasSampleData ? (
								<>
									<ArrowUpRight className="size-3.5 text-primary" />
									<span className="font-medium text-foreground">+12.4%</span>
									<span>from last month</span>
								</>
							) : (
								<span>No transactions yet</span>
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
							{hasSampleData ? "$14,250.00" : "$0.00"}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{hasSampleData ? (
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
							{hasSampleData ? "$6,840.18" : "$0.00"}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							{hasSampleData ? (
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
						<CardDescription>Active Cards</CardDescription>
						<CardAction>
							<CreditCard className="size-4 text-muted-foreground" />
						</CardAction>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						<div className="text-2xl font-bold tracking-tight text-foreground">
							{hasSampleData ? "4 Accounts" : "0 Accounts"}
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<Activity className="size-3.5 text-primary" />
							<span>{hasSampleData ? "All synchronized" : "Ledger empty"}</span>
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
						<Button variant="ghost" size="sm">
							View All
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="p-0">
					{hasSampleData ? (
						<div className="divide-y divide-border">
							{transactions.map((item) => (
								<div
									key={item.name}
									className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-muted/40"
								>
									<div className="flex items-center gap-3">
										<div className="size-8 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
											{item.positive ? (
												<ArrowUpRight className="size-4 text-primary" />
											) : (
												<ArrowDownRight className="size-4" />
											)}
										</div>
										<div>
											<div className="text-xs font-medium text-foreground">
												{item.name}
											</div>
											<div className="text-[11px] text-muted-foreground">
												{item.date} · {item.category}
											</div>
										</div>
									</div>
									<Badge variant={item.positive ? "secondary" : "outline"}>
										{item.amount}
									</Badge>
								</div>
							))}
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
									sample data from settings to explore the dashboard with
									realistic numbers.
								</p>
							</div>
							<div className="flex items-center gap-2 mt-2">
								<Button size="sm" variant="outline" className="cursor-pointer">
									<FileSpreadsheet
										data-icon="inline-start"
										className="size-3.5"
									/>
									Import CSV
								</Button>
								<Button
									size="sm"
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
