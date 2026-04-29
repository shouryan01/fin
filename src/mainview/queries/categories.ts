import { queryOptions } from "@tanstack/react-query";
import {
	createCategory,
	deleteCategory,
	listCategories,
	updateCategory,
} from "#/db";

export const categoriesQueryOptions = () =>
	queryOptions({
		queryKey: ["categories"],
		queryFn: () => listCategories(),
	});

export const createCategoryMutation = {
	mutationKey: ["categories", "create"],
	mutationFn: createCategory,
};

export const updateCategoryMutation = {
	mutationKey: ["categories", "update"],
	mutationFn: updateCategory,
};

export const deleteCategoryMutation = {
	mutationKey: ["categories", "delete"],
	mutationFn: deleteCategory,
};
