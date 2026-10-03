# button

2026-10-02, golden pair via CLI (shadcn base-luma), migrated Radix Slot button to Base UI Button primitive.

## Changed

- `src/components/ui/button.tsx`: Replaced Radix `Slot` (`radix-ui`) with `@base-ui/react/button` (`ButtonPrimitive`). Button now accepts `ButtonPrimitive.Props` with native `render` prop support instead of `asChild`.
- `src/components/not-found.tsx`: Updated call site from `<Button asChild><Link to="/">Go Home</Link></Button>` to `<Button render={<Link to="/" />}>Go Home</Button>`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/button.tsx` returned 0 matches.

## Left alone

None.

## Behavior changes

Polymorphic rendering now uses Base UI's `render` prop pattern instead of Radix `asChild` / `Slot`.

## Verify by hand

- Click the standard "Go back" button and verify it triggers history navigation.
- Click the "Go Home" button and verify it renders as a TanStack Router Link navigation to `/`.
