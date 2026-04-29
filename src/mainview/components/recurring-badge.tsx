import { Repeat2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";

type RecurringBadgeProps = {
	className?: string;
	showLabel?: boolean;
};

export function RecurringBadge({
	className,
	showLabel = false,
}: RecurringBadgeProps) {
	const badge = (
		<Badge
			variant="secondary"
			title="Recurring transaction"
			className={cn(
				"shrink-0 rounded-full border border-border/70 bg-muted/60 text-muted-foreground shadow-none hover:bg-muted/60",
				showLabel
					? "gap-1.5 px-2.5 py-1 text-[11px] font-medium"
					: "h-9 w-9 justify-center p-0",
				className,
			)}
		>
			<Repeat2
				className={cn("shrink-0", showLabel ? "size-3.5" : "size-4")}
				aria-hidden="true"
			/>
			{showLabel ? (
				<span>Recurring</span>
			) : (
				<span className="sr-only">Recurring transaction</span>
			)}
		</Badge>
	);

	if (showLabel) {
		return badge;
	}

	return (
		<TooltipProvider delayDuration={150}>
			<Tooltip>
				<TooltipTrigger asChild>{badge}</TooltipTrigger>
				<TooltipContent>Recurring</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
