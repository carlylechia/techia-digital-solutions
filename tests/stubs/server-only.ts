/**
 * Test stub for the `server-only` guard.
 *
 * Next.js resolves `server-only` internally at build time. Vitest runs outside
 * that bundler, so the specifier is aliased to this no-op module (see
 * vitest.config.ts). It keeps the production guard in the source files while
 * still allowing unit tests to import them.
 */
export {};
