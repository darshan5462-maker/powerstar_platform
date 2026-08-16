// Call this from src/main.tsx
// import { registerSW } from './registerSW'
// registerSW()

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        console.log('✅ SW registered:', reg.scope)

        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60_000)

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing
          newSW?.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New version available — refresh to update')
            }
          })
        })
      } catch (err) {
        console.warn('SW registration failed:', err)
      }
    })
  }
}
