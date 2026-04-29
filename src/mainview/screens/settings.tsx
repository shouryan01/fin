import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	CategoryGlyph,
	categoryIconPickerOptions,
} from "#/components/category-glyph";
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
import { Separator } from "#/components/ui/separator";
import { Switch } from "#/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import {
	categoriesQueryOptions,
	createCategoryMutation,
	deleteCategoryMutation,
	updateCategoryMutation,
} from "#/queries/categories";
import {
	settingsQueryOptions,
	updateAppSettingsMutation,
} from "#/queries/settings";
import { suggestCategoryIconId } from "../../shared/category-icons";
import type {
	CategoryKind,
	CategoryRecord,
	TransactionPageSize,
	WeekStartDay,
} from "../../shared/finance";
import {
	categoryKinds,
	transactionPageSizeOptions,
} from "../../shared/finance";

const weekStartDayOptions: Array<{ value: WeekStartDay; label: string }> = [
	{ value: 0, label: "Sunday" },
	{ value: 1, label: "Monday" },
	{ value: 2, label: "Tuesday" },
	{ value: 3, label: "Wednesday" },
	{ value: 4, label: "Thursday" },
	{ value: 5, label: "Friday" },
	{ value: 6, label: "Saturday" },
];

const kindOrder: CategoryKind[] = ["income", "expense", "transfer"];

const kindLabels: Record<CategoryKind, string> = {
	income: "Income",
	expense: "Expense",
	transfer: "Transfer",
};

type CategoryDraft = {
	name: string;
	kind: CategoryKind;
	icon: string;
	hidden: boolean;
};

function mergeDraft(
	category: CategoryRecord,
	edits: Partial<CategoryDraft> | undefined,
): CategoryDraft {
	return {
		name: edits?.name ?? category.name,
		kind: edits?.kind ?? category.kind,
		icon: edits?.icon ?? category.icon,
		hidden: edits?.hidden ?? category.hidden,
	};
}

function isDirty(category: CategoryRecord, draft: CategoryDraft) {
	return (
		draft.name !== category.name ||
		draft.kind !== category.kind ||
		draft.icon !== category.icon ||
		draft.hidden !== category.hidden
	);
}

export default function SettingsScreen() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const settingsQuery = useQuery(settingsQueryOptions());
	const categoriesQuery = useQuery(categoriesQueryOptions());

	const [categoryEdits, setCategoryEdits] = useState<
		Record<string, Partial<CategoryDraft>>
	>({});
	const [createOpen, setCreateOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newKind, setNewKind] = useState<CategoryKind>("expense");
	const [newIcon, setNewIcon] = useState<string>("Tag");
	const [newHidden, setNewHidden] = useState(false);
	const newIconTouchedRef = useRef(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const updateSettings = useMutation({
		...updateAppSettingsMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["settings"] });
			await queryClient.invalidateQueries({ queryKey: ["accounts"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const invalidateCategoryData = async () => {
		await queryClient.invalidateQueries({ queryKey: ["categories"] });
		await queryClient.invalidateQueries({ queryKey: ["transactions"] });
		await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
	};

	const createCategory = useMutation({
		...createCategoryMutation,
		onSuccess: async () => {
			await invalidateCategoryData();
			setCreateOpen(false);
			setNewName("");
			setNewKind("expense");
			setNewIcon("Tag");
			setNewHidden(false);
		},
	});

	const prevCreateOpenRef = useRef(false);
	useEffect(() => {
		if (createOpen && !prevCreateOpenRef.current) {
			newIconTouchedRef.current = false;
		}
		prevCreateOpenRef.current = createOpen;
		if (!createOpen || newIconTouchedRef.current) {
			return;
		}
		setNewIcon(suggestCategoryIconId(newName.trim() || "Category"));
	}, [createOpen, newName]);

	const updateCategory = useMutation({
		...updateCategoryMutation,
		onSuccess: async (_, variables) => {
			await invalidateCategoryData();
			setCategoryEdits((current) => {
				const next = { ...current };
				delete next[variables.id];
				return next;
			});
		},
	});

	const deleteCategory = useMutation({
		...deleteCategoryMutation,
		onSuccess: async () => {
			await invalidateCategoryData();
			setConfirmDeleteId(null);
		},
	});

	const sortedCategories = useMemo(() => {
		const list = categoriesQuery.data ?? [];
		return [...list].sort((left, right) => {
			const leftIndex = kindOrder.indexOf(left.kind);
			const rightIndex = kindOrder.indexOf(right.kind);
			if (leftIndex !== rightIndex) {
				return leftIndex - rightIndex;
			}
			return left.name.localeCompare(right.name);
		});
	}, [categoriesQuery.data]);

	const categoryMutationError =
		createCategory.error ?? updateCategory.error ?? deleteCategory.error;

	const sampleDataEnabled = settingsQuery.data?.sampleDataEnabled ?? false;
	const sampleDataLoaded = settingsQuery.data?.sampleDataLoaded ?? false;
	const disabled = settingsQuery.isPending || updateSettings.isPending;
	const categoriesBusy =
		categoriesQuery.isPending ||
		createCategory.isPending ||
		updateCategory.isPending ||
		deleteCategory.isPending;

	return (
		<main className="grid gap-6 p-4 lg:p-6">
			<Card className="shadow-sm">
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="grid gap-1.5">
						<CardTitle>Categories</CardTitle>
						<CardDescription>
							Edit category names, types, and icons. Deleting a category removes
							it from the list; linked transactions stay but lose this label.
						</CardDescription>
					</div>
					<Dialog open={createOpen} onOpenChange={setCreateOpen}>
						<DialogTrigger asChild>
							<Button
								type="button"
								className="gap-2 shrink-0"
								variant="outline"
							>
								<Plus className="h-4 w-4" />
								New category
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create category</DialogTitle>
								<DialogDescription>
									Add a category for organizing income, spending, and transfers.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4">
								<div className="grid gap-2">
									<label className="text-sm font-medium" htmlFor="new-cat-name">
										Name
									</label>
									<Input
										id="new-cat-name"
										value={newName}
										onChange={(event) => setNewName(event.target.value)}
										placeholder="e.g. Subscriptions"
									/>
								</div>
								<div className="grid gap-2">
									<label className="text-sm font-medium" htmlFor="new-cat-kind">
										Type
									</label>
									<Select
										value={newKind}
										onValueChange={(value) => setNewKind(value as CategoryKind)}
									>
										<SelectTrigger id="new-cat-kind">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{categoryKinds.map((kind) => (
												<SelectItem key={kind} value={kind}>
													{kindLabels[kind]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<label className="text-sm font-medium" htmlFor="new-cat-icon">
										Icon
									</label>
									<Select
										value={newIcon}
										onValueChange={(value) => {
											newIconTouchedRef.current = true;
											setNewIcon(value);
										}}
									>
										<SelectTrigger
											id="new-cat-icon"
											className="h-9 w-16 shrink-0 items-center justify-between gap-1 pl-1.5 pr-2.5 [&>span]:line-clamp-none [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center [&>span]:justify-center"
											aria-label={`Category icon (${newIcon})`}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="max-h-[min(24rem,70vh)] w-16 min-w-16 p-0 [&_[data-radix-select-viewport]]:min-w-16">
											{categoryIconPickerOptions.map((opt) => (
												<SelectItem
													key={opt.id}
													value={opt.id}
													textValue={opt.id}
													className="justify-center px-0 py-2 pl-0 pr-6 [&>span:last-child]:flex [&>span:last-child]:w-full [&>span:last-child]:items-center [&>span:last-child]:justify-center"
												>
													<span className="sr-only">{opt.id}</span>
													<span
														className="flex size-8 items-center justify-center"
														aria-hidden
													>
														<CategoryGlyph
															iconId={opt.id}
															className="h-4 w-4"
														/>
													</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										Pick a symbol for this category; the label is the name field
										above.
									</p>
								</div>
								<div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-3 py-3">
									<div className="grid gap-0.5">
										<p className="text-sm font-medium">Hidden</p>
										<p className="text-xs text-muted-foreground">
											Hide from pickers when unused
										</p>
									</div>
									<Switch
										checked={newHidden}
										onCheckedChange={setNewHidden}
										aria-label="Hide new category"
									/>
								</div>
								{createCategory.isError && (
									<p className="text-sm text-destructive">
										{createCategory.error instanceof Error
											? createCategory.error.message
											: "Could not create category."}
									</p>
								)}
								<Button
									type="button"
									disabled={!newName.trim() || createCategory.isPending}
									onClick={() =>
										createCategory.mutate({
											name: newName,
											kind: newKind,
											icon: newIcon,
											hidden: newHidden,
										})
									}
								>
									{createCategory.isPending ? "Creating..." : "Create category"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent className="grid gap-4">
					{categoryMutationError &&
						!createOpen &&
						(createCategory.isError ||
							updateCategory.isError ||
							deleteCategory.isError) && (
							<p className="text-sm text-destructive">
								{categoryMutationError instanceof Error
									? categoryMutationError.message
									: "Something went wrong."}
							</p>
						)}
					{categoriesQuery.isPending ? (
						<p className="text-sm text-muted-foreground">Loading categories…</p>
					) : sortedCategories.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No categories yet. Create one to get started.
						</p>
					) : (
						<div className="rounded-xl border border-border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[88px]">Icon</TableHead>
										<TableHead>Name</TableHead>
										<TableHead className="w-[140px]">Type</TableHead>
										<TableHead className="w-[100px] text-center">
											Hidden
										</TableHead>
										<TableHead className="w-[160px] text-right">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedCategories.map((category) => {
										const edits = categoryEdits[category.id];
										const draft = mergeDraft(category, edits);
										const dirty = isDirty(category, draft);
										return (
											<TableRow key={category.id}>
												<TableCell className="align-middle">
													<Select
														value={draft.icon}
														onValueChange={(value) =>
															setCategoryEdits((current) => ({
																...current,
																[category.id]: {
																	...current[category.id],
																	icon: value,
																},
															}))
														}
													>
														<SelectTrigger
															className="h-9 w-16 shrink-0 items-center justify-between gap-1 pl-1.5 pr-2.5 [&>span]:line-clamp-none [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center [&>span]:justify-center"
															aria-label={`Icon for ${draft.name || category.name} (${draft.icon})`}
														>
															<SelectValue />
														</SelectTrigger>
														<SelectContent className="max-h-[min(24rem,70vh)] w-16 min-w-16 p-0 [&_[data-radix-select-viewport]]:min-w-16">
															{categoryIconPickerOptions.map((opt) => (
																<SelectItem
																	key={opt.id}
																	value={opt.id}
																	textValue={opt.id}
																	className="justify-center px-0 py-2 pl-0 pr-6 [&>span:last-child]:flex [&>span:last-child]:w-full [&>span:last-child]:items-center [&>span:last-child]:justify-center"
																>
																	<span className="sr-only">{opt.id}</span>
																	<span
																		className="flex size-8 items-center justify-center"
																		aria-hidden
																	>
																		<CategoryGlyph
																			iconId={opt.id}
																			className="h-4 w-4"
																		/>
																	</span>
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</TableCell>
												<TableCell>
													<Input
														value={draft.name}
														onChange={(event) =>
															setCategoryEdits((current) => ({
																...current,
																[category.id]: {
																	...current[category.id],
																	name: event.target.value,
																},
															}))
														}
													/>
												</TableCell>
												<TableCell>
													<Select
														value={draft.kind}
														onValueChange={(value) =>
															setCategoryEdits((current) => ({
																...current,
																[category.id]: {
																	...current[category.id],
																	kind: value as CategoryKind,
																},
															}))
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{categoryKinds.map((kind) => (
																<SelectItem key={kind} value={kind}>
																	{kindLabels[kind]}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</TableCell>
												<TableCell className="text-center">
													<div className="flex justify-center">
														<Switch
															checked={draft.hidden}
															onCheckedChange={(checked) =>
																setCategoryEdits((current) => ({
																	...current,
																	[category.id]: {
																		...current[category.id],
																		hidden: checked,
																	},
																}))
															}
															aria-label={`Hidden: ${category.name}`}
														/>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex flex-wrap items-center justify-end gap-2">
														<Button
															type="button"
															size="sm"
															variant="secondary"
															disabled={
																!dirty || !draft.name.trim() || categoriesBusy
															}
															onClick={() =>
																updateCategory.mutate({
																	id: category.id,
																	name: draft.name.trim(),
																	kind: draft.kind,
																	icon: draft.icon,
																	hidden: draft.hidden,
																})
															}
														>
															{updateCategory.isPending &&
															updateCategory.variables?.id === category.id
																? "Saving…"
																: "Save"}
														</Button>
														<Dialog
															open={confirmDeleteId === category.id}
															onOpenChange={(open) =>
																setConfirmDeleteId(open ? category.id : null)
															}
														>
															<DialogTrigger asChild>
																<Button
																	type="button"
																	size="icon"
																	variant="ghost"
																	className="h-8 w-8 text-muted-foreground hover:text-destructive"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</DialogTrigger>
															<DialogContent>
																<DialogHeader>
																	<DialogTitle>Delete category</DialogTitle>
																	<DialogDescription>
																		Delete{" "}
																		<span className="font-medium text-foreground">
																			{category.name}
																		</span>
																		? Transactions keep their amounts but will
																		no longer reference this category.
																	</DialogDescription>
																</DialogHeader>
																<div className="flex justify-end gap-2 pt-2">
																	<Button
																		variant="outline"
																		type="button"
																		onClick={() => setConfirmDeleteId(null)}
																	>
																		Cancel
																	</Button>
																	<Button
																		variant="destructive"
																		type="button"
																		disabled={
																			deleteCategory.isPending &&
																			deleteCategory.variables?.id ===
																				category.id
																		}
																		onClick={() =>
																			deleteCategory.mutate({ id: category.id })
																		}
																	>
																		{deleteCategory.isPending &&
																		deleteCategory.variables?.id === category.id
																			? "Deleting…"
																			: "Delete"}
																	</Button>
																</div>
															</DialogContent>
														</Dialog>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<section
				className="grid gap-6"
				aria-labelledby="settings-transactions-heading"
			>
				<div className="grid gap-3">
					<Separator />
					<h2
						id="settings-transactions-heading"
						className="text-sm font-semibold tracking-tight text-foreground"
					>
						Transactions
					</h2>
				</div>
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle>Display</CardTitle>
						<CardDescription>
							Control how transactions are presented on the transactions page.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label
								className="text-sm font-medium"
								htmlFor="transaction-page-size"
							>
								Default rows per page
							</label>
							<Select
								value={String(settingsQuery.data?.transactionPageSize ?? 25)}
								onValueChange={(value) =>
									updateSettings.mutate({
										transactionPageSize: Number(value) as TransactionPageSize,
									})
								}
							>
								<SelectTrigger id="transaction-page-size" disabled={disabled}>
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
							<p className="text-xs text-muted-foreground">
								Number of transactions loaded per page by default. Can be
								changed on the transactions page at any time.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

			<section
				className="grid gap-6"
				aria-labelledby="settings-dashboard-heading"
			>
				<div className="grid gap-3">
					<Separator />
					<h2
						id="settings-dashboard-heading"
						className="text-sm font-semibold tracking-tight text-foreground"
					>
						Dashboard
					</h2>
				</div>
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle>Charts</CardTitle>
						<CardDescription>
							Choose which analysis charts appear on the dashboard.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-4 py-4">
							<div className="grid gap-1">
								<p className="font-medium text-foreground">Show income chart</p>
								<p className="text-sm text-muted-foreground">
									Display the Income category breakdown card alongside Expenses.
									Hidden by default.
								</p>
							</div>
							<Switch
								checked={settingsQuery.data?.showIncomeChart ?? false}
								disabled={disabled}
								aria-label="Show income chart on dashboard"
								onCheckedChange={(checked) =>
									updateSettings.mutate({ showIncomeChart: checked })
								}
							/>
						</div>
					</CardContent>
				</Card>
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle>Week & paycheck</CardTitle>
						<CardDescription>
							Align weekly and Paycheck (P) views to your pay cycle. Paycheck
							periods are 14-day windows phased to your most recent paycheck
							date; clear the date to fall back to the default calendar bi-week.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<label className="text-sm font-medium" htmlFor="week-start-day">
								Week starts on
							</label>
							<Select
								value={String(settingsQuery.data?.weekStartDay ?? 1)}
								onValueChange={(value) =>
									updateSettings.mutate({
										weekStartDay: Number.parseInt(value, 10) as WeekStartDay,
									})
								}
							>
								<SelectTrigger id="week-start-day" disabled={disabled}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{weekStartDayOptions.map((opt) => (
										<SelectItem key={opt.value} value={String(opt.value)}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								The day of the week each weekly period starts on.
							</p>
						</div>
						<div className="grid gap-2">
							<label className="text-sm font-medium" htmlFor="bi-week-anchor">
								Last paycheck date
							</label>
							<div className="flex items-center gap-2">
								<Input
									id="bi-week-anchor"
									type="date"
									value={settingsQuery.data?.biWeekAnchorDate ?? ""}
									disabled={disabled}
									onChange={(event) => {
										const v = event.target.value;
										if (!v || /^\d{4}-\d{2}-\d{2}$/.test(v)) {
											updateSettings.mutate({
												biWeekAnchorDate: v || null,
											});
										}
									}}
								/>
								{settingsQuery.data?.biWeekAnchorDate ? (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										disabled={disabled}
										onClick={() =>
											updateSettings.mutate({ biWeekAnchorDate: null })
										}
									>
										Clear
									</Button>
								) : null}
							</div>
							<p className="text-xs text-muted-foreground">
								Pick the date of your most recent paycheck. The Paycheck (P)
								view on the dashboard shows spending and transactions for each
								14-day pay cycle anchored to this date.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

		<section
			className="grid gap-6"
			aria-labelledby="settings-charts-heading"
		>
			<div className="grid gap-3">
				<Separator />
				<h2
					id="settings-charts-heading"
					className="text-sm font-semibold tracking-tight text-foreground"
				>
					Dashboard charts
				</h2>
			</div>
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle>Expense chart exclusions</CardTitle>
					<CardDescription>
						Categories selected here are hidden from the Expenses trend chart on
						the dashboard. Useful for large fixed costs like Housing that make
						other categories hard to see.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3">
					{categoriesQuery.isPending ? (
						<p className="text-sm text-muted-foreground">
							Loading categories…
						</p>
					) : (
						sortedCategories
							.filter((c) => c.kind === "expense")
							.map((category) => {
								const excluded =
									settingsQuery.data?.expenseChartExcludedCategories ?? [];
								const isChecked = excluded.some(
									(name) =>
										name.toLowerCase() === category.name.toLowerCase(),
								);
								return (
									<div
										key={category.id}
										className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-3 py-3"
									>
										<p className="text-sm font-medium">{category.name}</p>
										<Switch
											checked={isChecked}
											disabled={disabled}
											aria-label={`Exclude ${category.name} from expense chart`}
											onCheckedChange={(checked) => {
												const current =
													settingsQuery.data
														?.expenseChartExcludedCategories ?? [];
												const next = checked
													? [...current, category.name]
													: current.filter(
															(n) =>
																n.toLowerCase() !==
																category.name.toLowerCase(),
														);
												updateSettings.mutate({
													expenseChartExcludedCategories: next,
												});
											}}
										/>
									</div>
								);
							})
					)}
				</CardContent>
			</Card>
		</section>

		<section
			className="grid gap-6"
			aria-labelledby="settings-data-onboarding-heading"
		>
				<div className="grid gap-3">
					<Separator />
					<h2
						id="settings-data-onboarding-heading"
						className="text-sm font-semibold tracking-tight text-foreground"
					>
						Sample data & onboarding
					</h2>
				</div>
				<div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-stretch">
					<Card className="shadow-sm flex h-full min-w-0 flex-col">
						<CardHeader>
							<CardTitle>Sample data</CardTitle>
						</CardHeader>
						<CardContent className="grid flex-1 gap-4">
							<div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/50 px-4 py-4">
								<div className="grid gap-1">
									<p className="font-medium text-foreground">
										Load sample data
									</p>
									<p className="text-sm text-muted-foreground">
										{sampleDataLoaded
											? "Demo data is currently loaded in this local database."
											: "Demo data is currently removed from this local database."}
									</p>
								</div>
								<Switch
									checked={sampleDataEnabled}
									disabled={disabled}
									aria-label="Toggle sample data"
									onCheckedChange={(checked) =>
										updateSettings.mutate({ sampleDataEnabled: checked })
									}
								/>
							</div>
						</CardContent>
					</Card>
					<Card className="shadow-sm flex h-full w-full flex-col lg:max-w-sm lg:shrink-0">
						<CardHeader className="space-y-1 pb-4">
							<CardTitle className="text-base">Onboarding</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-1 flex-col justify-end pt-0">
							<Button
								type="button"
								variant="outline"
								className="w-full"
								disabled={disabled}
								onClick={() =>
									updateSettings.mutate(
										{ hasSeenOnboarding: false },
										{
											onSuccess: async () => {
												await queryClient.invalidateQueries({
													queryKey: ["settings"],
												});
												await navigate({ to: "/onboarding" });
											},
										},
									)
								}
							>
								View onboarding again
							</Button>
						</CardContent>
					</Card>
				</div>
			</section>
		</main>
	);
}
