# Vanilla JS

There is **no `<ndp-datepicker>` element to drop in** — the core package ships the
calendar *engine*, not a UI. It is pure TypeScript with zero dependencies and zero
DOM code, so you own the markup and the core owns the hard parts: Jalali / Gregorian
/ Hijri math, leap years, month grids, range selection, and parsing.

That is the trade: about 60 lines of your own rendering, in exchange for markup that
matches your design system exactly, with no framework in the bundle.

```bash
npm install @vahidamirian/datepicker-core
```

The build is standard ESM, so it also loads straight from a CDN with no bundler:

```html
<script type="module">
  import { JalaliCalendarAdapter } from 'https://esm.sh/@vahidamirian/datepicker-core'
</script>
```

## The three pieces

Everything below is built from exactly three imports:

| Import | Role |
| --- | --- |
| `JalaliCalendarAdapter` (or `Gregorian…` / `Hijri…`) | Knows one calendar: labels, month lengths, weekends, direction. |
| `buildMonthView(adapter, month, ctx)` | Turns a month into a render-ready grid — 42 cells, each with every state flag precomputed. |
| `applySelection(mode, value, date)` | The selection reducer: give it a click, get the next value. |

You never compute a date yourself. `buildMonthView` hands you `cell.isSelected`,
`cell.isInRange`, `cell.isToday`, `cell.isDisabled`, `cell.inCurrentMonth` — you just
map them to classes.

## A complete picker

This is a working range picker in one function. Nothing is elided.

```js
import {
  JalaliCalendarAdapter, buildMonthView, applySelection,
  atMidnight, NDP_DEFAULT_ICONS,
} from '@vahidamirian/datepicker-core'

export function createDatepicker(host, { adapter = new JalaliCalendarAdapter(), mode = 'range', onChange } = {}) {
  let value = { start: null, end: null }
  let month = atMidnight(adapter.startOfMonth(new Date()))

  host.className = 'ndp-root'
  host.dir = adapter.direction          // 'rtl' for Jalali/Hijri, 'ltr' for Gregorian

  const icon = (name) =>
    `<svg class="ndp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">${NDP_DEFAULT_ICONS[name]}</svg>`

  function render() {
    const view = buildMonthView(adapter, month, {
      mode, value, hovered: null,
      today: atMidnight(new Date()), min: null, max: null, dateFilter: null,
    })

    host.innerHTML = `
      <div class="ndp-panel">
        <div class="ndp-month-title">
          <button class="ndp-nav" data-nav="-1" aria-label="Previous month">${icon('prev')}</button>
          <span>${view.label}</span>
          <button class="ndp-nav" data-nav="1" aria-label="Next month">${icon('next')}</button>
        </div>

        <div class="ndp-month" role="grid" aria-label="${view.label}">
          <span class="ndp-sr-only" aria-live="polite">${view.label}</span>
          <div class="ndp-weekdays" role="row">
            ${view.weekdays.map((w) => `<span class="ndp-weekday" role="columnheader">${w}</span>`).join('')}
          </div>
          <div class="ndp-grid" role="row">
            ${view.cells.map((c, i) => `
              <button type="button" role="gridcell" data-i="${i}"
                class="ndp-day
                  ${c.inCurrentMonth ? '' : 'ndp-day--outside'}
                  ${c.isToday ? 'ndp-day--today' : ''}
                  ${c.isWeekend ? 'ndp-day--weekend' : ''}
                  ${c.isSelected ? 'ndp-day--selected' : ''}
                  ${c.isRangeStart ? 'ndp-day--start' : ''}
                  ${c.isRangeEnd ? 'ndp-day--end' : ''}
                  ${c.isInRange ? 'ndp-day--in-range' : ''}"
                ${c.isDisabled ? 'disabled' : ''}
                aria-pressed="${c.isSelected}"
                ${c.isToday ? 'aria-current="date"' : ''}>${c.label}</button>`).join('')}
          </div>
        </div>
      </div>`

    host.querySelectorAll('[data-nav]').forEach((b) => {
      b.onclick = () => { month = adapter.addCalendarMonths(month, Number(b.dataset.nav)); render() }
    })

    host.querySelectorAll('[data-i]').forEach((b) => {
      b.onclick = () => {
        const cell = view.cells[Number(b.dataset.i)]
        if (cell.isDisabled) return
        value = applySelection(mode, value, cell.date)
        onChange?.(value)
        render()
      }
    })
  }

  render()
  return { getValue: () => value, destroy: () => (host.innerHTML = '') }
}
```

Use it:

```js
createDatepicker(document.getElementById('picker'), {
  onChange: (v) => console.log(v.start, v.end),
})
```

## Styling it

The class names above are the same ones the Angular and Vue components use, so the
shipped token sheet styles this picker as-is:

```js
import '@vahidamirian/datepicker-core/styles/tokens.css'
```

That gives you the `--ndp-*` variables (colours, spacing, radii, icon sizes) and the
light/dark palettes. It does **not** include component layout — the grid, day cells and
panel chrome are yours to write, or copy from the Vue package's stylesheets. See
[Theming](/guide/theming) for the full token list.

If you would rather not write any CSS, use the Angular or Vue package instead: they are
this same core wrapped in maintained, accessible markup.

## Other modes

`mode` flows straight through to `applySelection`, so single-date is a one-word change:

```js
createDatepicker(host, { mode: 'single' })   // value.start holds the date
```

For month and year grids use `buildMonthsView` / `buildYearsView` instead of
`buildMonthView` — same shape, `view.cells` carries `PeriodCell`s.

## Switching calendars

Every calendar is a drop-in adapter; nothing else in the code above changes:

```js
import {
  GregorianCalendarAdapter, JalaliCalendarAdapter, HijriCalendarAdapter,
} from '@vahidamirian/datepicker-core'

createDatepicker(host, { adapter: new GregorianCalendarAdapter('en-GB') })
createDatepicker(host, { adapter: new HijriCalendarAdapter() })
```

Import only the adapters you use — the others are tree-shaken out along with their
conversion math. See [Calendars & adapters](/guide/calendars).

## Just the maths, no UI

If you only need conversion or formatting, skip the view builders entirely:

```js
import { JalaliCalendarAdapter, JalaaliMath } from '@vahidamirian/datepicker-core'

const cal = new JalaliCalendarAdapter()
cal.format(new Date())                    // '۱۴۰۵/۰۶/۱۰'
cal.parse('۱۴۰۵/۰۶/۱۰')                   // Date
JalaaliMath.toJalaali(new Date())         // { jy, jm, jd }
```

The [core README](https://github.com/vahidamiryan/ngx-jalali-datepicker/tree/main/packages/core#readme)
carries the full export list and type reference.
