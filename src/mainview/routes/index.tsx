import { createFileRoute } from "@tanstack/react-router";
import StackDemo from "#/screens/stack-demo";

export const Route = createFileRoute("/")({
	component: StackDemo,
});
