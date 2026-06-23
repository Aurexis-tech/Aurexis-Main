import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// React port of the Aurexis prototype. Vite is build/dev tooling only.
// The hand-written styles.css is imported ONCE (verbatim, byte-identical to the
// baseline on main) and the ported imperative engine owns all dynamic DOM.
// cssMinify is off so the shipped CSS stays a faithful copy of the source.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev-only: forward /api/* to the Vercel functions running via `vercel dev`
    // (repo root, :3000). Lets the hidden /dev-check page call /api with relative
    // paths and no CORS. No effect on the prototype or the production build.
    proxy: { '/api': 'http://localhost:3000' },
  },
  preview: { port: 4173 },
  build: { outDir: 'dist', cssMinify: false },
})
