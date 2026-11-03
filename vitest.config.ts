import { defineConfig } from 'vitest/config';

// The suites are plain React + DOM tests, so they need no Astro pipeline.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
