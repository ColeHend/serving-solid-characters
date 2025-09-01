// Suppress noisy Sass legacy deprecation warnings during tests.
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);
const SASS_DEPRECATION = /Deprecation Warning \[legacy-js-api]/i;
console.warn = (...args: any[]) => {
  if (args.some(a => typeof a === 'string' && SASS_DEPRECATION.test(a))) return;
  originalWarn(...args);
};
console.error = (...args: any[]) => {
  // Some Sass deprecation warnings may appear on stderr depending on version
  if (args.some(a => typeof a === 'string' && SASS_DEPRECATION.test(a))) return;
  originalError(...args);
};

// Prefer embedded Sass (no legacy API) if available; fallback gracefully.
process.env.SASS_SILENCE_DEPRECATIONS = 'legacy-js-api';

// Optionally mark to future devs how to re-enable for debugging.
// To see warnings again set DEBUG_SASS=1 when running vitest.
if (process.env.DEBUG_SASS === '1') {
  console.warn = originalWarn;
  console.error = originalError;
}
