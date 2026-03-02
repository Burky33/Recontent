import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),

      // shared imports (both styles)
      "@shared": path.resolve(__dirname, "shared"),
      "@shared/": path.resolve(__dirname, "shared") + "/",
      "shared": path.resolve(__dirname, "shared"),
      "shared/": path.resolve(__dirname, "shared") + "/",
    },
  },
  build: {
    outDir: "dist",        // <-- IMPORTANT: dist relative to client root
    emptyOutDir: true,
  },
});