import { createWaapiDriver, liveDriverCount } from '@transport/drivers/waapi'
import type { TimeDriver, TimeDriverOptions } from '@transport/TimeDriver'

// Expose le vrai module au navigateur pour que Playwright puisse l'exercer. Le harnais ne
// réimplémente rien : il ne fait qu'appeler `createWaapiDriver`.

declare global {
  interface Window {
    harness: {
      create: (options: TimeDriverOptions) => void
      driver: TimeDriver | undefined
      liveAnimations: () => number
      liveDrivers: () => number
    }
  }
}

window.harness = {
  driver: undefined,
  create(options) {
    window.harness.driver?.dispose()
    window.harness.driver = createWaapiDriver(options)
  },
  liveAnimations: () => document.getAnimations().length,
  liveDrivers: () => liveDriverCount(),
}
