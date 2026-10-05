import { useRouterState } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import type * as React from "react";
import { AppSidebar } from "#/components/app-sidebar";
import { Button } from "#/components/ui/button";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";

import { useNavigationShortcuts } from "#/hooks/use-navigation-shortcuts";
import { useTheme } from "#/lib/theme";

const pageTitles: Record<string, string> = {
	"/": "Dashboard",
	"/accounts": "Accounts",
	"/transactions": "Transactions",
	"/settings": "Settings",
	"/settings/theme": "Customize Theme",
};

export function getPageTitle(pathname: string): string {
	if (pathname === "/") return "Dashboard";
	if (pathname === "/accounts" || pathname.startsWith("/accounts/"))
		return "Accounts";
	if (pathname === "/transactions" || pathname.startsWith("/transactions/"))
		return "Transactions";
	if (pathname === "/settings/theme") return "Customize Theme";
	if (pathname === "/settings" || pathname.startsWith("/settings/"))
		return "Settings";
	return pageTitles[pathname] ?? "fin finance";
}

export function AppLayout({ children }: { children: React.ReactNode }) {
	useNavigationShortcuts();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const currentPage = getPageTitle(pathname);
	const { config, toggleMode } = useTheme();

	return (
		<SidebarProvider className="flex flex-col h-screen w-screen overflow-hidden">
			{/* Top Window Header / Titlebar */}
			<header
				data-tauri-drag-region
				style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
				className="relative flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 backdrop-blur-md px-3 pl-[84px] select-none z-50 transition-colors"
			>
				<div className="flex items-center gap-2" data-tauri-drag-region>
					<SidebarTrigger className="cursor-pointer md:hidden" />
				</div>

				{/* Centered Page Title */}
				<div
					data-tauri-drag-region
					className="pointer-events-none absolute inset-0 flex items-center justify-center px-16"
				>
					<span className="font-heading font-semibold text-lg sm:text-xl tracking-tight text-foreground select-none leading-none">
						{currentPage}
					</span>
				</div>

				<div className="flex items-center gap-2" data-tauri-drag-region>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={toggleMode}
									className="group/theme text-muted-foreground hover:text-foreground cursor-pointer"
								/>
							}
						>
							{config.mode === "dark" ? (
								<Moon className="transition-transform duration-300 ease-out group-hover/theme:-rotate-12 group-hover/theme:scale-110 group-active/theme:scale-95" />
							) : config.mode === "system" ? (
								<Monitor className="transition-transform duration-200 ease-out group-hover/theme:scale-115 group-active/theme:scale-95" />
							) : (
								<Sun className="transition-transform duration-500 ease-out group-hover/theme:rotate-90 group-hover/theme:scale-110 group-active/theme:scale-95" />
							)}
							<span className="sr-only">Toggle theme</span>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="capitalize">
							{config.mode}
						</TooltipContent>
					</Tooltip>
				</div>
			</header>

			{/* Main Workspace below Titlebar */}
			<div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
				<AppSidebar className="top-11 bottom-0 h-[calc(100svh-2.75rem)]" />
				<SidebarInset className="overflow-auto min-h-0 flex flex-col flex-1">
					{children}
				</SidebarInset>
			</div>
		</SidebarProvider>
	);
}
