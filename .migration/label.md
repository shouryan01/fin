# label

2026-10-02, golden pair via CLI (shadcn base-luma), migrated Radix Label to native `<label>`.

## Changed

- `src/components/ui/label.tsx`: Replaced Radix `LabelPrimitive.Root` (`@radix-ui/react-label` / `radix-ui`) with native HTML `<label>` element. Updated props typing to `React.ComponentProps<"label">`.
- Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/label.tsx` returned 0 matches.

## Left alone

None.

## Behavior changes

Base UI does not have a standalone Label primitive. Replaced with native HTML `<label>`.

## Verify by hand

- Click on a label associated with an input (`htmlFor` or nested input) and ensure the input receives focus.
