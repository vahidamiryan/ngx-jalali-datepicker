import { defineConfig } from 'vitepress';
import { resolve } from 'node:path';

// GitHub Pages serves the project site under /ngx-jalali-datepicker/.
const base = process.env.DOCS_BASE ?? '/ngx-jalali-datepicker/';

export default defineConfig({
  base,
  title: 'NDP Date Picker',
  description:
    'Framework-agnostic Jalali / Gregorian / Hijri date picker — one shared @ndp/core, first-class Angular and Vue components.',
  lang: 'fa',
  cleanUrls: true,
  vite: {
    resolve: {
      alias: {
        // Live Vue examples in the docs import the workspace packages from source
        // so the docs always reflect the current code without a rebuild.
        '@ndp/core': resolve(__dirname, '../../../packages/core/src/index.ts'),
        '@ndp/vue': resolve(__dirname, '../../../packages/vue/src/index.ts'),
      },
    },
    ssr: {
      // The Vue components touch the DOM; render them client-side only.
      noExternal: ['@ndp/vue', '@ndp/core'],
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
          { text: '@ndp/core', link: 'https://www.npmjs.com/package/@ndp/core' },
          { text: '@ndp/angular', link: 'https://www.npmjs.com/package/@ndp/angular' },
          { text: '@ndp/vue', link: 'https://www.npmjs.com/package/@ndp/vue' },
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
