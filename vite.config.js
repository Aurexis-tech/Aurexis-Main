// Vite here is a CONVENIENCE wrapper only — a nice dev server + static build.
// It serves index.html and ships the hand-written ./src/styles.css and
// ./src/app.js exactly as they are. It does NOT transpile, minify, reorder, or
// otherwise transform that CSS/JS in any way that changes the rendered output.
// The page you see under `npm run dev` is byte-for-byte the original prototype.
//
// (app.js is intentionally a CLASSIC <script> — not an ES module — so execution
// semantics match the original inline <script> at the end of <body>.)
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    minify: false,
  },
});
