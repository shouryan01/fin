# Base UI Rules & Conventions

Core API patterns and usage rules for `@base-ui/react` shadcn components.

## Contents

- Composition: render prop
- Button / trigger as non-button element (`nativeButton={false}`)
- Select (items prop, placeholder, positioning, multiple, object values)
- ToggleGroup (multiple boolean, array values)
- Slider (scalar for single thumb, array for range)
- Accordion (multiple boolean, array defaultValue)

---

## Composition: render prop

Base UI uses the `render` prop to customize the rendered element. Never use `asChild` and don't wrap triggers in unnecessary extra elements.

**Incorrect:** wrapping in extra elements:

```tsx
<DialogTrigger>
  <div>
    <Button>Open</Button>
  </div>
</DialogTrigger>
```

**Incorrect:** `asChild` is not supported in Base UI:

```tsx
<DialogTrigger asChild>
  <Button>Open</Button>
</DialogTrigger>
```

**Correct:**

```tsx
<DialogTrigger render={<Button />}>Open</DialogTrigger>
```

This applies to all trigger and close components: `DialogTrigger`, `SheetTrigger`, `AlertDialogTrigger`, `DropdownMenuTrigger`, `PopoverTrigger`, `TooltipTrigger`, `CollapsibleTrigger`, `DialogClose`, `SheetClose`, `NavigationMenuLink`, `BreadcrumbLink`, `SidebarMenuButton`, `Badge`, `Item`.

---

## Button / trigger as non-button element

When `render` changes an element to a non-button (e.g. `<a>`, `<span>`), add `nativeButton={false}`.

**Incorrect:** missing `nativeButton={false}`:

```tsx
<Button render={<a href="/docs" />}>Read the docs</Button>
```

**Correct:**

```tsx
<Button render={<a href="/docs" />} nativeButton={false}>
  Read the docs
</Button>
```

Same for triggers whose `render` target is not a button:

```tsx
<PopoverTrigger render={<InputGroupAddon />} nativeButton={false}>
  Pick date
</PopoverTrigger>
```

---

## Select

**`items` prop.** Base UI requires an `items` prop on the root component.

**Incorrect:**

```tsx
<Select>
  <SelectTrigger><SelectValue placeholder="Select a fruit" /></SelectTrigger>
</Select>
```

**Correct:**

```tsx
const items = [
  { label: "Select a fruit", value: null },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
]

<Select items={items}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {items.map((item) => (
        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

**Placeholder:** Base UI uses a `{ value: null }` item in the `items` array to represent the placeholder.

**Content positioning:** Use `alignItemWithTrigger` (boolean) on `SelectContent` (defaults to `true`). To align like a dropdown:

```tsx
<SelectContent alignItemWithTrigger={false} side="bottom">
```

---

## Select — multiple selection and object values

Base UI supports `multiple`, render-function children on `SelectValue`, and object values with `itemToStringValue`.

**Multiple selection:**

```tsx
<Select items={items} multiple defaultValue={[]}>
  <SelectTrigger>
    <SelectValue>
      {(value: string[]) => value.length === 0 ? "Select fruits" : `${value.length} selected`}
    </SelectValue>
  </SelectTrigger>
  ...
</Select>
```

**Object values:**

```tsx
<Select defaultValue={plans[0]} itemToStringValue={(plan) => plan.name}>
  <SelectTrigger>
    <SelectValue>{(value) => value.name}</SelectValue>
  </SelectTrigger>
  ...
</Select>
```

---

## ToggleGroup

Base UI uses a `multiple` boolean prop for multi-selection. `defaultValue` is always an array.

**Incorrect:** `type="single"` or `type="multiple"`:

```tsx
<ToggleGroup type="single" defaultValue="daily">
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
</ToggleGroup>
```

**Correct:**

```tsx
// Single selection (no multiple prop needed), defaultValue is an array:
<ToggleGroup defaultValue={["daily"]} spacing={2}>
  <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
  <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
</ToggleGroup>

// Multiple selection:
<ToggleGroup multiple defaultValue={["bold"]}>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>
```

**Controlled single value:**

```tsx
// Wrap/unwrap arrays:
const [value, setValue] = React.useState("normal")
<ToggleGroup value={[value]} onValueChange={(v) => setValue(v[0])}>
```

---

## Slider

Base UI accepts a plain number for a single thumb, and an array for range sliders.

**Incorrect for single thumb:**

```tsx
<Slider defaultValue={[50]} max={100} step={1} />
```

**Correct for single thumb:**

```tsx
<Slider defaultValue={50} max={100} step={1} />
```

**Range sliders use arrays:**

```tsx
const [value, setValue] = React.useState([0.3, 0.7])
<Slider value={value} onValueChange={(v) => setValue(v as number[])} />
```

---

## Accordion

Base UI uses no `type` prop. Multi-select is enabled via the `multiple` boolean prop, and `defaultValue` is always an array.

**Incorrect:**

```tsx
<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>
```

**Correct:**

```tsx
// Single selection:
<Accordion defaultValue={["item-1"]}>
  <AccordionItem value="item-1">...</AccordionItem>
</Accordion>

// Multi-selection:
<Accordion multiple defaultValue={["item-1", "item-2"]}>
  <AccordionItem value="item-1">...</AccordionItem>
  <AccordionItem value="item-2">...</AccordionItem>
</Accordion>
```
