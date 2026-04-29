import { type Column, CSVImporter } from "@importcsv/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { accountsQueryOptions } from "#/queries/accounts";
import {
	importTransactionsMutation,
	transactionImportsQueryOptions,
	undoTransactionImportMutation,
} from "#/queries/imports";

const importerColumns: Column[] = [
	{
		id: "postedOn",
		label: "Date",
		type: "date",
		validators: [{ type: "required" }],
	},
	{
		id: "description",
		label: "Description",
		type: "string",
		validators: [{ type: "required" }],
	},
	{
		id: "merchant",
		label: "Merchant",
		type: "string",
	},
	{
		id: "memo",
		label: "Memo",
		type: "string",
	},
	{
		id: "amount",
		label: "Amount",
		type: "number",
	},
	{
		id: "debit",
		label: "Debit",
		type: "number",
	},
	{
		id: "credit",
		label: "Credit",
		type: "number",
	},
	{
		id: "category",
		label: "Category",
		type: "string",
	},
	{
		id: "balance",
		label: "Balance",
		type: "number",
	},
	{
		id: "accountName",
		label: "Account",
		type: "string",
	},
];

export default function ImportsScreen() {
	const queryClient = useQueryClient();
	const accountsQuery = useQuery(accountsQueryOptions());
	const transactionImportsQuery = useQuery(transactionImportsQueryOptions());
	const [selectedAccountId, setSelectedAccountId] = useState<string>(
		() => localStorage.getItem("fin_lastSelectedAccountId") || "",
	);
	const [modalOpen, setModalOpen] = useState(false);
	const [confirmUndoImportId, setConfirmUndoImportId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (selectedAccountId) {
			localStorage.setItem("fin_lastSelectedAccountId", selectedAccountId);
		} else if (!selectedAccountId && accountsQuery.data?.[0]?.id) {
			setSelectedAccountId(accountsQuery.data[0].id);
		}
	}, [accountsQuery.data, selectedAccountId]);

	const selectedAccount = useMemo(
		() =>
			accountsQuery.data?.find((account) => account.id === selectedAccountId) ??
			null,
		[accountsQuery.data, selectedAccountId],
	);

	const importMutation = useMutation({
		...importTransactionsMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["imports", "history"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["accounts"] });
			setModalOpen(false);
		},
	});

	const undoMutation = useMutation({
		...undoTransactionImportMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["imports", "history"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["accounts"] });
			setConfirmUndoImportId(null);
		},
	});

	const selectedImport = useMemo(
		() =>
			transactionImportsQuery.data?.find(
				(transactionImport) => transactionImport.id === confirmUndoImportId,
			) ?? null,
		[confirmUndoImportId, transactionImportsQuery.data],
	);

	return (
		<main className="grid gap-6 p-4 lg:p-6">
			<section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
				<Card className="shadow-sm">
					<CardContent className="grid gap-4 pt-6">
						<div className="grid gap-2">
							<label
								className="text-sm font-medium"
								htmlFor="destination-account"
							>
								Destination account
							</label>
							<Select
								value={selectedAccountId}
								onValueChange={setSelectedAccountId}
							>
								<SelectTrigger id="destination-account">
									<SelectValue placeholder="Pick an account" />
								</SelectTrigger>
								<SelectContent>
									{accountsQuery.data?.map((account) => (
										<SelectItem key={account.id} value={account.id}>
											{account.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="rounded-2xl border border-dashed border-border bg-muted/50 p-6">
							<div className="flex flex-col gap-2">
								<h3 className="text-lg font-semibold text-foreground">
									Import recent transactions
								</h3>
							</div>
							<Button
								className="mt-4 gap-2"
								onClick={() => setModalOpen(true)}
								disabled={!selectedAccountId}
							>
								<Upload className="h-4 w-4" />
								Open importer
							</Button>
						</div>
						<CSVImporter
							columns={importerColumns}
							modalIsOpen={modalOpen}
							modalOnCloseTriggered={() => setModalOpen(false)}
							isModal
							waitOnComplete
							invalidRowHandling="include"
							includeUnmatchedColumns
							theme="minimal"
							primaryColor="#0f172a"
							onComplete={async (data) => {
								if (!selectedAccountId) {
									return;
								}
								await importMutation.mutateAsync({
									accountId: selectedAccountId,
									sourceName:
										selectedAccount?.institutionName ??
										selectedAccount?.name ??
										"Bank CSV",
									rows: data.rows,
								});
							}}
						/>
					</CardContent>
				</Card>

				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle>Recent imports</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3">
						{transactionImportsQuery.data?.length ? (
							transactionImportsQuery.data.map((transactionImport) => {
								const undoPending =
									undoMutation.isPending &&
									undoMutation.variables?.importId === transactionImport.id;

								return (
									<div
										key={transactionImport.id}
										className="rounded-xl border border-border bg-muted/40 p-4"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate font-medium text-foreground">
													{transactionImport.sourceName}
												</p>
												<p className="text-sm text-muted-foreground">
													{transactionImport.accountName} ·{" "}
													{formatImportTimestamp(transactionImport.createdAt)}
												</p>
											</div>
											{transactionImport.canUndo ? (
												<Badge variant="secondary">Undo available</Badge>
											) : (
												<Badge variant="outline">Legacy import</Badge>
											)}
										</div>
										<div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
											<ImportMetric
												label="Rows"
												value={transactionImport.rowCount}
											/>
											<ImportMetric
												label="Imported"
												value={transactionImport.importedCount}
											/>
											<ImportMetric
												label="Duplicates"
												value={transactionImport.duplicateCount}
											/>
											<ImportMetric
												label="Skipped"
												value={transactionImport.skippedCount}
											/>
											<ImportMetric
												label="Snapshots"
												value={transactionImport.createdSnapshotCount}
											/>
										</div>
										<div className="mt-4 flex justify-end">
											{transactionImport.canUndo ? (
												<Button
													variant="destructive"
													size="sm"
													onClick={() =>
														setConfirmUndoImportId(transactionImport.id)
													}
													disabled={undoPending}
												>
													{undoPending ? "Undoing..." : "Undo import"}
												</Button>
											) : (
												<p className="text-xs text-muted-foreground">
													Undo is only available for new imports.
												</p>
											)}
										</div>
									</div>
								);
							})
						) : (
							<div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
								No imports yet.
							</div>
						)}
					</CardContent>
				</Card>
			</section>
			<Dialog
				open={selectedImport !== null}
				onOpenChange={(open) => {
					if (!open) {
						setConfirmUndoImportId(null);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Undo import</DialogTitle>
						<DialogDescription>
							This will remove the imported transactions, delete any balance
							snapshots created by the import, and erase the import history
							entry.
						</DialogDescription>
					</DialogHeader>
					{selectedImport ? (
						<div className="grid gap-3 text-sm">
							<div className="rounded-xl bg-muted/50 p-4">
								<p className="font-medium text-foreground">
									{selectedImport.sourceName}
								</p>
								<p className="text-muted-foreground">
									{selectedImport.accountName} ·{" "}
									{formatImportTimestamp(selectedImport.createdAt)}
								</p>
							</div>
							<div className="grid gap-2 rounded-xl border border-border p-4 text-muted-foreground">
								<p>
									Transactions to remove:{" "}
									<span className="font-medium text-foreground">
										{selectedImport.importedCount}
									</span>
								</p>
								<p>
									Snapshots to remove:{" "}
									<span className="font-medium text-foreground">
										{selectedImport.createdSnapshotCount}
									</span>
								</p>
							</div>
						</div>
					) : null}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmUndoImportId(null)}
							disabled={undoMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!selectedImport) {
									return;
								}
								undoMutation.mutate({ importId: selectedImport.id });
							}}
							disabled={!selectedImport || undoMutation.isPending}
						>
							{undoMutation.isPending ? "Undoing..." : "Undo import"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}

function ImportMetric({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-full bg-background px-3 py-1">
			<span>{label}: </span>
			<span className="font-medium text-foreground">{value}</span>
		</div>
	);
}

function formatImportTimestamp(timestamp: number) {
	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(timestamp * 1000));
}
