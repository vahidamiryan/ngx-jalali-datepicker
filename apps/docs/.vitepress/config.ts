import { defineConfig } from 'vitepress';
import { resolve } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

// GitHub Pages serves the project site under /ngx-jalali-datepicker/.
const base = process.env.DOCS_BASE ?? '/ngx-jalali-datepicker/';

// The live Angular islands import the built (template-inlined) FESM bundle. Its
// file name is derived from the package name, so resolve it dynamically instead
// of hard-coding it — build @vahidamiryan/ngx-jalali-datepicker before the docs.
const angularFesmDir = resolve(__dirname, '../../../dist/angular/fesm2022');
const angularFesm = existsSync(angularFesmDir)
  ? resolve(angularFesmDir, readdirSync(angularFesmDir).find((f) => f.endsWith('.mjs'))!)
  : resolve(angularFesmDir, 'ngx-jalali-datepicker.mjs');

const siteUrl = 'https://vahidamiryan.github.io/ngx-jalali-datepicker/';
const ogImage = `${siteUrl}og-image.png`;
const description =
  'Free, high-performance Jalali (Shamsi), Gregorian & Hijri date picker for Angular 20+ and Vue 3. Zoneless, signals, headless core, dual-calendar, RTL, fully themeable.';

export default defineConfig({
  base,
  title: 'Jalali Date Picker for Angular & Vue',
  titleTemplate: ':title — Jalali Date Picker (Angular & Vue)',
  description,
  lang: 'en',
  cleanUrls: true,
  sitemap: { hostname: siteUrl },
  head: [
    ['meta', { name: 'keywords', content: 'jalali datepicker, shamsi datepicker, persian calendar, angular datepicker, vue datepicker, hijri, gregorian, date range picker, zoneless, signals, rtl' }],
    ['meta', { name: 'author', content: 'Vahid Amirian' }],
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Jalali Date Picker for Angular & Vue' }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    // Twitter
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Jalali Date Picker for Angular & Vue' }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: ogImage }],
  ],
  vite: {
    resolve: {
      alias: {
        // Live Vue examples in the docs import the workspace packages from source
        // so the docs always reflect the current code without a rebuild.
        '@vahidamiryan/datepicker-core': resolve(__dirname, '../../../packages/core/src/index.ts'),
        '@vahidamiryan/vue-datepicker': resolve(__dirname, '../../../packages/vue/src/index.ts'),
        // Angular islands import the built FESM bundle via this stable alias.
        '@ndp-angular-dist': angularFesm,
      },
    },
    ssr: {
      // The Vue components touch the DOM; render them client-side only.
      noExternal: ['@vahidamiryan/vue-datepicker', '@vahidamiryan/datepicker-core'],
    },
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Angular', link: '/angular/' },
      { text: 'Vue', link: '/vue/' },
      {
        text: 'npm',
        items: [
          { text: '@vahidamiryan/datepicker-core', link: 'https://www.npmjs.com/package/@vahidamiryan/datepicker-core' },
          { text: '@vahidamiryan/ngx-jalali-datepicker', link: 'https://www.npmjs.com/package/@vahidamiryan/ngx-jalali-datepicker' },
          { text: '@vahidamiryan/vue-datepicker', link: 'https://www.npmjs.com/package/@vahidamiryan/vue-datepicker' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Calendars & adapters', link: '/guide/calendars' },
          { text: 'Typed input', link: '/guide/typed-input' },
          { text: 'Time of day', link: '/guide/time' },
        ],
      },
      {
        text: 'Frameworks',
        items: [
          { text: 'Angular', link: '/angular/' },
          { text: 'Vue 3', link: '/vue/' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vahidamiryan/ngx-jalali-datepicker' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: '© Vahid Amirian',
    },
  },
});
