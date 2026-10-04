import { Link, useRouterState } from "@tanstack/react-router";
import {
	ArrowLeftRight,
	LayoutDashboard,
	Settings,
	Wallet,
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
	useSidebar,
} from "#/components/ui/sidebar";

const navItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboard,
		shortcut: "⌘1",
	},
	{
		title: "Accounts",
		url: "/accounts",
		icon: Wallet,
		shortcut: "⌘2",
	},
	{
		title: "Transactions",
		url: "/transactions",
		icon: ArrowLeftRight,
		shortcut: "⌘3",
	},
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className="px-3 py-2 group-data-[collapsible=icon]:p-2">
				<div className="flex items-center">
					<Link
						to="/"
						className="flex items-center gap-2.5 px-1 py-1 outline-hidden group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
					>
						<FinLogo className="size-10 shrink-0 shadow-xs" />
						{!isCollapsed && (
							<span className="font-bold text-lg tracking-tight text-foreground group-data-[collapsible=icon]:hidden whitespace-nowrap">
								fin finance
							</span>
						)}
					</Link>
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
											<item.icon />
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
							<Settings />
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
