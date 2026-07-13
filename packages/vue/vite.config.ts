import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // During dev/build the workspace core is consumed from source so the two
      // packages stay in lockstep without a rebuild.
      '@vahidamirian/datepicker-core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NdpVue',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'ndp-vue.js' : 'ndp-vue.umd.cjs'),
    },
    rollupOptions: {
      // Vue is a peer dependency — never bundle it. @vahidamirian/datepicker-core IS bundled so the
      // published package is self-contained beyond Vue itself (it's tiny and
      // tree-shakeable). Consumers may still install @vahidamirian/datepicker-core to share it.
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        assetFileNames: 'ndp-vue.[ext]',
      },
    },
    cssCodeSplit: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
