import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"), // client is frontend root
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),       // client/src → @
      "@shared": path.resolve(__dirname, "shared"),     // shared folder outside client
    },
  },
  server: {
    fs: {
      allow: ["client", "shared"], // allow reading outside client folder
    },
  },
  build: {
    outDir: path.resolve(__dirname, "client/dist"), // output inside client/dist
    emptyOutDir: true,
  },
});