export function formatCurrency(cents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(cents / 100);
}

export function formatSignedCurrency(cents: number) {
	const formatted = formatCurrency(Math.abs(cents));
	return cents > 0 ? `+${formatted}` : cents < 0 ? `-${formatted}` : formatted;
}

export function formatCompactCurrency(cents: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 1,
		notation: "compact",
	}).format(cents / 100);
}
