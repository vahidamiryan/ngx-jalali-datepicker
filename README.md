# NDP Date Picker — monorepo

High-performance, customizable **Jalali / Gregorian / Hijri** date picker with a
shared framework-agnostic core and first-class **Angular** and **Vue 3** components.
A single headless engine means bug-fixes and new calendar features land in every
framework at once.

## Packages

| Package | Path | Description |
| --- | --- | --- |
| [`@ndp/core`](packages/core) | `packages/core` | Framework-agnostic headless engine — types, calendar adapters + math, selection and render-ready view builders. **Zero framework deps.** |
| [`@ndp/angular`](packages/angular) | `packages/angular` | Angular 20+ components (signals, zoneless, `OnPush`, `ControlValueAccessor`) on `@ndp/core`. |
| [`@ndp/vue`](packages/vue) | `packages/vue` | Vue 3 components (Composition API, `v-model`, scoped slots) on `@ndp/core`. |

Apps:

| App | Path | Description |
| --- | --- | --- |
| `@ndp/docs` | `apps/docs` | Unified VitePress docs site with live Vue examples + Angular snippets. Deployed to GitHub Pages. |
| `angular-playground` | `apps/angular-playground` | Standalone Angular demo app. |

## Architecture

```
@ndp/core  (pure TS: adapters, math, build-month/period, selection, time, types)
   ├── @ndp/angular  (Angular component layer)
   └── @ndp/vue      (Vue 3 component layer)
```

The core has **one** rule that keeps it portable: no framework imports. Both
framework packages depend on it as a peer, so the calendar math and selection logic
are literally the same code in Angular and Vue — the components are thin.

## Develop

This is an **npm workspaces** monorepo (Node 20+).

```bash
npm install            # install everything

npm run build          # build core → angular → vue (dependency order)
npm run test           # test core + vue
npm run dev:docs       # serve the docs site (live Vue examples)
npm run start:playground  # serve the Angular playground

# per package
npm run build -w @ndp/core
npx ng build angular
npm run build -w @ndp/vue
```

## Publishing

`@ndp/core`, `@ndp/angular`, `@ndp/vue` are published together (see
`.github/workflows/release.yml` — manual dispatch or a `v*` tag). Build order is
enforced: core first, then the framework packages.

## License

MIT © Vahid Amirian
