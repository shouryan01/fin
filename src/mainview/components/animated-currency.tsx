import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatSignedCurrency } from "#/lib/format";

const ROLL_MS = 720;
const COUNT_MS = 820;

function RollingDigit({ digit }: { digit: number }) {
	const d = Math.min(9, Math.max(0, digit));
	return (
		<span className="inline-flex h-[1em] overflow-hidden align-baseline">
			<span
				className="flex flex-col transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]"
				style={{
					transform: `translateY(-${d}em)`,
					transitionDuration: `${ROLL_MS}ms`,
				}}
			>
				{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
					<span
						key={n}
						className="flex h-[1em] shrink-0 items-center justify-center leading-none"
					>
						{n}
					</span>
				))}
			</span>
		</span>
	);
}

function renderScrolledCurrencyString(
	displayStr: string,
	keyPrefix: string,
): ReactNode[] {
	const out: ReactNode[] = [];
	for (let i = 0; i < displayStr.length; i += 1) {
		const ch = displayStr[i] ?? "";
		if (ch >= "0" && ch <= "9") {
			out.push(<RollingDigit key={`${keyPrefix}-d-${i}`} digit={Number(ch)} />);
		} else {
			out.push(
				<span key={`${keyPrefix}-s-${i}`} className="inline-block">
					{ch}
				</span>,
			);
		}
	}
	return out;
}

export function AnimatedCurrency({
	valueCents,
	className,
	signed = false,
}: {
	valueCents: number;
	className?: string;
	signed?: boolean;
}) {
	const [displayValue, setDisplayValue] = useState(0);
	const latestDisplay = useRef(0);

	useEffect(() => {
		const end = valueCents;
		const start = latestDisplay.current;
		if (start === end) {
			return;
		}

		const duration = COUNT_MS;
		const startedAt = performance.now();
		let frame = 0;

		const tick = (now: number) => {
			const progress = Math.min((now - startedAt) / duration, 1);
			const eased = 1 - (1 - progress) ** 3;
			const nextValue = Math.round(start + (end - start) * eased);
			latestDisplay.current = nextValue;
			setDisplayValue(nextValue);
			if (progress < 1) {
				frame = window.requestAnimationFrame(tick);
			}
		};

		frame = window.requestAnimationFrame(tick);
		return () => window.cancelAnimationFrame(frame);
	}, [valueCents]);

	const displayStr = signed
		? formatSignedCurrency(displayValue)
		: formatCurrency(displayValue);

	return (
		<span className={`inline-block whitespace-nowrap ${className ?? ""}`}>
			{renderScrolledCurrencyString(displayStr, "nw")}
		</span>
	);
}
