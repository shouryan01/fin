import type { ComponentPropsWithoutRef } from "react";
import { cn } from "#/lib/utils";

type BrandLogoProps = ComponentPropsWithoutRef<"svg"> & {
	title?: string;
};

export function BrandLogo({
	className,
	title = "Fin logo",
	...props
}: BrandLogoProps) {
	const accessibleTitle = title?.trim();

	return (
		<svg
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn("h-5 w-5", className)}
			aria-hidden={accessibleTitle ? undefined : true}
			aria-label={accessibleTitle}
			role="img"
			{...props}
		>
			<path
				fill="currentColor"
				d="M10.5 52.2c1.1-5.2 3.5-11 7.2-17.4 4.5-7.9 9.8-14.1 15.9-18.4 3.2-2.3 6.1-4 8.8-5 1.9-.7 3.4-.8 4.6-.2 1.2.6 2.1 1.9 2.6 4 .9 4.7 2.2 9.1 3.8 13.2 1.9 5 4.1 9.3 6.5 12.8 1 1.5 1.3 2.9 1 4.1-.4 1.2-1.5 2.2-3.3 3-2.4 1-5.4 1.9-9.1 2.5-7.7 1.2-16.8 1.6-27.1 1.1-.9 0-1.6-.3-2.1-.8-.5-.5-.6-1.1-.4-1.9Z"
			/>
			<path
				fill="currentColor"
				opacity="0.2"
				d="M31.8 50c4.8-.2 9.1-.6 12.9-1.2 3.1-.5 5.7-1.1 7.9-1.9-2.3-3.4-4.4-7.4-6.1-11.9-1.2-3-2.1-6.2-2.9-9.7-2.5 1.4-5 3.3-7.6 5.8-4.4 4.2-8 10.5-10.9 19 2 0 4.3 0 6.7-.1Z"
			/>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.6"
				opacity="0.3"
				d="M15.5 54c3 .6 6.4 1 10.2 1.1"
			/>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="2.6"
				opacity="0.2"
				d="M39.8 54.4c2.5-.1 4.8-.4 7-.9"
			/>
		</svg>
	);
}
