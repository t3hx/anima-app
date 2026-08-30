import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Les alias reflètent la structure arrêtée en spec §12.
// Ils doivent rester identiques dans tsconfig.json — un test le vérifie
// (src/core/paths.test.ts), parce qu'une divergence ne se voit qu'au premier
// import réel, bien trop tard.
const alias = (segment: string) => fileURLToPath(new URL(`./src/${segment}`, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': alias(''),
      '@core': alias('core'),
      '@shell': alias('shell'),
      '@scenes': alias('scenes'),
      '@transport': alias('transport'),
      '@controls': alias('controls'),
      '@code': alias('code'),
      '@i18n': alias('i18n'),
      '@lessons': alias('lessons'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
  },
})
