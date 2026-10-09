import { Link, useRouterState } from "@tanstack/react-router";
import {
	ArrowLeftRight,
	ArrowRightLeft,
	LayoutDashboard,
	LayoutGrid,
	PanelLeftOpen,
	Settings,
	Wallet,
	WalletCards,
} from "lucide-react";
import type * as React from "react";
import { FinLogo } from "#/components/fin-logo";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarTrigger,
	useSidebar,
} from "#/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";

const navItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboard,
		shortcut: "⌘1",
		renderIcon: () => (
			<span className="relative flex size-4 shrink-0 items-center justify-center group-data-[collapsible=icon]:size-[18px]">
				<LayoutDashboard className="size-full shrink-0 transition-all duration-300 ease-out group-hover/menu-button:opacity-0 group-hover/menu-button:scale-75" />
				<LayoutGrid className="size-full shrink-0 absolute inset-0 m-auto transition-all duration-300 ease-out opacity-0 scale-75 group-hover/menu-button:opacity-100 group-hover/menu-button:scale-110" />
			</span>
		),
	},
	{
		title: "Accounts",
		url: "/accounts",
		icon: Wallet,
		shortcut: "⌘2",
		renderIcon: () => (
			<span className="relative flex size-4 shrink-0 items-center justify-center group-data-[collapsible=icon]:size-[18px]">
				<Wallet className="size-full shrink-0 transition-all duration-300 ease-out group-hover/menu-button:opacity-0 group-hover/menu-button:scale-75 group-hover/menu-button:-rotate-12" />
				<WalletCards className="size-full shrink-0 absolute inset-0 m-auto transition-all duration-300 ease-out opacity-0 scale-75 rotate-12 group-hover/menu-button:opacity-100 group-hover/menu-button:scale-110 group-hover/menu-button:rotate-0" />
			</span>
		),
	},
	{
		title: "Transactions",
		url: "/transactions",
		icon: ArrowLeftRight,
		shortcut: "⌘3",
		renderIcon: () => (
			<span className="relative flex size-4 shrink-0 items-center justify-center group-data-[collapsible=icon]:size-[18px]">
				<ArrowLeftRight className="size-full shrink-0 transition-all duration-300 ease-out group-hover/menu-button:opacity-0 group-hover/menu-button:scale-75" />
				<ArrowRightLeft className="size-full shrink-0 absolute inset-0 m-auto transition-all duration-300 ease-out opacity-0 scale-75 group-hover/menu-button:opacity-100 group-hover/menu-button:scale-110" />
			</span>
		),
	},
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { toggleSidebar } = useSidebar();

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="px-3 py-2 group-data-[collapsible=icon]:p-2">
				{/* Expanded: icon + text links to dashboard, collapse button in line to the side */}
				<div className="flex items-center justify-between w-full group-data-[collapsible=icon]:hidden">
					<Link
						to="/"
						className="group/logo group-logo flex items-center gap-2.5 px-1 py-1 outline-hidden rounded-md min-w-0"
						title="Dashboard"
					>
						<FinLogo className="size-11 shrink-0 shadow-xs" />
						<span className="font-bold text-lg tracking-tight text-foreground truncate">
							fin
						</span>
					</Link>
					<SidebarTrigger className="-mr-2.5" />
				</div>

				{/* Collapsed: show the icon, only on hover change it to expand button, clicking expands */}
				<div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full py-0.5">
					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									aria-label="Open sidebar"
									onClick={toggleSidebar}
									className="group/expand relative flex size-[38px] items-center justify-center rounded-xl cursor-pointer transition-all duration-200 hover:bg-sidebar-accent text-sidebar-foreground"
								>
									<FinLogo className="size-11 shrink-0 shadow-xs transition-all duration-200 group-hover/expand:scale-50 group-hover/expand:opacity-0" />
									<PanelLeftOpen className="size-[18px] absolute inset-0 m-auto text-foreground transition-all duration-200 scale-75 opacity-0 group-hover/expand:scale-100 group-hover/expand:opacity-100" />
								</button>
							}
						/>
						<TooltipContent side="right" align="center">
							<div className="flex items-center gap-2">
								<span>Open sidebar</span>
								<kbd data-slot="kbd">⌘B</kbd>
							</div>
						</TooltipContent>
					</Tooltip>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const active =
									item.url === "/"
										? pathname === "/"
										: pathname.startsWith(item.url);
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											render={<Link to={item.url} />}
											isActive={active}
											tooltip={{
												children: (
													<div className="flex items-center gap-2">
														<span>{item.title}</span>
														<kbd data-slot="kbd">{item.shortcut}</kbd>
													</div>
												),
											}}
										>
											{item.renderIcon ? (
												item.renderIcon()
											) : (
												<item.icon className="transition-transform duration-200 ease-out group-hover/menu-button:scale-115 group-active/menu-button:scale-95" />
											)}
											<span className="group-data-[collapsible=icon]:hidden">
												{item.title}
											</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={<Link to="/settings" />}
							isActive={pathname.startsWith("/settings")}
							tooltip={{
								children: (
									<div className="flex items-center gap-2">
										<span>Settings</span>
										<kbd data-slot="kbd">⌘,</kbd>
									</div>
								),
							}}
						>
							<span className="relative flex size-4 shrink-0 items-center justify-center group-data-[collapsible=icon]:size-[18px]">
								<Settings className="size-full shrink-0 transition-transform duration-500 cubic-bezier(0.34,1.56,0.64,1) group-hover/menu-button:rotate-90 group-hover/menu-button:scale-110 group-active/menu-button:scale-95" />
							</span>
							<span className="group-data-[collapsible=icon]:hidden">
								Settings
							</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
