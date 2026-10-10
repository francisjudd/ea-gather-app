import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['lib/**/__tests__/**/*.test.{ts,tsx}', 'components/**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['lib/messaging/**', 'components/messaging/**'],
      exclude: ['**/__tests__/**'],
      reporter: ['text', 'html'],
    },
  },
})
