# slider

2026-10-02, golden pair via CLI (shadcn base-luma), migrated Radix Slider to @base-ui/react/slider.

## Changed

- `src/components/ui/slider.tsx`: Replaced Radix `SliderPrimitive` (`radix-ui`) with `@base-ui/react/slider`. Anatomy restructured to include `SliderPrimitive.Control` wrapping `SliderPrimitive.Track` and `SliderPrimitive.Indicator` (formerly `Range`), with thumbs configured for `thumbAlignment="edge"`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/slider.tsx` returned 0 matches.

## Left alone

None.

## Behavior changes

- `onValueCommit` renamed to `onValueCommitted` in Base UI.
- `onValueChange` receives `(value: number | number[], eventDetails: Slider.Root.ChangeEventDetails)`.
- `inverted` prop dropped (Base UI does not support it directly).

## Verify by hand

- Drag thumb across the track and verify value updates smoothly.
- Test keyboard interactions (Arrow Left/Right, Home/End, PageUp/PageDown).
