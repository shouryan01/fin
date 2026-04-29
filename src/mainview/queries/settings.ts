import { queryOptions } from "@tanstack/react-query";
import { getAppSettings, updateAppSettings } from "#/db";

export const settingsQueryOptions = () =>
	queryOptions({
		queryKey: ["settings"],
		queryFn: () => getAppSettings(),
	});

export const updateAppSettingsMutation = {
	mutationKey: ["settings", "update"],
	mutationFn: updateAppSettings,
};
