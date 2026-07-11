import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Types are emitted separately by `tsc` (see the `build` script) into
  // dist/types so consumers — notably ng-packagr, whose partial-compilation
  // analyzer chokes on rolled-up single-file .d.ts bundles — get plain,
  // per-file declarations with a proper source graph.
  dts: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2022',
});
