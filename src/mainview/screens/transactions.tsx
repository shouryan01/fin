import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ArrowRight, Repeat2 } from "lucide-react";
import {
	memo,
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { CategoryGlyph } from "#/components/category-glyph";
import { Button } from "#/components/ui/button";
import { Card, CardHeader } from "#/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";
import { accountsQueryOptions } from "#/queries/accounts";
import { categoriesQueryOptions } from "#/queries/categories";
import {
	settingsQueryOptions,
	updateAppSettingsMutation,
} from "#/queries/settings";
import {
	transactionsQueryOptions,
	updateTransactionMutation,
} from "#/queries/transactions";
import {
	type AccountSummary,
	type CategoryRecord,
	computePeriodBounds,
	type DashboardPeriod,
	dashboardPeriods,
	periodConfigFromSettings,
	periodLongLabels,
	periodShortLabels,
	stepPeriod,
	type TransactionPageSize,
	type TransactionRecord,
	type TransactionRecurringRule,
	transactionPageSizeOptions,
	type UpdateTransactionInput,
} from "../../shared/finance";

type Draft = {
	accountId: string;
	postedOn: string;
	description: string;
	merchant: string;
	memo: string;
	categoryId: string;
	amount: string;
};

type DraftMap = Record<string, Draft>;

const ROW_GRID_CLASS =
	"grid w-full grid-cols-[7rem_minmax(0,1.4fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_7rem] gap-2 px-3 py-2 items-center min-h-[52px]";

const ROW_ESTIMATE_PX = 52;

function amountInputValue(cents: number) {
	return (cents / 100).toFixed(2);
}

function buildDraft(transaction: TransactionRecord): Draft {
	return {
		accountId: transaction.accountId,
		postedOn: transaction.postedOn,
		description: transaction.description,
		merchant: transaction.merchant,
		memo: transaction.memo ?? "",
		categoryId: transaction.categoryId ?? "uncategorized",
		amount: amountInputValue(transaction.amountCents),
	};
}

const recurringRuleLabels: Record<TransactionRecurringRule, string> = {
	auto: "Auto-detect",
	recurring: "Recurring",
	"not-recurring": "Not recurring",
};

function recurringStatusLabel(
	transaction: Pick<TransactionRecord, "isRecurring" | "recurringRule">,
) {
	if (transaction.recurringRule === "recurring") {
		return "Recurring (manual)";
	}
	if (transaction.recurringRule === "not-recurring") {
		return "Not recurring (manual)";
	}
	return transaction.isRecurring ? "Recurring (auto)" : "Not recurring (auto)";
}

function recurringControlClasses(
	transaction: Pick<TransactionRecord, "isRecurring" | "recurringRule">,
) {
	if (transaction.recurringRule === "recurring") {
		return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15";
	}
	if (transaction.recurringRule === "not-recurring") {
		return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15";
	}
	if (transaction.isRecurring) {
		return "border-slate-300/90 bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200/90 dark:border-slate-500/45 dark:bg-slate-500/20 dark:text-slate-100 dark:hover:bg-slate-500/30";
	}
	return "border-dashed border-muted-foreground/15 bg-transparent text-muted-foreground/35 hover:border-muted-foreground/30 hover:bg-muted/30 hover:text-muted-foreground/60 dark:border-muted-foreground/12 dark:text-muted-foreground/30 dark:hover:border-muted-foreground/22";
}

function RecurringRuleControl({
	disabled,
	onChange,
	transaction,
}: {
	disabled: boolean;
	onChange: (recurringRule: TransactionRecurringRule) => void;
	transaction: TransactionRecord;
}) {
	return (
		<TooltipProvider delayDuration={150}>
			<DropdownMenu>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled}
								aria-label={`Recurrence: ${recurringStatusLabel(transaction)}`}
								className={cn(
									"relative h-9 w-9 shrink-0 rounded-full border shadow-none",
									recurringControlClasses(transaction),
								)}
							>
								<Repeat2 className="size-4" aria-hidden="true" />
								{transaction.recurringRule === "recurring" ? (
									<span className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-current opacity-80" />
								) : null}
								{transaction.recurringRule === "not-recurring" ? (
									<span className="pointer-events-none absolute inset-x-[9px] top-1/2 h-[1.5px] -translate-y-1/2 -rotate-45 rounded-full bg-current opacity-80" />
								) : null}
								<span className="sr-only">Edit recurring status</span>
							</Button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent>{recurringStatusLabel(transaction)}</TooltipContent>
				</Tooltip>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Recurrence</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={transaction.recurringRule}
						onValueChange={(value) =>
							onChange(value as TransactionRecurringRule)
						}
					>
						{(
							Object.entries(recurringRuleLabels) as Array<
								[TransactionRecurringRule, string]
							>
						).map(([value, label]) => (
							<DropdownMenuRadioItem key={value} value={value}>
								{label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</TooltipProvider>
	);
}

type TransactionRowProps = {
	transaction: TransactionRecord;
	externalDraft: Draft | undefined;
	categories: CategoryRecord[];
	accounts: AccountSummary[];
	isSaving: boolean;
	onPatchDraft: (id: string, updater: (draft: Draft) => Draft) => void;
	onResetDraft: (id: string) => void;
	onSaveDraft: (transaction: TransactionRecord, nextDraft?: Draft) => void;
	onCommitDraft: (transaction: TransactionRecord, nextDraft: Draft) => void;
	onRecurringRule: (
		transaction: TransactionRecord,
		recurringRule: TransactionRecurringRule,
	) => void;
};

const TransactionVirtualRow = memo(function TransactionVirtualRow({
	transaction,
	externalDraft,
	categories,
	accounts,
	isSaving,
	onPatchDraft,
	onResetDraft,
	onSaveDraft,
	onCommitDraft,
	onRecurringRule,
}: TransactionRowProps) {
	const draft = externalDraft ?? buildDraft(transaction);
	const isAmountInvalid =
		!draft.amount.trim() || !Number.isFinite(Number(draft.amount));

	return (
		<div className={cn(ROW_GRID_CLASS, "border-b border-border/70")}>
			<div className="min-w-0">
				<Input
					type="date"
					value={draft.postedOn}
					onChange={(event) =>
						onPatchDraft(transaction.id, (current) => ({
							...current,
							postedOn: event.target.value,
						}))
					}
					onBlur={() => onSaveDraft(transaction)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.currentTarget.blur();
						}
						if (event.key === "Escape") {
							onResetDraft(transaction.id);
						}
					}}
				/>
			</div>
			<div className="flex min-w-0 items-center gap-2">
				<Input
					className="min-w-0 flex-1"
					value={draft.merchant}
					onChange={(event) =>
						onPatchDraft(transaction.id, (current) => ({
							...current,
							merchant: event.target.value,
						}))
					}
					onBlur={() => onSaveDraft(transaction)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.currentTarget.blur();
						}
						if (event.key === "Escape") {
							onResetDraft(transaction.id);
						}
					}}
				/>
				<RecurringRuleControl
					transaction={transaction}
					disabled={isSaving}
					onChange={(recurringRule) =>
						onRecurringRule(transaction, recurringRule)
					}
				/>
			</div>
			<div className="min-w-0">
				<Input
					value={draft.description}
					onChange={(event) =>
						onPatchDraft(transaction.id, (current) => ({
							...current,
							description: event.target.value,
						}))
					}
					onBlur={() => onSaveDraft(transaction)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.currentTarget.blur();
						}
						if (event.key === "Escape") {
							onResetDraft(transaction.id);
						}
					}}
				/>
			</div>
			<div className="min-w-0">
				<Input
					value={draft.memo}
					onChange={(event) =>
						onPatchDraft(transaction.id, (current) => ({
							...current,
							memo: event.target.value,
						}))
					}
					onBlur={() => onSaveDraft(transaction)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.currentTarget.blur();
						}
						if (event.key === "Escape") {
							onResetDraft(transaction.id);
						}
					}}
				/>
			</div>
			<div className="min-w-0">
				<Select
					value={draft.categoryId}
					onValueChange={(value) => {
						onCommitDraft(transaction, { ...draft, categoryId: value });
					}}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="uncategorized">Uncategorized</SelectItem>
						{categories.map((category) => (
							<SelectItem key={category.id} value={category.id}>
								<span className="flex items-center gap-2">
									<CategoryGlyph iconId={category.icon} className="h-4 w-4" />
									{category.name}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="min-w-0">
				<Select
					value={draft.accountId}
					onValueChange={(value) => {
						onCommitDraft(transaction, { ...draft, accountId: value });
					}}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{accounts.map((account) => (
							<SelectItem key={account.id} value={account.id}>
								{account.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="min-w-0">
				<Input
					type="number"
					step="0.01"
					value={draft.amount}
					className={isAmountInvalid ? "border-destructive" : undefined}
					onChange={(event) =>
						onPatchDraft(transaction.id, (current) => ({
							...current,
							amount: event.target.value,
						}))
					}
					onBlur={() => onSaveDraft(transaction)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.currentTarget.blur();
						}
						if (event.key === "Escape") {
							onResetDraft(transaction.id);
						}
					}}
				/>
			</div>
		</div>
	);
});

export default function TransactionsScreen() {
	const queryClient = useQueryClient();
	const searchInputRef = useRef<HTMLInputElement>(null);
	const listScrollRef = useRef<HTMLDivElement>(null);

	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);
	const [accountId, setAccountId] = useState("all");
	const [categoryId, setCategoryId] = useState("all");
	const [period, setPeriod] = useState<DashboardPeriod>("monthly");
	const [anchor, setAnchor] = useState(() => format(new Date(), "yyyy-MM-dd"));
	const [drafts, setDrafts] = useState<DraftMap>({});
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState<TransactionPageSize>(25);
	const [pageSizeReady, setPageSizeReady] = useState(false);

	const settingsQuery = useQuery(settingsQueryOptions());

	const periodConfig = useMemo(
		() => periodConfigFromSettings(settingsQuery.data),
		[settingsQuery.data],
	);

	const anchorDate = useMemo(() => parseISO(anchor), [anchor]);

	const currentBounds = useMemo(
		() => computePeriodBounds(period, anchorDate, periodConfig),
		[period, anchorDate, periodConfig],
	);

	const prevAnchorDate = useMemo(
		() => stepPeriod(period, currentBounds.start, -1),
		[period, currentBounds.start],
	);
	const nextAnchorDate = useMemo(
		() => stepPeriod(period, currentBounds.start, 1),
		[period, currentBounds.start],
	);

	const isCurrent = useMemo(() => {
		const todayBounds = computePeriodBounds(period, new Date(), periodConfig);
		return todayBounds.key === currentBounds.key;
	}, [period, currentBounds.key, periodConfig]);

	const from = format(currentBounds.start, "yyyy-MM-dd");
	const to = format(currentBounds.end, "yyyy-MM-dd");

	const listFilters = useMemo(
		() => ({
			search: deferredSearch || undefined,
			accountId: accountId !== "all" ? accountId : undefined,
			categoryId: categoryId !== "all" ? categoryId : undefined,
			from,
			to,
			limit: pageSize,
			offset: pageIndex * pageSize,
		}),
		[accountId, categoryId, deferredSearch, from, pageIndex, pageSize, to],
	);

	const transactionsQuery = useQuery(transactionsQueryOptions(listFilters));
	const accountsQuery = useQuery(accountsQueryOptions());
	const categoriesQuery = useQuery(categoriesQueryOptions());

	// Sync page size from persisted settings on first load.
	// biome-ignore lint/correctness/useExhaustiveDependencies: only run once when settings first load
	useEffect(() => {
		if (pageSizeReady || !settingsQuery.data) return;
		setPageSize(settingsQuery.data.transactionPageSize);
		setPageSizeReady(true);
	}, [settingsQuery.data, pageSizeReady]);

	const updateSettingsMutation = useMutation({
		...updateAppSettingsMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["settings"] });
		},
	});

	const items = transactionsQuery.data?.items ?? [];
	const totalCount = transactionsQuery.data?.totalCount ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	const itemsRef = useRef(items);
	itemsRef.current = items;

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally reset pagination when these inputs change
	useEffect(() => {
		setPageIndex(0);
	}, [accountId, categoryId, deferredSearch, from, to]);

	useEffect(() => {
		const maxIdx = Math.max(0, Math.ceil(totalCount / pageSize) - 1);
		if (pageIndex > maxIdx) {
			setPageIndex(maxIdx);
		}
	}, [pageIndex, pageSize, totalCount]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll to top when the result set identity changes
	useEffect(() => {
		listScrollRef.current?.scrollTo({ top: 0 });
	}, [pageIndex, pageSize, deferredSearch, accountId, categoryId, from, to]);

	const rowVirtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => listScrollRef.current,
		estimateSize: () => ROW_ESTIMATE_PX,
		overscan: 8,
	});

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
				event.preventDefault();
				searchInputRef.current?.focus();
				searchInputRef.current?.select();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const updateMutation = useMutation({
		...updateTransactionMutation,
		onSuccess: async (transaction) => {
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["accounts"] });
			setDrafts((current) => {
				const next = { ...current };
				delete next[transaction.id];
				return next;
			});
		},
	});

	const mutateRef = useRef(updateMutation.mutate);
	mutateRef.current = updateMutation.mutate;

	const resetDraft = useCallback((transactionId: string) => {
		setDrafts((current) => {
			if (!(transactionId in current)) {
				return current;
			}
			const next = { ...current };
			delete next[transactionId];
			return next;
		});
	}, []);

	const patchDraft = useCallback(
		(transactionId: string, updater: (draft: Draft) => Draft) => {
			setDrafts((current) => {
				const transaction = itemsRef.current.find(
					(candidate) => candidate.id === transactionId,
				);
				if (!transaction) {
					return current;
				}
				return {
					...current,
					[transactionId]: updater(
						current[transactionId] ?? buildDraft(transaction),
					),
				};
			});
		},
		[],
	);

	const saveDraft = useCallback(
		(transaction: TransactionRecord, nextDraft?: Draft) => {
			setDrafts((current) => {
				const draft =
					nextDraft ?? current[transaction.id] ?? buildDraft(transaction);
				if (!draft.postedOn.trim()) {
					return current;
				}
				const amount = Number(draft.amount);
				if (!draft.amount.trim() || !Number.isFinite(amount)) {
					return current;
				}

				const amountCents = Math.round(amount * 100);
				const payload: UpdateTransactionInput = { id: transaction.id };
				let hasChanges = false;

				if (draft.accountId !== transaction.accountId) {
					payload.accountId = draft.accountId;
					hasChanges = true;
				}
				if (draft.postedOn !== transaction.postedOn) {
					payload.postedOn = draft.postedOn;
					hasChanges = true;
				}
				if (draft.description !== transaction.description) {
					payload.description = draft.description;
					hasChanges = true;
				}
				if (draft.merchant !== transaction.merchant) {
					payload.merchant = draft.merchant;
					hasChanges = true;
				}
				if (draft.memo !== (transaction.memo ?? "")) {
					payload.memo = draft.memo || null;
					hasChanges = true;
				}
				if (draft.categoryId !== (transaction.categoryId ?? "uncategorized")) {
					payload.categoryId =
						draft.categoryId === "uncategorized" ? null : draft.categoryId;
					hasChanges = true;
				}
				if (amountCents !== transaction.amountCents) {
					payload.amountCents = amountCents;
					hasChanges = true;
				}

				if (!hasChanges) {
					if (!(transaction.id in current)) {
						return current;
					}
					const next = { ...current };
					delete next[transaction.id];
					return next;
				}

				mutateRef.current(payload);
				return current;
			});
		},
		[],
	);

	const commitDraft = useCallback(
		(transaction: TransactionRecord, nextDraft: Draft) => {
			setDrafts((current) => ({
				...current,
				[transaction.id]: nextDraft,
			}));
			saveDraft(transaction, nextDraft);
		},
		[saveDraft],
	);

	const setRecurringRule = useCallback(
		(
			transaction: TransactionRecord,
			recurringRule: TransactionRecurringRule,
		) => {
			if (transaction.recurringRule === recurringRule) {
				return;
			}
			mutateRef.current({
				id: transaction.id,
				recurringRule,
			});
		},
		[],
	);

	const categories = categoriesQuery.data ?? [];
	const accounts = accountsQuery.data ?? [];

	const rangeStart = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
	const rangeEnd = Math.min(totalCount, pageIndex * pageSize + items.length);

	const virtualItems = rowVirtualizer.getVirtualItems();
	const savingId =
		updateMutation.isPending && updateMutation.variables
			? updateMutation.variables.id
			: null;

	return (
		<div className="flex h-[calc(100dvh-6.5rem)] flex-col p-4 lg:p-6">
			<Card className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-sm">
				<CardHeader className="space-y-4 border-b">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-muted/30 p-0.5">
								{dashboardPeriods.map((p) => (
									<Button
										key={p}
										size="sm"
										variant={p === period ? "default" : "ghost"}
										className="h-7 px-2 text-xs"
										onClick={() => {
											setPeriod(p);
											setAnchor(format(new Date(), "yyyy-MM-dd"));
										}}
										title={periodLongLabels[p]}
										aria-label={periodLongLabels[p]}
									>
										{periodShortLabels[p]}
									</Button>
								))}
							</div>
							<div className="flex items-center gap-1">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={() =>
										setAnchor(format(prevAnchorDate, "yyyy-MM-dd"))
									}
									aria-label="Previous period"
								>
									<ArrowLeft className="h-3.5 w-3.5" />
								</Button>
								<div className="flex flex-col items-center">
									<span className="text-sm font-medium tabular-nums text-foreground">
										{currentBounds.label}
									</span>
									{!isCurrent && (
										<button
											type="button"
											onClick={() =>
												setAnchor(format(new Date(), "yyyy-MM-dd"))
											}
											className="text-[10px] font-medium text-primary hover:underline cursor-pointer"
										>
											Return to current
										</button>
									)}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={() =>
										setAnchor(format(nextAnchorDate, "yyyy-MM-dd"))
									}
									aria-label="Next period"
								>
									<ArrowRight className="h-3.5 w-3.5" />
								</Button>
							</div>
							<p className="text-sm text-muted-foreground">
								{transactionsQuery.isFetching && !transactionsQuery.data
									? "Loading…"
									: totalCount === 0
										? "No matching transactions"
										: `${rangeStart}–${rangeEnd} of ${totalCount}`}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="whitespace-nowrap">Rows per page</span>
								<Select
									value={String(pageSize)}
									onValueChange={(value) => {
										const next = Number(value) as TransactionPageSize;
										setPageSize(next);
										setPageIndex(0);
										updateSettingsMutation.mutate({
											transactionPageSize: next,
										});
									}}
								>
									<SelectTrigger className="w-[120px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{transactionPageSizeOptions.map((n) => (
											<SelectItem key={n} value={String(n)}>
												{n}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={pageIndex <= 0 || transactionsQuery.isFetching}
									onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
								>
									Previous
								</Button>
								<span className="min-w-[7rem] text-center text-sm tabular-nums text-muted-foreground">
									{totalCount === 0
										? "—"
										: `Page ${pageIndex + 1} / ${totalPages}`}
								</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={
										pageIndex >= totalPages - 1 ||
										totalCount === 0 ||
										transactionsQuery.isFetching
									}
									onClick={() =>
										setPageIndex((i) => Math.min(totalPages - 1, i + 1))
									}
								>
									Next
								</Button>
							</div>
						</div>
					</div>
					<div className="grid gap-3 md:grid-cols-3">
						<Input
							ref={searchInputRef}
							placeholder="Search merchant, memo, category..."
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
						<Select value={accountId} onValueChange={setAccountId}>
							<SelectTrigger>
								<SelectValue placeholder="All accounts" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All accounts</SelectItem>
								{accountsQuery.data?.map((account) => (
									<SelectItem key={account.id} value={account.id}>
										{account.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={categoryId} onValueChange={setCategoryId}>
							<SelectTrigger>
								<SelectValue placeholder="All categories" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All categories</SelectItem>
								{categoriesQuery.data?.map((category) => (
									<SelectItem key={category.id} value={category.id}>
										<span className="flex items-center gap-2">
											<CategoryGlyph
												iconId={category.icon}
												className="h-4 w-4"
											/>
											{category.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>

				<div
					className={cn(
						ROW_GRID_CLASS,
						"border-b bg-muted/90 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
					)}
				>
					<div>Date</div>
					<div>Merchant</div>
					<div>Description</div>
					<div>Memo</div>
					<div>Category</div>
					<div>Account</div>
					<div>Amount</div>
				</div>

				<div ref={listScrollRef} className="flex-1 overflow-auto">
					{items.length === 0 && !transactionsQuery.isFetching ? (
						<p className="px-3 py-10 text-center text-sm text-muted-foreground">
							No transactions in this view.
						</p>
					) : (
						<div
							className="relative w-full"
							style={{ height: rowVirtualizer.getTotalSize() }}
						>
							{virtualItems.map((virtualRow) => {
								const transaction = items[virtualRow.index];
								if (!transaction) {
									return null;
								}
								const externalDraft = drafts[transaction.id];
								const isSaving = savingId === transaction.id;

								return (
									<div
										key={transaction.id}
										data-index={virtualRow.index}
										ref={rowVirtualizer.measureElement}
										className="absolute left-0 top-0 w-full"
										style={{
											transform: `translateY(${virtualRow.start}px)`,
										}}
									>
										<TransactionVirtualRow
											transaction={transaction}
											externalDraft={externalDraft}
											categories={categories}
											accounts={accounts}
											isSaving={isSaving}
											onPatchDraft={patchDraft}
											onResetDraft={resetDraft}
											onSaveDraft={saveDraft}
											onCommitDraft={commitDraft}
											onRecurringRule={setRecurringRule}
										/>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
