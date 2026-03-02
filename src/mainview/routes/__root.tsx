import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { env } from "#/env";
import TanStackQueryProvider from "#/integrations/tanstack-query/root-provider";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<TanStackQueryProvider>
			<div className="min-h-screen bg-slate-50 text-slate-900">
				<div className="electrobun-webkit-app-region-drag sticky top-0 z-10 h-7 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
					<div className="mx-auto h-full max-w-5xl" />
				</div>
				<div className="electrobun-webkit-app-region-no-drag">
					<header className="border-b border-slate-200 bg-white">
						<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
							<h1 className="text-sm font-semibold tracking-wide uppercase">
								{env.VITE_APP_TITLE ?? "fin"}
							</h1>
							<nav className="flex items-center gap-2">
								<Link
									to="/"
									className="rounded-md px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
									activeProps={{
										className: "rounded-md bg-slate-200 px-3 py-1 text-sm",
									}}
								>
									Home
								</Link>
								<Link
									to="/test"
									className="rounded-md px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
									activeProps={{
										className: "rounded-md bg-slate-200 px-3 py-1 text-sm",
									}}
								>
									Test
								</Link>
								<Link
									to="/blag"
									className="rounded-md px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
									activeProps={{
										className: "rounded-md bg-slate-200 px-3 py-1 text-sm",
									}}
								>
									Blag
								</Link>
							</nav>
						</div>
					</header>
					<Outlet />
				</div>
			</div>
			<ReactQueryDevtools initialIsOpen={false} />
		</TanStackQueryProvider>
	);
}
