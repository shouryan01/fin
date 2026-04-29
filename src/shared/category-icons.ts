export const categoryIconIds = [
	"Tag",
	"Home",
	"ShoppingBasket",
	"UtensilsCrossed",
	"Car",
	"Tv",
	"Zap",
	"ShoppingBag",
	"Banknote",
	"Percent",
	"ArrowLeftRight",
	"Briefcase",
	"Plane",
	"Coffee",
	"Gamepad2",
	"Smartphone",
	"Building2",
	"Landmark",
	"Wallet",
	"Coins",
	"PiggyBank",
	"Receipt",
	"Shield",
	"GraduationCap",
	"Dumbbell",
	"Stethoscope",
	"Dog",
	"Baby",
	"TreePine",
	"Wrench",
	"Music",
	"Film",
	"BookOpen",
	"Gift",
	"CircleDot",
	"Heart",
	"CreditCard",
	"Bus",
	"Train",
	"Fuel",
	"Sparkles",
	"TrendingUp",
] as const;

export type CategoryIconId = (typeof categoryIconIds)[number];

const iconSet = new Set<string>(categoryIconIds);

export function isValidCategoryIconId(id: string): id is CategoryIconId {
	return iconSet.has(id);
}

const keywordRules: Array<{ re: RegExp; icon: CategoryIconId }> = [
	{ re: /salary|payroll|wage|bonus|pay\s*check/i, icon: "Banknote" },
	{ re: /interest|dividend|yield/i, icon: "Percent" },
	{ re: /rent|mortgage|housing|apartment|landlord|hoa/i, icon: "Home" },
	{
		re: /grocery|groceries|whole\s*foods|market|supermarket/i,
		icon: "ShoppingBasket",
	},
	{
		re: /dining|restaurant|cafe|coffee|uber\s*eats|doordash|takeout/i,
		icon: "UtensilsCrossed",
	},
	{
		re: /utility|utilities|electric|water|internet|phone|mobile|broadband/i,
		icon: "Zap",
	},
	{ re: /shopping|amazon|retail|clothes|apparel/i, icon: "ShoppingBag" },
	{
		re: /transport|uber|lyft|taxi|gas|fuel|parking|transit|metro|commute/i,
		icon: "Car",
	},
	{ re: /bus|coach/i, icon: "Bus" },
	{ re: /train|rail/i, icon: "Train" },
	{ re: /entertainment|netflix|spotify|hulu|streaming|hobby/i, icon: "Tv" },
	{ re: /transfer|internal|xfer/i, icon: "ArrowLeftRight" },
	{
		re: /health|medical|pharmacy|doctor|hospital|dental/i,
		icon: "Stethoscope",
	},
	{ re: /fitness|gym|workout/i, icon: "Dumbbell" },
	{ re: /travel|flight|hotel|airbnb|vacation/i, icon: "Plane" },
	{ re: /education|tuition|school|university|course/i, icon: "GraduationCap" },
	{ re: /pet|vet|dog|cat|puppy/i, icon: "Dog" },
	{ re: /child|baby|daycare|nursery/i, icon: "Baby" },
	{ re: /subscription|software|saas|app\s*store/i, icon: "Smartphone" },
	{ re: /insurance/i, icon: "Shield" },
	{ re: /tax|irs|hmrc/i, icon: "Landmark" },
	{ re: /invest|brokerage|401k|ira|stock/i, icon: "TrendingUp" },
];

export function suggestCategoryIconId(name: string): CategoryIconId {
	const n = name.trim();
	if (!n) {
		return "Tag";
	}
	for (const rule of keywordRules) {
		if (rule.re.test(n)) {
			return rule.icon;
		}
	}
	return "Tag";
}
