import { Link } from "@tanstack/react-router";
import type * as React from "react";
import { Button } from "./ui/button";

export function NotFound({
	children,
}: {
	data?: unknown;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
			<div className="max-w-md space-y-4">
				<h1 className="text-6xl font-bold tracking-tight text-primary">404</h1>
				<h2 className="text-2xl font-semibold tracking-tight">
					Page Not Found
				</h2>
				<div className="text-muted-foreground text-sm">
					{children || (
						<p>
							The page you are looking for does not exist or has been moved.
						</p>
					)}
				</div>
				<div className="flex items-center justify-center gap-3 pt-2">
					<Button
						variant="outline"
						onClick={() => {
							if (typeof window !== "undefined") {
								window.history.back();
							}
						}}
					>
						Go back
					</Button>
					<Button asChild>
						<Link to="/">Go Home</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
