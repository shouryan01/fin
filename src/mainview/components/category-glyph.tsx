import type { LucideIcon } from "lucide-react";
import {
	ArrowLeftRight,
	Baby,
	Banknote,
	BookOpen,
	Briefcase,
	Building2,
	Bus,
	Car,
	CircleDot,
	Coffee,
	Coins,
	CreditCard,
	Dog,
	Dumbbell,
	Film,
	Fuel,
	Gamepad2,
	Gift,
	GraduationCap,
	Heart,
	Home,
	Landmark,
	Music,
	Percent,
	PiggyBank,
	Plane,
	Receipt,
	Shield,
	ShoppingBag,
	ShoppingBasket,
	Smartphone,
	Sparkles,
	Stethoscope,
	Tag,
	Train,
	TreePine,
	TrendingUp,
	Tv,
	UtensilsCrossed,
	Wallet,
	Wrench,
	Zap,
} from "lucide-react";
import { cn } from "#/lib/utils";
import type { CategoryIconId } from "../../shared/category-icons";
import {
	categoryIconIds,
	isValidCategoryIconId,
} from "../../shared/category-icons";

const categoryLucideMap = {
	Tag,
	Home,
	ShoppingBasket,
	UtensilsCrossed,
	Car,
	Tv,
	Zap,
	ShoppingBag,
	Banknote,
	Percent,
	ArrowLeftRight,
	Briefcase,
	Plane,
	Coffee,
	Gamepad2,
	Smartphone,
	Building2,
	Landmark,
	Wallet,
	Coins,
	PiggyBank,
	Receipt,
	Shield,
	GraduationCap,
	Dumbbell,
	Stethoscope,
	Dog,
	Baby,
	TreePine,
	Wrench,
	Music,
	Film,
	BookOpen,
	Gift,
	CircleDot,
	Heart,
	CreditCard,
	Bus,
	Train,
	Fuel,
	Sparkles,
	TrendingUp,
} as const satisfies Record<CategoryIconId, LucideIcon>;

export const categoryIconPickerOptions: Array<{ id: CategoryIconId }> =
	categoryIconIds.map((id) => ({ id }));

export function CategoryGlyph({
	iconId,
	className,
}: {
	iconId: string;
	className?: string;
}) {
	const Icon: LucideIcon = isValidCategoryIconId(iconId)
		? categoryLucideMap[iconId]
		: Tag;
	return <Icon className={cn("shrink-0", className)} aria-hidden />;
}
