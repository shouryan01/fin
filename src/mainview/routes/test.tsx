import { createFileRoute } from "@tanstack/react-router";
import TestPage from "#/test/page";

export const Route = createFileRoute("/test")({
	component: TestPage,
});
