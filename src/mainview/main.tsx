import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "#/lib/electroview";
import { initializeTheme } from "#/components/theme-provider";
import { router } from "./router";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root was not found");
}

initializeTheme();

createRoot(rootElement).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
