# select

2026-10-02, golden pair via CLI (shadcn base-luma), migrated Radix Select to @base-ui/react/select.

## Changed

- `src/components/ui/select.tsx`:
  - Replaced Radix `SelectPrimitive` (`radix-ui`) with `@base-ui/react/select`.
  - Split `Content` into `Portal > Positioner > Popup`.
  - Positioner forwards `align`, `alignOffset`, `side`, `sideOffset`, and `alignItemWithTrigger`.
  - Replaced `Viewport` with `List`.
  - Replaced `Group` `Label` with `GroupLabel`.
  - Replaced `ScrollUpButton` / `ScrollDownButton` with `ScrollUpArrow` / `ScrollDownArrow`.
  - Updated `Icon` and `ItemIndicator` to use `render` instead of `asChild`.
  - Updated CSS variables from `--radix-select-*` to Base UI `--available-height`, `--anchor-width`, and `--transform-origin`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/select.tsx` returned 0 matches.

## Left alone

None.

## Behavior changes

- `alignItemWithTrigger` boolean replaces `position="popper" | "item-aligned"`.
- `Select.Value` renders raw value unless `items` is passed to `Root` or custom children formatter is provided.
- `onValueChange` signature includes event details: `(value: Value | null, eventDetails: Select.Root.ChangeEventDetails) => void`.

## Verify by hand

- Click select trigger to open popup.
- Navigate items with Arrow keys (Up/Down) and select with Enter/Space.
- Verify focus returns to trigger upon closing or selection.
- Test scroll buttons if items overflow.
