import path from "node:path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// VITE_STATIC=1 builds the server-less demo (relative paths, output in dist-static/) for static hosting.
const isStatic = process.env.VITE_STATIC === "1"

// In dev the API runs on :8000 and is proxied; in `make demo` FastAPI serves the built bundle itself.
export default defineConfig({
  base: isStatic ? "./" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: isStatic ? "dist-static" : "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
})
