import { defineConfig, devices } from '@playwright/test'

// Le bout en bout tourne contre le build de production servi par `vite preview`,
// pas contre le serveur de développement : c'est le build qu'on déploie qu'il
// faut vérifier, StrictMode et rechargement à chaud en moins.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'E2E_HARNESS=1 npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
