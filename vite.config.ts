import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js lands in its own lazy chunk; it is big by nature
    chunkSizeWarningLimit: 1500,
  },
})
