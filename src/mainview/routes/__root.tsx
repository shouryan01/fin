import { useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRoute,
	Outlet,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "#/components/app-sidebar";
import { ThemeProvider } from "#/components/theme-provider";
import { Button } from "#/components/ui/button";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import { env } from "#/env";
import TanStackQueryProvider from "#/integrations/tanstack-query/root-provider";
import { settingsQueryOptions } from "#/queries/settings";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const location = useLocation();
	const isOnboarding = location.pathname === "/onboarding";

	return (
		<ThemeProvider>
			<TanStackQueryProvider>
				{isOnboarding ? (
					<Outlet />
				) : (
					<SidebarProvider defaultOpen>
						<AppSidebar />
						<SidebarInset>
							<FinanceLayout />
						</SidebarInset>
					</SidebarProvider>
				)}
				<ReactQueryDevtools initialIsOpen={false} />
			</TanStackQueryProvider>
		</ThemeProvider>
	);
}

function FinanceLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const settingsQuery = useQuery(settingsQueryOptions());

	useEffect(() => {
		if (
			location.pathname === "/index.html" ||
			location.pathname === "/mainview/index.html"
		) {
			void navigate({ to: "/", replace: true });
		}
	}, [location.pathname, navigate]);

	useEffect(() => {
		// Also skip while refetching — prevents a stale cached value from
		// firing a redirect immediately after the onboarding mutation completes.
		if (
			settingsQuery.isPending ||
			settingsQuery.isError ||
			settingsQuery.isFetching
		) {
			return;
		}
		if (!settingsQuery.data?.hasSeenOnboarding) {
			void navigate({ to: "/onboarding", replace: true });
		}
	}, [
		navigate,
		settingsQuery.data?.hasSeenOnboarding,
		settingsQuery.isError,
		settingsQuery.isPending,
		settingsQuery.isFetching,
	]);

	const isDashboardPath =
		location.pathname === "/" ||
		location.pathname === "/index.html" ||
		location.pathname === "/mainview/index.html";

	const routeTitle = isDashboardPath
		? "Monthly Overview"
		: location.pathname === "/transactions"
			? "Transactions"
			: location.pathname === "/accounts"
				? "Accounts"
				: location.pathname === "/imports"
					? "CSV Imports"
					: location.pathname === "/settings"
						? "Settings"
						: (env.VITE_APP_TITLE ?? "fin");

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="electrobun-webkit-app-region-drag sticky top-0 z-20 h-12 bg-background/95 backdrop-blur">
				<div className="h-full" />
			</div>
			<div className="electrobun-webkit-app-region-no-drag">
				{!isDashboardPath && (
					<header className="sticky top-12 z-10 flex items-center justify-between border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
						<div>
							<h1 className="text-2xl font-semibold tracking-tight text-foreground">
								{routeTitle}
							</h1>
						</div>
					</header>
				)}
				<Outlet />
			</div>
		</div>
	);
}
