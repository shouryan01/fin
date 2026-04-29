import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	accountsQueryOptions,
	createAccountMutation,
	deleteAccountMutation,
	updateAccountBalanceMutation,
} from "#/queries/accounts";
import type { AccountSummary, AccountType } from "../../shared/finance";

const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
	{ value: "checking", label: "Checking" },
	{ value: "savings", label: "Savings" },
	{ value: "cash", label: "Cash" },
	{ value: "investment", label: "Investment" },
	{ value: "credit", label: "Credit card" },
	{ value: "loan", label: "Loan" },
];

function accountCardTint(type: AccountType) {
	switch (type) {
		case "investment":
			return "bg-violet-500/10 border-violet-200/60 dark:border-violet-800/40";
		case "savings":
			return "bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-800/40";
		case "checking":
			return "bg-sky-500/10 border-sky-200/60 dark:border-sky-800/40";
		case "credit":
			return "bg-rose-500/10 border-rose-200/60 dark:border-rose-800/40";
		case "loan":
			return "bg-orange-500/10 border-orange-200/60 dark:border-orange-800/40";
		default:
			return "bg-muted/50 border-border";
	}
}

function balanceInputValue(cents: number) {
	return (cents / 100).toFixed(2);
}

function parseBalanceDraft(value: string | undefined) {
	if (!value?.trim()) {
		return null;
	}
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return null;
	}
	return Math.round(parsed * 100);
}

export default function AccountsScreen() {
	const queryClient = useQueryClient();
	const accountsQuery = useQuery(accountsQueryOptions());
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [type, setType] = useState<AccountType>("checking");
	const [institutionName, setInstitutionName] = useState("");
	const [openingBalance, setOpeningBalance] = useState("");
	const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>(
		{},
	);

	const createMutation = useMutation({
		...createAccountMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["accounts"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			setOpen(false);
			setName("");
			setType("checking");
			setInstitutionName("");
			setOpeningBalance("");
		},
	});

	const updateBalanceMutation = useMutation({
		...updateAccountBalanceMutation,
		onSuccess: async (updatedAccount) => {
			await queryClient.invalidateQueries({ queryKey: ["accounts"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			setBalanceDrafts((current) => {
				const next = { ...current };
				delete next[updatedAccount.id];
				return next;
			});
		},
	});

	const deleteMutation = useMutation({
		...deleteAccountMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["accounts"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	const groupedAccounts = useMemo(() => {
		const accounts: AccountSummary[] = accountsQuery.data ?? [];
		return {
			assets: accounts.filter((account) => account.classification === "asset"),
			liabilities: accounts.filter(
				(account) => account.classification === "liability",
			),
		};
	}, [accountsQuery.data]);

	function saveBalanceDraft(account: AccountSummary) {
		const balanceCents = parseBalanceDraft(balanceDrafts[account.id]);
		if (balanceCents === null) {
			return;
		}

		if (balanceCents === account.currentBalanceCents) {
			setBalanceDrafts((current) => {
				const next = { ...current };
				delete next[account.id];
				return next;
			});
			return;
		}

		updateBalanceMutation.mutate({
			accountId: account.id,
			balanceCents,
		});
	}

	return (
		<main className="grid gap-6 p-4 lg:p-6">
			<section className="grid gap-4">
				<AccountGroup
					title="Assets"
					description="Cash and investment accounts"
					accounts={groupedAccounts.assets}
					balanceDrafts={balanceDrafts}
					setBalanceDrafts={setBalanceDrafts}
					onSaveBalance={saveBalanceDraft}
					isSavingAccountId={updateBalanceMutation.variables?.accountId}
					isSaving={updateBalanceMutation.isPending}
					onDeleteAccount={(accountId) => deleteMutation.mutate({ accountId })}
					isDeletingAccountId={deleteMutation.variables?.accountId}
					isDeleting={deleteMutation.isPending}
				/>
				<AccountGroup
					title="Liabilities"
					description="Credit cards and loan balances"
					accounts={groupedAccounts.liabilities}
					balanceDrafts={balanceDrafts}
					setBalanceDrafts={setBalanceDrafts}
					onSaveBalance={saveBalanceDraft}
					isSavingAccountId={updateBalanceMutation.variables?.accountId}
					isSaving={updateBalanceMutation.isPending}
					onDeleteAccount={(accountId) => deleteMutation.mutate({ accountId })}
					isDeletingAccountId={deleteMutation.variables?.accountId}
					isDeleting={deleteMutation.isPending}
				/>
			</section>

			<section className="flex justify-end">
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button className="gap-2">
							<Plus className="h-4 w-4" />
							Add account
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create account</DialogTitle>
							<DialogDescription>
								Add a local account for imports, balances, and net worth
								tracking.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4">
							<div className="grid gap-2">
								<label className="text-sm font-medium" htmlFor="account-name">
									Account name
								</label>
								<Input
									id="account-name"
									value={name}
									onChange={(event) => setName(event.target.value)}
								/>
							</div>
							<div className="grid gap-2">
								<label className="text-sm font-medium" htmlFor="account-type">
									Type
								</label>
								<Select
									value={type}
									onValueChange={(value) => setType(value as AccountType)}
								>
									<SelectTrigger id="account-type">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{accountTypeOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<label
									className="text-sm font-medium"
									htmlFor="institution-name"
								>
									Institution
								</label>
								<Input
									id="institution-name"
									value={institutionName}
									onChange={(event) => setInstitutionName(event.target.value)}
								/>
							</div>
							<div className="grid gap-2">
								<label
									className="text-sm font-medium"
									htmlFor="opening-balance"
								>
									Opening balance
								</label>
								<Input
									id="opening-balance"
									type="number"
									step="0.01"
									placeholder="1200.00"
									value={openingBalance}
									onChange={(event) => setOpeningBalance(event.target.value)}
								/>
							</div>
							<Button
								onClick={() =>
									createMutation.mutate({
										name,
										type,
										institutionName: institutionName || null,
										openingBalanceCents: openingBalance
											? Math.round(Number(openingBalance) * 100)
											: undefined,
									})
								}
								disabled={!name.trim() || createMutation.isPending}
							>
								{createMutation.isPending ? "Creating..." : "Create account"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</section>
		</main>
	);
}

function AccountGroup({
	title,
	description,
	accounts,
	balanceDrafts,
	setBalanceDrafts,
	onSaveBalance,
	isSavingAccountId,
	isSaving,
	onDeleteAccount,
	isDeletingAccountId,
	isDeleting,
}: {
	title: string;
	description: string;
	accounts: AccountSummary[];
	balanceDrafts: Record<string, string>;
	setBalanceDrafts: React.Dispatch<
		React.SetStateAction<Record<string, string>>
	>;
	onSaveBalance: (account: AccountSummary) => void;
	isSavingAccountId?: string;
	isSaving: boolean;
	onDeleteAccount: (accountId: string) => void;
	isDeletingAccountId?: string;
	isDeleting: boolean;
}) {
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
	const [collapsed, setCollapsed] = useState(false);
	function getDraftBalanceCents(account: AccountSummary) {
		return parseBalanceDraft(balanceDrafts[account.id]);
	}

	function hasBalanceChange(account: AccountSummary) {
		const draftBalanceCents = getDraftBalanceCents(account);
		return (
			draftBalanceCents !== null &&
			draftBalanceCents !== account.currentBalanceCents
		);
	}

	return (
		<Card className="shadow-sm">
			<CardHeader>
				<button
					type="button"
					onClick={() => setCollapsed((value) => !value)}
					className="flex w-full items-start gap-3 text-left"
					aria-expanded={!collapsed}
				>
					<span className="mt-1 text-muted-foreground">
						{collapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</span>
					<span className="grid gap-1">
						<CardTitle>
							{title}
							<span className="ml-2 text-sm font-normal text-muted-foreground">
								{accounts.length}
							</span>
						</CardTitle>
						<CardDescription>{description}</CardDescription>
					</span>
				</button>
			</CardHeader>
			{collapsed ? null : (
				<CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{accounts.length === 0 ? (
						<div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
							No accounts yet.
						</div>
					) : (
						accounts.map((account) => (
							<div
							key={account.id}
							className={`flex h-full flex-col rounded-xl border p-4 ${accountCardTint(account.type)}`}
						>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="font-medium text-foreground">
											{account.name}
										</p>
										<p className="text-sm text-muted-foreground">
											{account.institutionName ?? "Local account"}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="secondary">{account.type}</Badge>
										<Dialog
											open={confirmDeleteId === account.id}
											onOpenChange={(open) =>
												setConfirmDeleteId(open ? account.id : null)
											}
										>
											<DialogTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 text-muted-foreground hover:text-destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</DialogTrigger>
											<DialogContent>
												<DialogHeader>
													<DialogTitle>Delete account</DialogTitle>
													<DialogDescription>
														Are you sure you want to delete{" "}
														<span className="font-medium text-foreground">
															{account.name}
														</span>
														? This will permanently remove the account and all
														its transactions and balance history.
													</DialogDescription>
												</DialogHeader>
												<div className="flex justify-end gap-2 pt-2">
													<Button
														variant="outline"
														onClick={() => setConfirmDeleteId(null)}
													>
														Cancel
													</Button>
													<Button
														variant="destructive"
														disabled={
															isDeleting && isDeletingAccountId === account.id
														}
														onClick={() => {
															onDeleteAccount(account.id);
															setConfirmDeleteId(null);
														}}
													>
														{isDeleting && isDeletingAccountId === account.id
															? "Deleting..."
															: "Delete account"}
													</Button>
												</div>
											</DialogContent>
										</Dialog>
									</div>
								</div>
								<div className="mt-4 grid flex-1 content-end gap-3">
									<div className="text-sm text-muted-foreground">
										Last snapshot:{" "}
										{account.lastSnapshotOn ?? "Not yet captured"}
									</div>
									<div className="grid gap-2">
										<label
											className="text-sm font-medium text-foreground"
											htmlFor={`account-balance-${account.id}`}
										>
											Current value
										</label>
										<Input
											id={`account-balance-${account.id}`}
											type="number"
											step="0.01"
											value={
												balanceDrafts[account.id] ??
												balanceInputValue(account.currentBalanceCents)
											}
											onChange={(event) =>
												setBalanceDrafts((current) => ({
													...current,
													[account.id]: event.target.value,
												}))
											}
											onKeyDown={(event) => {
												if (event.key === "Enter") {
													event.preventDefault();
													if (hasBalanceChange(account)) {
														onSaveBalance(account);
													}
												}
												if (event.key === "Escape") {
													setBalanceDrafts((current) => {
														const next = { ...current };
														delete next[account.id];
														return next;
													});
												}
											}}
										/>
										<div className="flex justify-end">
											<Button
												size="sm"
												disabled={
													!hasBalanceChange(account) ||
													(isSaving && isSavingAccountId === account.id)
												}
												onClick={() => onSaveBalance(account)}
											>
												{isSaving && isSavingAccountId === account.id
													? "Saving..."
													: "Save value"}
											</Button>
										</div>
										{isSaving && isSavingAccountId === account.id && (
											<p className="text-xs text-muted-foreground">Saving...</p>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</CardContent>
			)}
		</Card>
	);
}
