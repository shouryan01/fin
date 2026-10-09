import { createFileRoute, Link } from "@tanstack/react-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
	ArrowLeft,
	Check,
	Copy,
	ExternalLink,
	Eye,
	Monitor,
	Moon,
	Palette,
	RotateCcw,
	Search,
	Sparkles,
	Sun,
	Trash2,
} from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Slider } from "#/components/ui/slider";
import { Switch } from "#/components/ui/switch";
import {
	BASE_COLORS_OPTIONS,
	CHART_COLORS_OPTIONS,
	FONT_MAP,
	FONTS_OPTIONS,
	RADII_OPTIONS,
	THEME_COLORS_OPTIONS,
	useTheme,
} from "#/lib/theme";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/settings_/theme")({
	component: ThemeCustomizerPage,
});

function ThemeCustomizerPage() {
	const {
		config,
		presetCode,
		updateTheme,
		resetTheme,
		applyPreset,
		downloadedFonts,
		loadFont,
		unloadFont,
		clearAllDownloadedFonts,
	} = useTheme();

	const [hasCopied, setHasCopied] = React.useState(false);
	const [presetInput, setPresetInput] = React.useState("");
	const [importError, setImportError] = React.useState<string | null>(null);
	const [importSuccess, setImportSuccess] = React.useState(false);

	const [previewFont, setPreviewFont] = React.useState<string | null>(null);
	const [fontFilter, setFontFilter] = React.useState<
		"all" | "downloaded" | "sans" | "serif" | "mono"
	>("all");
	const [fontSearch, setFontSearch] = React.useState("");

	const filteredFonts = React.useMemo(() => {
		return FONTS_OPTIONS.filter((font) => {
			const matchesCategory =
				fontFilter === "all"
					? true
					: fontFilter === "downloaded"
						? downloadedFonts.includes(font.id)
						: font.category === fontFilter;
			const matchesSearch =
				!fontSearch ||
				font.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
				font.id.toLowerCase().includes(fontSearch.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	}, [fontFilter, fontSearch, downloadedFonts]);

	const handleCopy = () => {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(presetCode);
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2000);
		}
	};

	const handleApplyPreset = (e: React.FormEvent) => {
		e.preventDefault();
		setImportError(null);
		setImportSuccess(false);

		const trimmed = presetInput.trim();
		if (!trimmed) return;

		const success = applyPreset(trimmed);
		if (success) {
			setImportSuccess(true);
			setPresetInput("");
			setTimeout(() => setImportSuccess(false), 3000);
		} else {
			setImportError(
				"Could not decode preset. Accepts '--preset <code>', URL, or raw code (e.g. b2h47HD7kv).",
			);
		}
	};

	return (
		<div className="flex-1 p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
			{/* Top Navigation & Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-2">
					<div>
						<Button
							variant="ghost"
							size="sm"
							render={<Link to="/settings" />}
							className="-ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
						>
							<ArrowLeft data-icon="inline-start" />
							Back to Settings
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
							Customize Theme
						</h1>
						<Badge variant="secondary">
							<Palette data-icon="inline-start" />
							Live Customizer
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Configure base colors, primary theme accents, typography, and corner
						radius on the fly.
					</p>
				</div>

				<div className="flex items-center gap-2.5">
					<Button variant="outline" size="sm" onClick={resetTheme}>
						<RotateCcw data-icon="inline-start" />
						Reset to b1aKQdmn2
					</Button>
				</div>
			</div>

			{/* Preset Code Bar */}
			<Card size="sm">
				<CardHeader>
					<div className="flex flex-col gap-1">
						<CardTitle className="flex items-center gap-2">
							<Sparkles className="size-4 text-primary" />
							Active Preset Code
						</CardTitle>
						<CardDescription>
							Encoded base62 preset compatible with{" "}
							<a
								href={`https://ui.shadcn.com/create?preset=${presetCode}`}
								target="_blank"
								rel="noreferrer"
								onClick={(e) => {
									e.preventDefault();
									const targetUrl = `https://ui.shadcn.com/create?preset=${presetCode}`;
									openUrl(targetUrl).catch(() => {
										window.open(targetUrl, "_blank");
									});
								}}
								className="text-primary hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
							>
								ui.shadcn.com/create
								<ExternalLink className="size-3" />
							</a>
						</CardDescription>
					</div>
					<CardAction className="flex items-center gap-2">
						<Badge variant="outline" className="font-mono text-sm px-3 py-1">
							{presetCode}
						</Badge>
						<Button variant="outline" size="sm" onClick={handleCopy}>
							{hasCopied ? (
								<>
									<Check data-icon="inline-start" />
									Copied
								</>
							) : (
								<>
									<Copy data-icon="inline-start" />
									Copy Code
								</>
							)}
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleApplyPreset}
						className="flex flex-col sm:flex-row items-center gap-2 pt-1"
					>
						<Input
							placeholder="Paste preset code or flag (e.g. --preset b2h47HD7kv or b1aKQdmn2)..."
							value={presetInput}
							onChange={(e) => {
								setPresetInput(e.target.value);
								if (importError) setImportError(null);
							}}
							className="font-mono text-sm"
						/>
						<Button
							type="submit"
							size="sm"
							className="shrink-0 w-full sm:w-auto"
						>
							Apply Code
						</Button>
					</form>
					{importError && (
						<p className="text-xs text-destructive mt-2">{importError}</p>
					)}
					{importSuccess && (
						<p className="text-xs text-primary mt-2">
							Preset applied successfully!
						</p>
					)}
				</CardContent>
			</Card>

			{/* Main Grid: Controls on Left, Live Preview on Right */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Controls (7 Cols) */}
				<div className="lg:col-span-7 flex flex-col gap-6">
					{/* 1. Mode (Appearance) */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Appearance Mode</CardTitle>
							<CardDescription>
								Choose between light and dark themes.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-3">
								{[
									{ id: "light", name: "Light", icon: Sun },
									{ id: "dark", name: "Dark", icon: Moon },
									{ id: "system", name: "System", icon: Monitor },
								].map((item) => {
									const isActive = config.mode === item.id;
									const Icon = item.icon;
									return (
										<button
											type="button"
											key={item.id}
											onClick={() =>
												updateTheme({
													mode: item.id as "light" | "dark" | "system",
												})
											}
											className={cn(
												"flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer text-sm font-medium",
												isActive
													? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30 shadow-xs"
													: "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground",
											)}
										>
											<Icon className="size-5" />
											<span>{item.name}</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* 2. Theme Color (Primary Accent - All 17 colors) */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center justify-between">
								<span>Theme Color (Primary)</span>
								<Badge variant="secondary" className="capitalize">
									{config.theme}
								</Badge>
							</CardTitle>
							<CardDescription>
								Primary brand color used for buttons, links, active states, and
								focus accents.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
								{THEME_COLORS_OPTIONS.map((item) => {
									const isActive = config.theme === item.id;
									return (
										<button
											type="button"
											key={item.id}
											onClick={() => updateTheme({ theme: item.id })}
											className={cn(
												"flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left",
												isActive
													? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 font-semibold shadow-2xs"
													: "border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
											)}
										>
											<span
												className="size-4 rounded-full shrink-0 shadow-2xs"
												style={{ backgroundColor: item.color }}
											/>
											<span className="truncate">{item.name}</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* 3. Base Color (Neutral Palette) */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center justify-between">
								<span>Base Color (Neutrals)</span>
								<Badge variant="secondary" className="capitalize">
									{config.baseColor}
								</Badge>
							</CardTitle>
							<CardDescription>
								Underlying neutral palette governing page backgrounds, cards,
								borders, and surfaces.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
								{BASE_COLORS_OPTIONS.map((item) => {
									const isActive = config.baseColor === item.id;
									return (
										<button
											type="button"
											key={item.id}
											onClick={() => updateTheme({ baseColor: item.id })}
											className={cn(
												"flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left",
												isActive
													? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 font-semibold shadow-2xs"
													: "border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
											)}
										>
											<span
												className="size-4 rounded-full shrink-0 shadow-2xs border border-white/10"
												style={{ backgroundColor: item.color }}
											/>
											<span className="truncate">{item.name}</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* 4. Chart Color (All 17 palettes) */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center justify-between">
								<span>Chart Palette</span>
								<Badge variant="secondary" className="capitalize">
									{config.chartColor}
								</Badge>
							</CardTitle>
							<CardDescription>
								Lead color palette applied across metrics, graphs, and data
								visualizations.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
								{CHART_COLORS_OPTIONS.map((item) => {
									const isActive = config.chartColor === item.id;
									return (
										<button
											type="button"
											key={item.id}
											onClick={() => updateTheme({ chartColor: item.id })}
											className={cn(
												"flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer text-left",
												isActive
													? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 font-semibold shadow-2xs"
													: "border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
											)}
										>
											<span
												className="size-4 rounded-full shrink-0 shadow-2xs"
												style={{ backgroundColor: item.color }}
											/>
											<span className="truncate">{item.name}</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* 5. Corner Radius */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center justify-between">
								<span>Corner Radius</span>
								<Badge variant="secondary" className="font-mono text-xs">
									{config.radius}
								</Badge>
							</CardTitle>
							<CardDescription>
								Global border radius applied to buttons, cards, dialogs, and
								inputs.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
								{RADII_OPTIONS.map((item) => {
									const isActive = config.radius === item.id;
									return (
										<button
											type="button"
											key={item.id}
											onClick={() => updateTheme({ radius: item.id })}
											className={cn(
												"flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer",
												isActive
													? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40 font-semibold shadow-2xs"
													: "border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
											)}
										>
											<div
												className="size-6 border-2 border-current"
												style={{ borderRadius: item.value }}
											/>
											<span className="truncate">{item.name}</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* 6. Menu Accent (Subtle / Bold) */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center justify-between">
								<span>Menu Accent</span>
								<Badge variant="secondary" className="capitalize">
									{config.menuAccent}
								</Badge>
							</CardTitle>
							<CardDescription>
								Highlight styling for navigation links, sidebar active states,
								and menus.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{[
									{
										id: "subtle",
										name: "Subtle",
										desc: "Soft neutral highlight using muted tones",
									},
									{
										id: "bold",
										name: "Bold",
										desc: "High-contrast highlight using the theme primary color",
									},
								].map((item) => {
									const isActive = config.menuAccent === item.id;
									return (
										<button
											type="button"
											key={item.id}
											onClick={() =>
												updateTheme({
													menuAccent: item.id as "subtle" | "bold",
												})
											}
											className={cn(
												"flex flex-col gap-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
												isActive
													? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
													: "border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
											)}
										>
											<div className="flex items-center justify-between">
												<span
													className={cn(
														"text-sm font-semibold",
														isActive ? "text-primary" : "text-foreground",
													)}
												>
													{item.name}
												</span>
												{isActive && <Check className="size-4 text-primary" />}
											</div>
											<span className="text-xs text-muted-foreground">
												{item.desc}
											</span>
										</button>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* 7. Font Family */}
					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<CardTitle className="text-base">Typography (Font)</CardTitle>
									<Badge variant="secondary" className="capitalize">
										{FONTS_OPTIONS.find((f) => f.id === config.font)?.name ??
											config.font}
									</Badge>
									{FONTS_OPTIONS.find((f) => f.id === config.font)
										?.isBundled ? (
										<Badge
											variant="outline"
											className="text-xs text-muted-foreground"
										>
											Local / Offline
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-xs text-muted-foreground"
										>
											Google Font
										</Badge>
									)}
								</div>
								{downloadedFonts.length > 0 && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => clearAllDownloadedFonts()}
										className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 h-7 px-2.5 cursor-pointer self-start sm:self-auto"
										title="Delete all downloaded Google Fonts"
									>
										<Trash2 data-icon="inline-start" className="size-3" />
										Delete all downloaded ({downloadedFonts.length})
									</Button>
								)}
							</div>
							<CardDescription>
								Choose from {FONTS_OPTIONS.length} fonts. Click any font to
								apply and download it. You can delete downloaded fonts anytime.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							{/* Search & Category Filter */}
							<div className="flex flex-col sm:flex-row gap-2.5">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
									<Input
										placeholder="Search fonts (e.g. Outfit, Space, Lora)..."
										value={fontSearch}
										onChange={(e) => setFontSearch(e.target.value)}
										className="pl-9"
									/>
								</div>
								<div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
									{(
										[
											{ id: "all", label: `All (${FONTS_OPTIONS.length})` },
											...(downloadedFonts.length > 0
												? [
														{
															id: "downloaded",
															label: `Downloaded (${downloadedFonts.length})`,
														},
													]
												: []),
											{ id: "sans", label: "Sans" },
											{ id: "serif", label: "Serif" },
											{ id: "mono", label: "Mono" },
										] as const
									).map((cat) => (
										<Button
											key={cat.id}
											variant={fontFilter === cat.id ? "secondary" : "ghost"}
											size="sm"
											onClick={() => setFontFilter(cat.id as typeof fontFilter)}
											className={cn(
												"h-8 text-xs px-2.5 cursor-pointer whitespace-nowrap",
												fontFilter === cat.id && "bg-secondary font-semibold",
											)}
										>
											{cat.label}
										</Button>
									))}
								</div>
							</div>

							{/* Font Grid */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
								{filteredFonts.map((item) => {
									const isActive = config.font === item.id;
									const isPreviewing = previewFont === item.id;
									const isDownloaded = downloadedFonts.includes(item.id);
									return (
										<button
											type="button"
											key={item.id}
											onMouseEnter={() => {
												setPreviewFont(item.id);
											}}
											onMouseLeave={() => {
												if (previewFont === item.id) {
													setPreviewFont(null);
												}
											}}
											onFocus={() => {
												setPreviewFont(item.id);
											}}
											onBlur={() => {
												if (previewFont === item.id) {
													setPreviewFont(null);
												}
											}}
											onClick={() => {
												loadFont(item.id);
												updateTheme({ font: item.id });
												setPreviewFont(null);
											}}
											className={cn(
												"flex flex-col gap-1 p-3 rounded-2xl border text-left transition-all cursor-pointer relative group",
												isActive
													? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
													: isPreviewing
														? "border-primary/60 bg-muted/70 ring-1 ring-primary/20"
														: "border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
											)}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5 flex-wrap">
													<span
														className={cn(
															"text-sm font-semibold",
															isActive ? "text-primary" : "text-foreground",
														)}
													>
														{item.name}
													</span>
													{item.isBundled ? (
														<Badge
															variant="secondary"
															className="text-[10px] py-0 px-1.5 h-4.5 font-normal"
														>
															Local
														</Badge>
													) : isDownloaded ? (
														<Badge
															variant="secondary"
															className="text-[10px] py-0 px-1.5 h-4.5 font-normal bg-primary/15 text-primary border border-primary/20"
														>
															Downloaded
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-muted-foreground"
														>
															Web
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-1">
													{isDownloaded && !item.isBundled && (
														<button
															type="button"
															title={`Delete downloaded ${item.name} font`}
															onClick={(e) => {
																e.stopPropagation();
																unloadFont(item.id);
																if (previewFont === item.id) {
																	setPreviewFont(null);
																}
															}}
															className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
														>
															<Trash2 className="size-3.5" />
														</button>
													)}
													{isPreviewing && !isActive && (
														<span className="text-[10px] text-primary flex items-center gap-0.5 font-medium">
															<Eye className="size-3" />
															Preview
														</span>
													)}
													{isActive && (
														<Check className="size-4 text-primary" />
													)}
												</div>
											</div>
											<span
												className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
												style={{ fontFamily: item.fontFamily }}
											>
												The quick brown fox jumps over the lazy dog.
											</span>
										</button>
									);
								})}
								{filteredFonts.length === 0 && (
									<div className="col-span-full py-8 text-center text-sm text-muted-foreground">
										{fontFilter === "downloaded"
											? "No downloaded Google Fonts yet. Select any Google Font to download and apply it."
											: `No fonts found matching "${fontSearch}"`}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Live Component Preview (5 Cols Sticky) */}
				<div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
					<Card
						className="border-border shadow-md"
						style={{
							fontFamily: previewFont ? FONT_MAP[previewFont] : undefined,
						}}
					>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-base">
									<Sparkles className="size-4 text-primary" />
									Live Theme Preview
								</CardTitle>
								{previewFont && previewFont !== config.font && (
									<Badge
										variant="outline"
										className="text-xs border-primary/40 bg-primary/10 text-primary font-normal"
									>
										Previewing:{" "}
										{FONTS_OPTIONS.find((f) => f.id === previewFont)?.name}
									</Badge>
								)}
							</div>
							<CardDescription>
								Updates apply instantly as you click any setting.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-6">
							{/* Buttons Showcase */}
							<div className="flex flex-col gap-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Buttons
								</span>
								<div className="flex flex-wrap gap-2">
									<Button size="sm">Primary</Button>
									<Button variant="secondary" size="sm">
										Secondary
									</Button>
									<Button variant="outline" size="sm">
										Outline
									</Button>
									<Button variant="ghost" size="sm">
										Ghost
									</Button>
									<Button variant="destructive" size="sm">
										Destructive
									</Button>
								</div>
							</div>

							{/* Badges Showcase */}
							<div className="flex flex-col gap-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Badges
								</span>
								<div className="flex flex-wrap gap-2">
									<Badge>Primary</Badge>
									<Badge variant="secondary">Secondary</Badge>
									<Badge variant="outline">Outline</Badge>
									<Badge variant="destructive">Destructive</Badge>
								</div>
							</div>

							{/* Interactive Controls */}
							<div className="flex flex-col gap-4">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Controls & Inputs
								</span>

								<div className="flex flex-col gap-2">
									<Input placeholder="Type to preview input..." />
								</div>

								<div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20">
									<div className="flex flex-col gap-0.5">
										<span className="text-xs font-medium text-foreground">
											Notifications
										</span>
										<span className="text-[11px] text-muted-foreground">
											Receive balance threshold alerts
										</span>
									</div>
									<Switch defaultChecked />
								</div>

								<div className="flex flex-col gap-2 p-3 rounded-2xl border border-border/60 bg-muted/20">
									<div className="flex justify-between text-xs text-muted-foreground">
										<span>Target Allocation</span>
										<span className="font-semibold text-foreground">72%</span>
									</div>
									<Slider defaultValue={[72]} max={100} step={1} />
								</div>
							</div>

							{/* Chart Bar Preview */}
							<div className="flex flex-col gap-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Chart Palette Preview
								</span>
								<div className="flex items-end gap-2 h-16 p-2 rounded-xl bg-muted/30 border border-border/40">
									<div className="flex-1 bg-(--chart-1) rounded-sm h-[40%]" />
									<div className="flex-1 bg-(--chart-2) rounded-sm h-[65%]" />
									<div className="flex-1 bg-(--chart-3) rounded-sm h-[85%]" />
									<div className="flex-1 bg-(--chart-4) rounded-sm h-[50%]" />
									<div className="flex-1 bg-(--chart-5) rounded-sm h-[70%]" />
								</div>
							</div>

							{/* Menu Accent Preview */}
							<div className="flex flex-col gap-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Menu Accent Preview ({config.menuAccent})
								</span>
								<div className="flex items-center gap-2 p-2 rounded-xl bg-sidebar border border-sidebar-border/50">
									<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground shadow-2xs">
										<Sparkles className="size-3.5" />
										<span>Active Item</span>
									</div>
									<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-sidebar-foreground/70">
										<span>Inactive Item</span>
									</div>
								</div>
							</div>

							{/* Quick Alert Callout */}
							<Alert>
								<Sparkles className="text-primary" />
								<AlertTitle>Persistent Storage</AlertTitle>
								<AlertDescription className="text-xs">
									Your custom theme is automatically saved to local storage and
									restored whenever you launch fin.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
