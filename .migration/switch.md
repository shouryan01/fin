# switch

2026-10-02, golden pair via CLI (shadcn base-luma), migrated Radix Switch to @base-ui/react/switch.

## Changed

- `src/components/ui/switch.tsx`: Replaced Radix `SwitchPrimitive.Root` and `SwitchPrimitive.Thumb` (`radix-ui`) with `@base-ui/react/switch`. Updated props to `SwitchPrimitive.Root.Props`, state hooks to `data-checked` and `data-unchecked`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/switch.tsx` returned 0 matches.

## Left alone

None.

## Behavior changes

- Event handler `onCheckedChange` receives `(checked: boolean, eventDetails: Switch.Root.ChangeEventDetails)`.

## Verify by hand

- Toggle the switch on and off using mouse click.
- Verify focus-visible ring when navigating via keyboard (Tab / Space).
