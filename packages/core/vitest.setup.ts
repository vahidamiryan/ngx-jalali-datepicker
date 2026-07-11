/**
 * Compatibility shims so the specs authored for Jasmine (Angular's default test
 * runner) run unchanged under Vitest after the core was extracted into its own
 * package. Only the Jasmine-only surface used by these specs is polyfilled:
 * the `toBeTrue` / `toBeFalse` matchers and the `.withContext()` message chain.
 */
import { expect } from 'vitest';

expect.extend({
  toBeTrue(received: unknown) {
    return {
      pass: received === true,
      message: () => `expected ${received} to be true`,
    };
  },
  toBeFalse(received: unknown) {
    return {
      pass: received === false,
      message: () => `expected ${received} to be false`,
    };
  },
});

// `.withContext(...)` is a chainable modifier in Jasmine, not a terminal matcher.
// Re-implement it as a no-op passthrough that yields the live assertion object.
const proto = Object.getPrototypeOf(expect(null));
if (!('withContext' in proto)) {
  Object.defineProperty(proto, 'withContext', {
    value(this: unknown) {
      return this;
    },
    configurable: true,
    writable: true,
  });
}

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeTrue(): void;
    toBeFalse(): void;
    withContext(message: string): Assertion<T>;
  }
  interface AsymmetricMatchersContaining {
    toBeTrue(): void;
    toBeFalse(): void;
  }
}
