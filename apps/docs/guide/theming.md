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

All tokens are defined once on `:root`, so a single global override re-themes
every picker, input and time field at once — no need to repeat it per component.

```css
/* Every NDP component, both frameworks */
:root {
  --ndp-accent: #8b5cf6;
  --ndp-accent-hover: #7c3aed;
  --ndp-radius: 18px;
}
```

To scope an override instead, target one instance. In Vue every component root
carries the `.ndp-root` class; in Angular target the `ndp-datepicker` element.

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

## Density presets

`data-ndp-preset` swaps spacing and type size in one attribute. Put it on the
component or any ancestor.

```html
<ndp-datepicker data-ndp-preset="compact" [(value)]="value" />
```

```vue
<NdpDatepicker v-model="value" data-ndp-preset="comfortable" />
```

| Preset | Effect |
| --- | --- |
| *(none)* | Default density. |
| `compact` | Tighter padding, smaller type and radii. |
| `comfortable` | Roomier padding, larger type, wider cell gaps. |

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
| `--ndp-font-family` / `--ndp-font-size` | Base font stack and size. |
| `--ndp-day-font-size` / `--ndp-weekday-font-size` | Day-cell and weekday-header type size. |
| `--ndp-space` | Panel padding — the main density dial. |
| `--ndp-cell-gap` | Gap between day cells. |
| `--ndp-icon-size` / `--ndp-icon-size-sm` | Icon box size, and the smaller dropdown caret. |
| `--ndp-icon-stroke` | Icon stroke width. |
| `--ndp-disabled-opacity` | Opacity of disabled days, buttons and panels. |
| `--ndp-slide-duration` / `--ndp-slide-easing` / `--ndp-slide-distance` | `animation="slide"` transition tuning. Zeroed automatically under `prefers-reduced-motion`. |

## Labels & language

Every string the picker renders — footer buttons, `aria-label`s, calendar names —
comes from one set. The default follows the **calendar**: Gregorian gets English,
Jalali and Hijri get Persian. That is the common pairing, but the two are
independent, so a Jalali calendar in an English admin panel is one prop away.

```ts
import { NDP_EN_LABELS, NDP_FA_LABELS, type NdpLabels } from '@vahidamirian/datepicker-core'
```

Per component:

```html
<!-- Angular -->
<ndp-datepicker [labels]="{ today: 'Today', clear: 'Clear' }" [(value)]="value" />
```

```vue
<!-- Vue -->
<NdpDatepicker v-model="value" :labels="{ today: 'Today', clear: 'Clear' }" />
```

Application-wide:

```ts
// Angular
import { provideNdpLabels } from '@vahidamirian/ngx-jalali-datepicker'
providers: [provideNdpLabels(NDP_EN_LABELS)]
```

```ts
// Vue
import { NDP_LABELS_KEY } from '@vahidamirian/vue-datepicker'
app.provide(NDP_LABELS_KEY, NDP_EN_LABELS)
```

A component's own `labels` wins over the app-wide set, and both merge over the
calendar default — override only the keys you care about.

### Keys

| Key | Used for |
| --- | --- |
| `today` / `clear` | Footer buttons. |
| `prev` / `next` | Month navigation `aria-label`s. |
| `close` | Dropdown and popover dismiss buttons. |
| `clearStart` / `clearEnd` | Per-chip clear buttons in range mode. |
| `openCalendar` | The trigger button on a typed input. |
| `switchCalendar` | The calendar-toggle button. |
| `calendars` | Display names per calendar id (`{ gregorian, jalali, hijri }`), merged key-by-key. |
| `hours` / `minutes` | Time-picker fields. |
| `increaseHours` / `decreaseHours` | Hour steppers. |
| `increaseMinutes` / `decreaseMinutes` | Minute steppers. |

## Replace the icons

Every glyph — nav chevrons, dropdown caret, clear button, calendar and clock —
comes from one set in the core package, rendered as inline SVG that inherits
`currentColor` and the size tokens. Override any subset; the rest stay default.

Each value is the **inner** markup of a `24 x 24` viewBox — the wrapping `<svg>`
is supplied for you, so stroke, colour and size stay token-driven.

```ts
import { NDP_DEFAULT_ICONS, type NdpIconSet } from '@vahidamirian/datepicker-core'
// names: prev | next | caret | clear | calendar | clock
```

```ts
// Angular — application-wide
import { provideNdpIcons } from '@vahidamirian/ngx-jalali-datepicker'

providers: [
  provideNdpIcons({ prev: '<path d="M15 18l-6-6 6-6" />' }),
]
```

```ts
// Vue — application-wide
import { NDP_ICONS_KEY } from '@vahidamirian/vue-datepicker'

app.provide(NDP_ICONS_KEY, { prev: '<path d="M15 18l-6-6 6-6" />' })
```

Size and stroke are tokens like everything else:

```css
:root {
  --ndp-icon-size: 1.25rem;
  --ndp-icon-size-sm: 1rem;   /* the dropdown caret */
  --ndp-icon-stroke: 1.5;
}
```

Overrides are inserted as raw SVG markup, so supply static strings you author —
never unsanitised user input.

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
