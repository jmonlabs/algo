import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      // Allow serving files from parent directories (for local ds import)
      allow: ['..', '../../ds']
    }
  },
  build: {
    rollupOptions: {
      // src/score.js does `try { await import("verovio/wasm") } catch { CDN }`
      // — the npm path exists for Node/Deno consumers. In the browser bundle
      // the npm package isn't installed, so Rollup would fail at build time
      // trying to resolve these bare specifiers. Externalize them: Rollup
      // leaves the dynamic imports as-is, the browser rejects them at runtime
      // (no import map for bare names), and the try/catch falls through to
      // the Verovio CDN bundle — which is what we actually wanted in the
      // browser anyway.
      external: ['verovio/wasm', 'verovio/esm']
    }
  }
});
