import fs from "node:fs"
import path from "node:path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// VITE_STATIC=1 builds the server-less demo (relative paths, output in dist-static/) for static hosting.
const isStatic = process.env.VITE_STATIC === "1"

// Serve frontend/static-export/ at /static-api/ so dev mode works without the backend server.
function staticExportPlugin(): Plugin {
  const exportDir = path.resolve(__dirname, "static-export")
  return {
    name: "static-export-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/static-api", (req, res, next) => {
        const filePath = path.join(exportDir, req.url ?? "/")
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader("Content-Type", filePath.endsWith(".json") ? "application/json" : "application/octet-stream")
          fs.createReadStream(filePath).pipe(res)
        } else {
          next()
        }
      })
    },
  }
}

// In dev the API runs on :8000 and is proxied; in `make demo` FastAPI serves the built bundle itself.
export default defineConfig({
  base: isStatic ? "./" : "/",
  plugins: [react(), tailwindcss(), staticExportPlugin()],
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
