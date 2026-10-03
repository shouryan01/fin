# Project Migration to Base UI

2026-10-02, whole-project mode migration from Radix UI to Base UI (`@base-ui/react`).

## Dependency Swap

- Added: `@base-ui/react` (`^1.8.0`)
- Removed: `radix-ui` (`^1.6.7`)
- Updated `components.json`: `style` flipped from `radix-luma` to `base-luma`

## Components Migrated

1. `label`: Replaced `radix-ui` Label with native HTML `<label>` element.
2. `button`: Replaced `radix-ui` Slot with `@base-ui/react/button`.
3. `switch`: Replaced `radix-ui` Switch with `@base-ui/react/switch`.
4. `slider`: Replaced `radix-ui` Slider with `@base-ui/react/slider`.
5. `select`: Replaced `radix-ui` Select with `@base-ui/react/select`.

Untouched (non-radix native elements):
- `input.tsx`: Plain `<input>` element (no Radix dependency).
- `textarea.tsx`: Plain `<textarea>` element (no Radix dependency).

## App Code Sweep Summary

- `src/components/not-found.tsx`: Updated `<Button asChild>` to `<Button render={<Link to="/" />}>Go Home</Button>`.
- Verified 0 remaining occurrences of `radix` or `asChild` across `src/`.

## Final Build Result

- Full production build (`bun run build` / `vite build` for client & SSR) succeeded with 0 errors.

0 wrappers remain on Radix.
