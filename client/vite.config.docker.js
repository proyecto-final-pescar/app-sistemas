import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config.js'

export default mergeConfig(
  base,
  defineConfig({
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      watch: { usePolling: true, interval: 300 }
    }
  })
)