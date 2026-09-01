// Copies the canonical token sheet into packages/angular/styles so ng-packagr,
// which refuses assets outside the package root, can ship it. Generated file —
// edit packages/core/styles/tokens.css instead.
import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'packages/core/styles/tokens.css');
const dest = resolve(root, 'packages/angular/styles/tokens.css');

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
