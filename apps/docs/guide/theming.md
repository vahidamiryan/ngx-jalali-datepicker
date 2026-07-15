# Theming

The picker ships **light / dark / auto** themes and is otherwise styled entirely
through `--ndp-*` CSS custom properties — override any of them in CSS or inline.

## Built-in themes

```html
<!-- Angular -->
<ndp-datepicker theme="light" [(value)]="value" /> <!-- default -->
<ndp-datepicker theme="dark"  [(value)]="value" />
<ndp-datepicker theme="auto"  [(value)]="value" /> <!-- follows OS prefers-color-scheme -->
```

```vue
<!-- Vue -->
<NdpDatepicker v-model="value" theme="light" />
<NdpDatepicker v-model="value" theme="dark" />
<NdpDatepicker v-model="value" theme="auto" />
```

`theme` only swaps the **default palette** of tokens — every colour, radius and
spacing value stays overridable.

## Override in CSS

Overrides cascade, so you can scope them to one instance or apply them globally.
In Vue every component root carries the `.ndp-root` class; in Angular target the
`ndp-datepicker` element.

```css
/* Vue: all pickers */
.ndp-root {
  --ndp-accent: #8b5cf6;
  --ndp-accent-hover: #7c3aed;
  --ndp-range-bg: rgba(139, 92, 246, 0.18); /* translucent → works on any surface */
  --ndp-radius: 18px;
}
```

```css
/* Angular */
ndp-datepicker {
  --ndp-accent: #8b5cf6;
  --ndp-range-bg: rgba(139, 92, 246, 0.18);
}
```

## Override programmatically

`customVars` (Angular) / `:custom-vars` (Vue) applies tokens as inline styles, so
they win over both the built-in theme and your stylesheet — handy for runtime or
brand-driven values.

```ts
const brand: Record<string, string> = {
  '--ndp-accent': '#8b5cf6',
  '--ndp-range-bg': 'rgba(139, 92, 246, 0.18)',
}
```

```html
<ndp-datepicker theme="dark" [customVars]="brand" [(value)]="value" />
```

```vue
<NdpDatepicker v-model="value" theme="dark" :custom-vars="brand" />
```

## Token reference

| Token | Purpose |
| --- | --- |
| `--ndp-accent` / `--ndp-accent-hover` / `--ndp-accent-contrast` | Selected day fill, its hover, and text on it. |
| `--ndp-range-bg` / `--ndp-range-color` | Committed range band background and text. |
| `--ndp-preview-bg` | Tentative (hover) range band background. |
| `--ndp-focus-ring` | Keyboard focus ring. |
| `--ndp-today-border` | "Today" outline. |
| `--ndp-weekend-color` | Weekend day text. |
| `--ndp-surface` / `--ndp-border` / `--ndp-text` / `--ndp-muted` | Panel background, borders, primary and muted text. |
| `--ndp-day-color` / `--ndp-weekday-color` / `--ndp-day-outside-color` | Day text, weekday header, and faded out-of-month days. |
| `--ndp-day-hover-bg` | Day / nav / button hover background. |
| `--ndp-shadow` | Panel drop shadow. |
| `--ndp-radius` / `--ndp-day-radius` | Panel and day-cell corner radius. |
| `--ndp-slide-duration` / `--ndp-slide-easing` / `--ndp-slide-distance` | `animation="slide"` transition tuning. |

## Replace a whole day cell

Beyond colours, you can render your own day-cell content (badges, prices, dots)
while the picker keeps owning selection and layout — content projection in
Angular, a scoped slot in Vue:

```html
<!-- Angular -->
<ndp-datepicker [(value)]="value">
  <ng-template ndpDayCell let-day>
    {{ day.label }} @if (day.isWeekend) { <span>•</span> }
  </ng-template>
</ndp-datepicker>
```

```vue
<!-- Vue -->
<NdpDatepicker v-model="value">
  <template #day="{ day }">
    {{ day.label }}<span v-if="day.isWeekend"> •</span>
  </template>
</NdpDatepicker>
```

The `day` scope is the fully-built `DayCell` (every state flag precomputed) — see
the [core `DayCell` type](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/core#type-reference).
