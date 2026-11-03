import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// The app is served from the domain root (recipe98.auzan.dev on Cloudflare).
// A project-site deployment such as GitHub Pages sets VITE_BASE_PATH to its
// sub-path (for example /Recipe-98/) in the build environment.
const DEFAULT_BASE_PATH = '/';

// index.html allows the Vite HMR websocket so `npm run dev` works. Production
// builds should not ship that allowance.
const stripDevCspSources = (): Plugin => ({
  name: 'strip-dev-csp-sources',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(/ ws:\/\/(localhost|127\.0\.0\.1):\*/g, ''),
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredBase = process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH;
  const rawBase = configuredBase?.trim() || DEFAULT_BASE_PATH;
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    base,
    plugins: [react(), stripDevCspSources()],
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // 98.css 0.1.21 ships a legacy `@media (not(hover))` rule that the
      // Lightning CSS minifier rejects. Keep CSS unminified (~8 kB gzipped).
      cssMinify: false,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'asciify',
                test: /[\\/]node_modules[\\/]asciify-engine[\\/]/,
                priority: 30,
              },
              {
                name: 'react',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 20,
              },
              {
                name: 'query',
                test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
                priority: 20,
              },
              {
                name: 'icons',
                test: /[\\/]node_modules[\\/]pixelarticons[\\/]/,
                priority: 20,
              },
              {
                name: 'vendor',
                test: /[\\/]node_modules[\\/]/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      restoreMocks: true,
    },
  };
});
