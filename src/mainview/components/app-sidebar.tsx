import { Link, useLocation } from "@tanstack/react-router";
import {
	Landmark,
	LayoutDashboard,
	Moon,
	PanelLeft,
	Settings,
	Sun,
	Upload,
	Wallet,
} from "lucide-react";
import { BrandLogo } from "#/components/brand-logo";
import { useTheme } from "#/components/theme-provider";
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
	useSidebar,
} from "#/components/ui/sidebar";

function CollapseTrigger() {
	const { toggleSidebar, state } = useSidebar();
	return (
		<SidebarMenuButton onClick={toggleSidebar} tooltip="Toggle sidebar">
			<PanelLeft className="h-4 w-4" />
			<span>{state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}</span>
		</SidebarMenuButton>
	);
}

const navigation = [
	{ label: "Dashboard", to: "/", icon: LayoutDashboard },
	{ label: "Transactions", to: "/transactions", icon: Wallet },
	{ label: "Accounts", to: "/accounts", icon: Landmark },
	{ label: "Imports", to: "/imports", icon: Upload },
] as const;

export function AppSidebar() {
	const location = useLocation();
	const { theme, isSystemTheme, toggleTheme } = useTheme();

	return (
		<Sidebar collapsible="icon" variant="inset">
			<SidebarHeader className="border-b border-sidebar-border px-3 pb-3 pt-10 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-2">
				<Link
					to="/"
					className="flex items-center justify-start gap-3 rounded-xl px-2 py-1.5 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
				>
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-sm group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
						<BrandLogo className="h-8 w-8" />
					</div>
					<div className="min-w-0 group-data-[collapsible=icon]:hidden">
						<div className="flex flex-col">
							<span className="text-xl font-semibold tracking-tight text-sidebar-foreground">
								fin
							</span>
							<span className="-mt-0.5 text-sm font-semibold tracking-tight text-sidebar-foreground/70">
								finance
							</span>
						</div>
					</div>
				</Link>
			</SidebarHeader>
			<SidebarContent className="pt-2">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navigation.map((item) => {
								const Icon = item.icon;
								const active = location.pathname === item.to;
								return (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											asChild
											isActive={active}
											tooltip={item.label}
										>
											<Link to={item.to}>
												<Icon className="h-4 w-4" />
												<span>{item.label}</span>
											</Link>
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
						<CollapseTrigger />
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={toggleTheme}
							tooltip={
								isSystemTheme ? "Theme (following system by default)" : "Theme"
							}
						>
							{theme === "dark" ? (
								<Sun className="h-4 w-4" />
							) : (
								<Moon className="h-4 w-4" />
							)}
							<span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={location.pathname === "/settings"}
							tooltip="Settings"
						>
							<Link to="/settings">
								<Settings className="h-4 w-4" />
								<span>Settings</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
