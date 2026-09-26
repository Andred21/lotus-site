import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // `lambda/**` roda em Node: cada arquivo de teste de lá declara
    // `// @vitest-environment node` na primeira linha (spec §4).
    include: [
      'src/**/*.test.{ts,tsx}',
      'lambda/**/*.test.ts',
      'scripts/**/*.test.mjs',
    ],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'dist-lambda/**'],
  },
})
