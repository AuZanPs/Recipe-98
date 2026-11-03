import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// The app is served from the domain root (recipe98.auzan.dev on Cloudflare).
// A project-site deployment such as GitHub Pages sets VITE_BASE_PATH to its
// sub-path (for example /Recipe-98/) in the build environment.
const DEFAULT_BASE_PATH = '/';
const configuredBase = process.env.VITE_BASE_PATH?.trim() || DEFAULT_BASE_PATH;
const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`;

export default defineConfig({
  base,
  integrations: [react()],
  // Both routes are one click apart, so warm them ahead of the click.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  build: {
    // Inline the small critical stylesheet and keep the rest cacheable.
    inlineStylesheets: 'auto',
    // 98.css 0.1.21 ships a legacy `@media (not(hover))` rule that the
    // Lightning CSS minifier rejects. Keep CSS unminified (~10 kB gzipped).
    assets: 'assets',
  },
  vite: {
    build: {
      cssMinify: false,
    },
  },
  server: {
    // Uncommon on purpose: this project never fights another dev server for a port.
    port: 3098,
  },
  devToolbar: {
    enabled: false,
  },
  // Astro hashes the scripts it inlines (the island bootstrapper among them),
  // so the generated policy can stay strict instead of allowing 'unsafe-inline'.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' https://www.themealdb.com data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://www.themealdb.com",
        "object-src 'none'",
        "frame-src 'none'",
        "worker-src 'self' blob:",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // React sets style attributes (window drag offsets, theme variables).
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
    },
  },
});
