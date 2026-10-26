import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// GitHub Pages defaults to /Recipe-98/. Cloudflare Pages builds at the domain
// root: set VITE_BASE_PATH=/ in that build environment (or .env.production).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredBase = process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH;
  const isCloudflarePages = Boolean(process.env.CF_PAGES ?? env.CF_PAGES);
  const rawBase = configuredBase?.trim() || (isCloudflarePages ? '/' : '/Recipe-98/');
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    base,
    plugins: [react()],
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
