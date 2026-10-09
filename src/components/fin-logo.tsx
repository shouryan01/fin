import type * as React from "react";
import { cn } from "#/lib/utils";

export interface FinLogoProps extends React.ComponentProps<"svg"> {
	rx?: number;
	animate?: "hover" | "always" | "none";
}

export function FinLogo({
	className,
	rx = 248,
	animate = "hover",
	...props
}: FinLogoProps) {
	return (
		<svg
			viewBox="0 0 1024 1024"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn("size-6 shrink-0 fin-logo", className)}
			data-animated={animate}
			{...props}
		>
			<title>fin</title>
			<rect width="1024" height="1024" rx={rx} fill="#3B82F6" />
			<style>{`
				@keyframes fin-swim {
					0% {
						transform: translate3d(0px, 0px, 0) rotate(0deg) skewX(0deg);
					}
					22% {
						transform: translate3d(-1.8px, -0.2px, 0) rotate(-1.8deg) skewX(-1.4deg);
					}
					42% {
						transform: translate3d(-2.8px, 0px, 0) rotate(0.4deg) skewX(0.6deg);
					}
					65% {
						transform: translate3d(-1.4px, -0.1px, 0) rotate(1.4deg) skewX(1.2deg);
					}
					85% {
						transform: translate3d(0.4px, 0.1px, 0) rotate(-0.4deg) skewX(-0.4deg);
					}
					100% {
						transform: translate3d(0px, 0px, 0) rotate(0deg) skewX(0deg);
					}
				}
				@keyframes fin-shimmer {
					0%, 100% { opacity: 0.22; }
					35% { opacity: 0.42; }
					70% { opacity: 0.15; }
				}
				@keyframes fin-wake-front {
					0%, 100% {
						transform: translateX(0px) scaleX(0.85);
						opacity: 0.3;
					}
					30% {
						transform: translateX(-0.6px) scaleX(1.25);
						opacity: 0.75;
					}
					70% {
						transform: translateX(2.5px) scaleX(0.95);
						opacity: 0.25;
					}
				}
				@keyframes fin-wake-mid {
					0%, 100% {
						transform: translateX(0px) scaleX(0.9);
						opacity: 0.2;
					}
					38% {
						transform: translateX(3px) scaleX(1.3);
						opacity: 0.65;
					}
					78% {
						transform: translateX(5.5px) scaleX(1.0);
						opacity: 0.15;
					}
				}
				@keyframes fin-wake-rear {
					0%, 100% {
						transform: translateX(0px) scaleX(0.85);
						opacity: 0.15;
					}
					45% {
						transform: translateX(4px) scaleX(1.35);
						opacity: 0.55;
					}
					85% {
						transform: translateX(7px) scaleX(1.1);
						opacity: 0.1;
					}
				}
				@keyframes fin-wake-tail {
					0%, 100% {
						transform: translateX(0px) scaleX(0.7);
						opacity: 0.05;
					}
					50% {
						transform: translateX(5px) scaleX(1.3);
						opacity: 0.4;
					}
					90% {
						transform: translateX(9px) scaleX(0.9);
						opacity: 0;
					}
				}
				.fin-body {
					transform-origin: 50% 92%;
					transform-box: fill-box;
					transition: transform 0.4s ease-out;
				}
				.fin-highlight {
					transition: opacity 0.4s ease-out;
				}
				.fin-wake-1, .fin-wake-2, .fin-wake-3, .fin-wake-4 {
					transform-origin: center;
					transform-box: fill-box;
					transition: transform 0.4s ease-out, opacity 0.4s ease-out;
				}
				.fin-logo[data-animated="hover"]:hover .fin-body,
				.group\\/logo:hover .fin-logo[data-animated="hover"] .fin-body,
				.group-logo:hover .fin-logo[data-animated="hover"] .fin-body {
					animation: fin-swim 1.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
				}
				.fin-logo[data-animated="hover"]:hover .fin-highlight,
				.group\\/logo:hover .fin-logo[data-animated="hover"] .fin-highlight,
				.group-logo:hover .fin-logo[data-animated="hover"] .fin-highlight {
					animation: fin-shimmer 1.8s ease-in-out infinite;
				}
				.fin-logo[data-animated="hover"]:hover .fin-wake-1,
				.group\\/logo:hover .fin-logo[data-animated="hover"] .fin-wake-1,
				.group-logo:hover .fin-logo[data-animated="hover"] .fin-wake-1 {
					animation: fin-wake-front 1.8s ease-in-out infinite;
				}
				.fin-logo[data-animated="hover"]:hover .fin-wake-3,
				.group\\/logo:hover .fin-logo[data-animated="hover"] .fin-wake-3,
				.group-logo:hover .fin-logo[data-animated="hover"] .fin-wake-3 {
					animation: fin-wake-mid 1.8s ease-in-out infinite;
					animation-delay: 0.25s;
				}
				.fin-logo[data-animated="hover"]:hover .fin-wake-2,
				.group\\/logo:hover .fin-logo[data-animated="hover"] .fin-wake-2,
				.group-logo:hover .fin-logo[data-animated="hover"] .fin-wake-2 {
					animation: fin-wake-rear 1.8s ease-in-out infinite;
					animation-delay: 0.5s;
				}
				.fin-logo[data-animated="hover"]:hover .fin-wake-4,
				.group\\/logo:hover .fin-logo[data-animated="hover"] .fin-wake-4,
				.group-logo:hover .fin-logo[data-animated="hover"] .fin-wake-4 {
					animation: fin-wake-tail 1.8s ease-in-out infinite;
					animation-delay: 0.75s;
				}
				.fin-logo[data-animated="always"] .fin-body {
					animation: fin-swim 1.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
				}
				.fin-logo[data-animated="always"] .fin-highlight {
					animation: fin-shimmer 1.8s ease-in-out infinite;
				}
				.fin-logo[data-animated="always"] .fin-wake-1 {
					animation: fin-wake-front 1.8s ease-in-out infinite;
				}
				.fin-logo[data-animated="always"] .fin-wake-3 {
					animation: fin-wake-mid 1.8s ease-in-out infinite;
					animation-delay: 0.25s;
				}
				.fin-logo[data-animated="always"] .fin-wake-2 {
					animation: fin-wake-rear 1.8s ease-in-out infinite;
					animation-delay: 0.5s;
				}
				.fin-logo[data-animated="always"] .fin-wake-4 {
					animation: fin-wake-tail 1.8s ease-in-out infinite;
					animation-delay: 0.75s;
				}
				@media (prefers-reduced-motion: reduce) {
					.fin-body, .fin-highlight, .fin-wake-1, .fin-wake-2, .fin-wake-3, .fin-wake-4 {
						animation: none !important;
					}
				}
			`}</style>
			<g transform="translate(150 120) scale(11.4)">
				<g className="fin-body">
					<path
						d="M10.5 52.2c1.1-5.2 3.5-11 7.2-17.4 4.5-7.9 9.8-14.1 15.9-18.4 3.2-2.3 6.1-4 8.8-5 1.9-.7 3.4-.8 4.6-.2 1.2.6 2.1 1.9 2.6 4 .9 4.7 2.2 9.1 3.8 13.2 1.9 5 4.1 9.3 6.5 12.8 1 1.5 1.3 2.9 1 4.1-.4 1.2-1.5 2.2-3.3 3-2.4 1-5.4 1.9-9.1 2.5-7.7 1.2-16.8 1.6-27.1 1.1-.9 0-1.6-.3-2.1-.8-.5-.5-.6-1.1-.4-1.9Z"
						fill="white"
					/>
					<path
						className="fin-highlight"
						d="M31.8 50c4.8-.2 9.1-.6 12.9-1.2 3.1-.5 5.7-1.1 7.9-1.9-2.3-3.4-4.4-7.4-6.1-11.9-1.2-3-2.1-6.2-2.9-9.7-2.5 1.4-5 3.3-7.6 5.8-4.4 4.2-8 10.5-10.9 19 2 0 4.3 0 6.7-.1Z"
						fill="white"
						opacity="0.22"
					/>
				</g>
				<path
					className="fin-wake-1"
					d="M15.5 54c3 .6 6.4 1 10.2 1.1"
					stroke="white"
					strokeWidth="2.6"
					strokeLinecap="round"
					opacity="0.34"
				/>
				<path
					className="fin-wake-3"
					d="M27.5 54.8c3.5.2 7-.1 10.5-.7"
					stroke="white"
					strokeWidth="2.6"
					strokeLinecap="round"
					opacity="0"
				/>
				<path
					className="fin-wake-2"
					d="M39.8 54.4c2.5-.1 4.8-.4 7-.9"
					stroke="white"
					strokeWidth="2.6"
					strokeLinecap="round"
					opacity="0.22"
				/>
				<path
					className="fin-wake-4"
					d="M48.5 53.6c2.8-.2 5.8-.6 8.5-1.2"
					stroke="white"
					strokeWidth="2.4"
					strokeLinecap="round"
					opacity="0"
				/>
			</g>
		</svg>
	);
}
