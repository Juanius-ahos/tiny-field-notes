import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the site at /<repo-name>/. Set REPO_NAME here once the repo exists.
const REPO_NAME = 'tiny-field-notes'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
}))
