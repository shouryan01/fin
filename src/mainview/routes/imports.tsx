import { createFileRoute } from "@tanstack/react-router";
import ImportsScreen from "#/screens/imports";

export const Route = createFileRoute("/imports")({
	component: ImportsScreen,
});
