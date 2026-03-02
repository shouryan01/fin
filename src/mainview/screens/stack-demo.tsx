import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { defaultPeople, type Person } from "#/data/demo-table-data";
import { Link } from "@tanstack/react-router";

export default function StackDemo() {
	const [people, setPeople] = useState<Person[]>(defaultPeople);

	const statsQuery = useQuery({
		queryKey: ["dashboard-stats"],
		queryFn: async () => {
			await new Promise((resolve) => setTimeout(resolve, 120));
			return {
				users: 128,
				monthlyActive: 87,
			};
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
		},
		onSubmit: async ({ value }) => {
			setPeople((current) => [
				...current,
				{
					id: current.length + 1,
					name: value.name,
					email: value.email,
					visits: Math.floor(Math.random() * 25) + 1,
				},
			]);
			form.reset();
		},
	});

	const columns = useMemo<ColumnDef<Person>[]>(
		() => [
			{ accessorKey: "id", header: "ID" },
			{ accessorKey: "name", header: "Name" },
			{ accessorKey: "email", header: "Email" },
			{ accessorKey: "visits", header: "Visits" },
		],
		[],
	);

	const table = useReactTable({
		data: people,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<main className="mx-auto grid max-w-5xl gap-6 px-4 py-6">
			<section className="rounded-lg border border-slate-200 bg-white p-4">
				<h2 className="mb-3 text-lg font-semibold">TanStack Query</h2>
				{statsQuery.isPending ? (
					<p className="text-sm text-slate-500">Loading stats...</p>
				) : (
					<p className="text-sm text-slate-700">
						Users:{" "}
						<span className="font-semibold">{statsQuery.data.users}</span> ·
						Monthly Active:{" "}
						<span className="font-semibold">
							{statsQuery.data.monthlyActive}
						</span>
					</p>
				)}
			</section>

			<section className="rounded-lg border border-slate-200 bg-white p-4">
				<Link
					to="/test"
					className="text-sm text-slate-700 hover:text-slate-900"
				>
					Test Page
				</Link>
				<h2 className="mb-3 text-lg font-semibold">TanStack Form + shadcn</h2>
				<form
					className="grid gap-3 sm:grid-cols-3"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field
						name="name"
						validators={{
							onChange: ({ value }) =>
								value.length < 2 ? "Name must be at least 2 chars" : undefined,
						}}
					>
						{(field) => (
							<div>
								<Input
									placeholder="Name"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								{field.state.meta.errors[0] ? (
									<p className="mt-1 text-xs text-red-600">
										{String(field.state.meta.errors[0])}
									</p>
								) : null}
							</div>
						)}
					</form.Field>
					<form.Field
						name="email"
						validators={{
							onChange: ({ value }) =>
								value.includes("@") ? undefined : "Email must include @",
						}}
					>
						{(field) => (
							<div>
								<Input
									type="email"
									placeholder="Email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								{field.state.meta.errors[0] ? (
									<p className="mt-1 text-xs text-red-600">
										{String(field.state.meta.errors[0])}
									</p>
								) : null}
							</div>
						)}
					</form.Field>
					<div className="flex items-start sm:justify-end">
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Saving..." : "Add Row"}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>
			</section>

			<section className="rounded-lg border border-slate-200 bg-white p-4">
				<h2 className="mb-3 text-lg font-semibold">TanStack Table</h2>
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-left text-sm">
						<thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id} className="border-b border-slate-200">
									{headerGroup.headers.map((header) => (
										<th key={header.id} className="px-3 py-2 font-semibold">
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.map((row) => (
								<tr key={row.id} className="border-b border-slate-100">
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-3 py-2 text-slate-700">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</main>
	);
}
