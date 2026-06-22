import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// React port of the Aurexis prototype. Vite is build/dev tooling only.
// The hand-written styles.css is imported ONCE (verbatim, byte-identical to the
// baseline on main) and the ported imperative engine owns all dynamic DOM.
// cssMinify is off so the shipped CSS stays a faithful copy of the source.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: { outDir: 'dist', cssMinify: false },
})
