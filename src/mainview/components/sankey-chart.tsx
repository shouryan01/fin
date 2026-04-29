import { useEffect, useMemo, useRef, useState } from "react";
import { CHART_BRAND_GREEN, chartFillFromCategoryIcon } from "#/lib/chart-fill";
import type { MonthlyCategoryTotal } from "../../shared/finance";
import { formatCompactCurrency, formatCurrency } from "../lib/format";

interface SankeyChartProps {
	totalIncomeCents: number;
	totalExpenseCents: number;
	netCashFlowCents: number;
	monthlyCategoryTotals: MonthlyCategoryTotal[];
}

export function SankeyChart(props: SankeyChartProps) {
	const [size, setSize] = useState({ width: 0, height: 0 });
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new ResizeObserver((entries) => {
			if (entries[0]) {
				const rect = entries[0].contentRect;
				setSize({ width: rect.width, height: rect.height });
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={ref} className="w-full h-full">
			{size.width > 0 && size.height > 0 && (
				<SankeyChartInner {...props} width={size.width} height={size.height} />
			)}
		</div>
	);
}

const INCOME_COLOR = CHART_BRAND_GREEN;

/**
 * Each ribbon is a single-hue gradient of its destination color — from a
 * translucent wash at the source side to a confident tint at the destination.
 * No "rainbow bar" effect, no plastic shine, no striping.
 */
const SANKEY_SAVINGS = "#10b981";
const SANKEY_HOUSING = "#2563eb";
const SANKEY_SHOPPING = "#f59e0b";
const SANKEY_ENTERTAINMENT = "#e879f9";

const FOOD_GROUP_COLOR = "#f43f5e";
const TRANSPORT_GROUP_COLOR = "#8b5cf6";
const OTHER_GROUP_COLOR = "#64748b";

/** Maximum number of tier-1 nodes to show directly. Beyond this we bundle the
 *  smallest direct categories into an "Other" group so the chart stays
 *  readable. Savings, Food, and Transport groups are always preserved. */
const MAX_DIRECT_CATEGORIES = 6;

function tier1DirectColor(categoryName: string, icon: string): string {
	const n = categoryName.toLowerCase();
	if (/rent|mortgage|housing|apartment|property|landlord/i.test(n))
		return SANKEY_HOUSING;
	if (/shop|retail|clothing|clothes|amazon|merch|store/i.test(n))
		return SANKEY_SHOPPING;
	if (/entertain|stream|movie|game|hobby|music|fun/i.test(n))
		return SANKEY_ENTERTAINMENT;
	return chartFillFromCategoryIcon(icon);
}

const NODE_WIDTH = 10;
/** Vertical gap between category-column nodes. */
const PADDING = 14;
/** Vertical gap between the Paycheck node's outflow slots. Smaller than PADDING
 *  so the Paycheck bar is more compact than the category column, which causes
 *  ribbons to fan out as they travel rightward. */
const SOURCE_GAP = 1;

interface SankeyNode {
	id: string;
	label: string;
	valueCents: number;
	color: string;
	col: number;
	y: number;
	height: number;
}

interface SankeyLink {
	sourceId: string;
	targetId: string;
	valueCents: number;
	color: string;
	sourceY: number;
	targetY: number;
	sourceHeight: number;
	targetHeight: number;
	label: string;
}

function SankeyChartInner({
	totalIncomeCents,
	monthlyCategoryTotals,
	netCashFlowCents,
	width = 0,
	height = 0,
}: SankeyChartProps & { width: number; height: number }) {
	const [hoveredLink, setHoveredLink] = useState<string | null>(null);
	const [hoveredNode, setHoveredNode] = useState<string | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const [isVisible, setIsVisible] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Wait one paint after mount so the initial opacity:0 state is rendered
		// before we flip to opacity:1 — otherwise the browser coalesces the two
		// states and skips the transition, which used to cause the janky "pop".
		const frame = requestAnimationFrame(() => setIsVisible(true));
		return () => cancelAnimationFrame(frame);
	}, []);

	const { nodes, links, paycheckTotalCents } = useMemo(() => {
		if (totalIncomeCents <= 0 || width === 0 || height === 0) {
			return { nodes: [], links: [], paycheckTotalCents: 0 };
		}

		const USABLE_HEIGHT = height - 24;

		// 1. Grouping Logic
		const isUtilit = (name: string) => /utilit/i.test(name);
		const isFood = (name: string) =>
			/grocer|dining|food|restaurant|eat/i.test(name);
		const isTransport = (name: string) =>
			/gas|transport|car\s|insur|auto|transit|fuel|uber|lyft/i.test(name);

		const sorted = [...monthlyCategoryTotals]
			.filter((c) => c.amountCents > 0 && !isUtilit(c.categoryName))
			.sort((a, b) => b.amountCents - a.amountCents);

		const foodChildren: MonthlyCategoryTotal[] = [];
		const transportChildren: MonthlyCategoryTotal[] = [];
		const directChildren: MonthlyCategoryTotal[] = [];

		sorted.forEach((c) => {
			if (isFood(c.categoryName)) foodChildren.push(c);
			else if (isTransport(c.categoryName)) transportChildren.push(c);
			else directChildren.push(c);
		});

		type NodeData = {
			id: string;
			label: string;
			amountCents: number;
			color: string;
			children?: MonthlyCategoryTotal[];
		};
		const tier1: NodeData[] = [];

		if (netCashFlowCents > 0) {
			tier1.push({
				id: "savings",
				label: "Savings",
				amountCents: netCashFlowCents,
				color: SANKEY_SAVINGS,
			});
		}

		// Cap the number of individually-shown direct categories. Beyond the
		// cap, the smallest categories are bundled into "Other" with their own
		// sub-tier expansion (like Food/Transport), which keeps the chart
		// legible even when the user has 20+ categories.
		const keptDirects = directChildren.slice(0, MAX_DIRECT_CATEGORIES);
		const overflowDirects = directChildren.slice(MAX_DIRECT_CATEGORIES);

		keptDirects.forEach((c, i) => {
			tier1.push({
				id: `direct-${c.categoryId || c.categoryName}-${i}`,
				label: c.categoryName,
				amountCents: c.amountCents,
				color: tier1DirectColor(c.categoryName, c.icon),
			});
		});

		if (foodChildren.length > 0) {
			tier1.push({
				id: "group-food",
				label: "Food",
				amountCents: foodChildren.reduce((s, c) => s + c.amountCents, 0),
				color: FOOD_GROUP_COLOR,
				children: foodChildren,
			});
		}

		if (transportChildren.length > 0) {
			tier1.push({
				id: "group-transport",
				label: "Transport",
				amountCents: transportChildren.reduce((s, c) => s + c.amountCents, 0),
				color: TRANSPORT_GROUP_COLOR,
				children: transportChildren,
			});
		}

		if (overflowDirects.length > 0) {
			tier1.push({
				id: "group-other",
				label: "Other",
				amountCents: overflowDirects.reduce((s, c) => s + c.amountCents, 0),
				color: OTHER_GROUP_COLOR,
				children: overflowDirects,
			});
		}

		const paycheckCents = tier1.reduce((s, c) => s + c.amountCents, 0);
		if (paycheckCents <= 0) {
			return { nodes: [], links: [], paycheckTotalCents: 0 };
		}

		const leafList: { label: string; amountCents: number }[] = [];
		tier1.forEach((n) => {
			if (n.children)
				n.children.forEach((c) =>
					leafList.push({ label: c.categoryName, amountCents: c.amountCents }),
				);
			else leafList.push({ label: n.label, amountCents: n.amountCents });
		});

		const N = leafList.length;
		const ALPHA = 0.5;
		const availableContentHeight = USABLE_HEIGHT - (N - 1) * 8;

		const getWeight = (cents: number) => {
			const ratio = cents / paycheckCents;
			return ALPHA / N + (1 - ALPHA) * ratio;
		};

		const heights = new Map<string, number>();
		leafList.forEach((l) => {
			heights.set(
				l.label,
				Math.max(
					Math.floor(availableContentHeight * getWeight(l.amountCents)),
					10,
				),
			);
		});

		const rawNodes: SankeyNode[] = [];
		const rawLinks: any[] = [];
		const nodeDict: Record<string, SankeyNode> = {};

		const paycheckNode = {
			id: "paycheck",
			label: "Paycheck",
			valueCents: paycheckCents,
			color: INCOME_COLOR,
			col: 0,
			height: 0,
			y: 0,
		};
		rawNodes.push(paycheckNode);
		nodeDict["paycheck"] = paycheckNode;

		tier1.forEach((t1) => {
			let t1Height = 0;
			const t1Node = {
				id: t1.id,
				label: t1.label,
				valueCents: t1.amountCents,
				color: t1.color,
				col: 1,
				height: 0,
				y: 0,
			};
			rawNodes.push(t1Node);
			nodeDict[t1.id] = t1Node;

			if (t1.children) {
				t1.children.forEach((child, i) => {
					const childId = `${t1.id}-child-${i}`;
					const h = heights.get(child.categoryName) || 12;
					const childFill = chartFillFromCategoryIcon(child.icon);
					const cNode = {
						id: childId,
						label: child.categoryName,
						valueCents: child.amountCents,
						color: childFill,
						col: 2,
						height: h,
						y: 0,
					};
					rawNodes.push(cNode);
					nodeDict[childId] = cNode;
					rawLinks.push({
						sourceId: t1.id,
						targetId: childId,
						valueCents: child.amountCents,
						color: childFill,
					});
					t1Height += h + 4;
				});
				t1Height -= 4;
			} else {
				t1Height = heights.get(t1.label) || 12;
			}
			t1Node.height = t1Height;
			rawLinks.push({
				sourceId: "paycheck",
				targetId: t1.id,
				valueCents: t1.amountCents,
				color: t1.color,
			});
		});

		// Paycheck is a compact solid bar — sum of outflow heights plus a thin
		// SOURCE_GAP between each slot. This is intentionally shorter than the
		// category column (which uses the larger PADDING), so ribbons fan out
		// as they travel from source to destination.
		const col1Nodes = rawNodes.filter((n) => n.col === 1);
		paycheckNode.height =
			col1Nodes.reduce((s, n) => s + n.height + SOURCE_GAP, 0) - SOURCE_GAP;

		[0, 1, 2].forEach((col) => {
			const colNodes = rawNodes.filter((n) => n.col === col);
			if (colNodes.length === 0) return;
			const gap = col === 0 ? SOURCE_GAP : PADDING;
			const colH = colNodes.reduce((s, n) => s + n.height + gap, 0) - gap;
			let startY = (height - colH) / 2;
			colNodes.forEach((n) => {
				n.y = startY;
				startY += n.height + gap;
			});
		});

		const finalLinks: SankeyLink[] = [];
		let pY = paycheckNode.y;
		rawLinks
			.filter((l) => l.sourceId === "paycheck")
			.forEach((l) => {
				const t = nodeDict[l.targetId];
				finalLinks.push({
					sourceId: "paycheck",
					targetId: l.targetId,
					valueCents: l.valueCents,
					color: l.color,
					label: t.label,
					sourceY: pY,
					targetY: t.y,
					sourceHeight: t.height,
					targetHeight: t.height,
				});
				pY += t.height + SOURCE_GAP;
			});

		rawNodes
			.filter((n) => n.col === 1 && n.id.startsWith("group-"))
			.forEach((parent) => {
				let cY = parent.y;
				rawLinks
					.filter((l) => l.sourceId === parent.id)
					.forEach((l) => {
						const t = nodeDict[l.targetId];
						finalLinks.push({
							sourceId: parent.id,
							targetId: l.targetId,
							valueCents: l.valueCents,
							color: l.color,
							label: t.label,
							sourceY: cY,
							targetY: t.y,
							sourceHeight: t.height,
							targetHeight: t.height,
						});
						cY += t.height + 4;
					});
			});

		return {
			nodes: rawNodes,
			links: finalLinks,
			paycheckTotalCents: paycheckCents,
		};
	}, [
		totalIncomeCents,
		monthlyCategoryTotals,
		netCashFlowCents,
		width,
		height,
	]);

	if (totalIncomeCents <= 0)
		return (
			<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
				No data available.
			</div>
		);
	if (width === 0 || height === 0) return null;

	const LEFT = 120,
		RIGHT = 160,
		STEP = (width - LEFT - RIGHT) / 2;
	const getX = (col: number) => LEFT + col * STEP;

	return (
		<div
			ref={containerRef}
			className="relative w-full h-full"
			onMouseMove={(e) => {
				if (containerRef.current) {
					const r = containerRef.current.getBoundingClientRect();
					setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
				}
			}}
		>
			<svg width={width} height={height} className="block overflow-visible">
				<defs>
					{links.map((link) => (
						<linearGradient
							key={`grad-${link.sourceId}-${link.targetId}`}
							id={`grad-${link.sourceId}-${link.targetId}`}
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%"
						>
							<stop offset="0%" stopColor={link.color} stopOpacity={0.18} />
							<stop offset="100%" stopColor={link.color} stopOpacity={0.72} />
						</linearGradient>
					))}
				</defs>
				{/* Single unified fade-in. No per-node delays, no mask clipping,
				    no text slide-in. The chart materializes as one smooth piece. */}
				<g
					style={{
						opacity: isVisible ? 1 : 0,
						transition:
							"opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)",
					}}
				>
					{links.map((link) => {
						const isH =
							hoveredLink === `${link.sourceId}-${link.targetId}` ||
							hoveredNode === link.sourceId ||
							hoveredNode === link.targetId;
						const sNode = nodes.find((n) => n.id === link.sourceId)!,
							tNode = nodes.find((n) => n.id === link.targetId)!;
						const sx = getX(sNode.col) + NODE_WIDTH,
							tx = getX(tNode.col);
						const cp1 = sx + (tx - sx) * 0.5,
							cp2 = tx - (tx - sx) * 0.5;
						const d = [
							`M ${sx} ${link.sourceY}`,
							`C ${cp1} ${link.sourceY}, ${cp2} ${link.targetY}, ${tx} ${link.targetY}`,
							`L ${tx} ${link.targetY + link.targetHeight}`,
							`C ${cp2} ${link.targetY + link.targetHeight}, ${cp1} ${link.sourceY + link.sourceHeight}, ${sx} ${link.sourceY + link.sourceHeight}`,
							"Z",
						].join(" ");
						return (
							<path
								key={`${link.sourceId}-${link.targetId}`}
								d={d}
								fill={`url(#grad-${link.sourceId}-${link.targetId})`}
								opacity={isH ? 1 : 0.9}
								className="transition-opacity duration-200 cursor-pointer"
								onMouseEnter={() =>
									setHoveredLink(`${link.sourceId}-${link.targetId}`)
								}
								onMouseLeave={() => setHoveredLink(null)}
							/>
						);
					})}
					{nodes.map((node) => {
						const isH = hoveredNode === node.id;
						const nx = getX(node.col),
							midY = node.y + node.height / 2;
						return (
							<g
								key={node.id}
								onMouseEnter={() => setHoveredNode(node.id)}
								onMouseLeave={() => setHoveredNode(null)}
								className="cursor-pointer"
							>
								<rect
									x={nx}
									y={node.y}
									width={NODE_WIDTH}
									height={node.height}
									rx={3}
									fill={node.color}
									opacity={isH ? 1 : 0.95}
									className="transition-opacity duration-200"
								/>
								<text
									x={node.col === 0 ? nx - 12 : nx + NODE_WIDTH + 10}
									y={midY + 4}
									textAnchor={node.col === 0 ? "end" : "start"}
									fontSize={12}
									className="select-none pointer-events-none fill-foreground"
								>
									<tspan fontWeight={isH ? 600 : 500}>{node.label}</tspan>
									<tspan
										className="fill-muted-foreground tabular-nums"
										dx={8}
										fontWeight={500}
									>
										{formatCompactCurrency(node.valueCents)}
									</tspan>
								</text>
							</g>
						);
					})}
				</g>
			</svg>
			{hoveredLink &&
				(() => {
					const link = links.find(
						(l) => `${l.sourceId}-${l.targetId}` === hoveredLink,
					);
					if (!link) return null;
					const pctOfPaycheck =
						paycheckTotalCents > 0
							? (100 * link.valueCents) / paycheckTotalCents
							: 0;
					const pctLabel =
						pctOfPaycheck >= 10
							? `${pctOfPaycheck.toFixed(1)}%`
							: `${pctOfPaycheck.toFixed(2)}%`;
					return (
						<div
							className="pointer-events-none absolute z-[100] rounded-xl border border-border bg-card/95 px-3 py-2 text-sm shadow-xl backdrop-blur-sm"
							style={{ left: mousePos.x + 16, top: mousePos.y + 16 }}
						>
							<div className="flex items-center gap-2">
								<span
									className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
									style={{
										backgroundColor: link.color,
										color: link.color,
									}}
								/>
								<span className="font-semibold">{link.label}</span>
							</div>
							<div className="mt-0.5 pl-[18px] text-muted-foreground tabular-nums">
								{formatCurrency(link.valueCents)}
								<span className="text-foreground/80">
									{" "}
									({pctLabel} of paycheck)
								</span>
							</div>
						</div>
					);
				})()}
		</div>
	);
}
