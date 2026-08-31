import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Les alias reflètent la structure arrêtée en spec §12.
// Ils doivent rester identiques dans tsconfig.json — un test le vérifie
// (src/core/paths.test.ts), parce qu'une divergence ne se voit qu'au premier
// import réel, bien trop tard.
const alias = (segment: string) => fileURLToPath(new URL(`./src/${segment}`, import.meta.url))

// Le banc d'essai du driver (tests/e2e/harness) n'est ajouté comme entrée que sous
// `E2E_HARNESS`, posé par le `webServer` de Playwright. Il ne part donc jamais en
// production, mais il exerce le vrai module dans un vrai navigateur — ce que jsdom ne
// peut pas faire, faute d'implémenter la moindre API Web Animations.
const harnessInput = process.env.E2E_HARNESS
  ? { harness: fileURLToPath(new URL('./tests/e2e/harness/index.html', import.meta.url)) }
  : {}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ...harnessInput,
      },
    },
  },
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
