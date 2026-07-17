/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app from /<repo>/, so the base path must match the
// repository name in CI. Locally (dev/preview) we serve from root.
const base = process.env.GITHUB_PAGES === 'true' ? '/the-hard-conversation/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
