import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getDashboard } from "#/db";

export const dashboardQueryOptions = (period: string, anchor: string) =>
	queryOptions({
		queryKey: ["dashboard", period, anchor],
		queryFn: () => getDashboard(period, anchor),
		placeholderData: keepPreviousData,
	});
