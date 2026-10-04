import { Link, useRouterState } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import type * as React from "react";
import { AppSidebar } from "#/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
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

export function AppLayout({ children }: { children: React.ReactNode }) {
	useNavigationShortcuts();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const currentPage = pageTitles[pathname] ?? "Overview";
	const { config, toggleMode } = useTheme();

	return (
		<SidebarProvider className="flex flex-col h-screen w-screen overflow-hidden">
			{/* Top Window Header / Titlebar */}
			<header
				data-tauri-drag-region
				style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
				className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 backdrop-blur-md px-3 pl-[78px] select-none z-50 transition-colors"
			>
				<div className="flex items-center gap-2" data-tauri-drag-region>
					<SidebarTrigger className="-ml-1 cursor-pointer" />
					<Separator orientation="vertical" className="mr-1 h-4" />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className="hidden sm:block">
								<BreadcrumbLink render={<Link to="/" />}>
									fin finance
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden sm:block" />
							{pathname === "/settings/theme" ? (
								<>
									<BreadcrumbItem>
										<BreadcrumbLink render={<Link to="/settings" />}>
											Settings
										</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator />
									<BreadcrumbItem>
										<BreadcrumbPage>Customize Theme</BreadcrumbPage>
									</BreadcrumbItem>
								</>
							) : (
								<BreadcrumbItem>
									<BreadcrumbPage>{currentPage}</BreadcrumbPage>
								</BreadcrumbItem>
							)}
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				<div className="flex items-center gap-2" data-tauri-drag-region>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={toggleMode}
									className="text-muted-foreground hover:text-foreground cursor-pointer"
								/>
							}
						>
							{config.mode === "dark" ? (
								<Moon />
							) : config.mode === "system" ? (
								<Monitor />
							) : (
								<Sun />
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
