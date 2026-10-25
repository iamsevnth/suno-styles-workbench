import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, type Plugin} from 'vite';

/**
 * Content Security Policy for the hosted site. GitHub Pages cannot send headers, so it ships as a
 * meta tag in the built page. Everything the app loads comes from its own origin; the favicon is a
 * data: URL. scripts/build-offline.mjs rewrites script-src and style-src with hashes for the
 * single-file offline build, where the code is inline.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "manifest-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {tag: 'meta', attrs: {'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY}, injectTo: 'head-prepend'},
    ],
  };
}

export default defineConfig({
  // Absolute asset URLs, so pages at clean addresses (sunoworkbench.com/compiler) load them from the
  // site root. The offline builder inlines every asset, so the single file does not depend on this.
  base: '/',
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
  build: {
    target: 'es2022',
  },
  server: {
    // Local only. To test on a phone on the same network, run `npm run dev -- --host`.
    host: '127.0.0.1',
    // AI Studio sets DISABLE_HMR while an agent edits files, to stop the preview flickering.
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  preview: {
    host: '127.0.0.1',
  },
});
