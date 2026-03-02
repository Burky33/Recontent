// Content-Forge/server/script/build.ts
import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // server/ folder root
  const serverRoot = path.resolve(__dirname, "..");

  const entry = path.join(serverRoot, "index.ts");
  const outdir = path.join(serverRoot, "dist");
  const outfile = path.join(outdir, "index.cjs");

  // Ensure dist exists
  fs.mkdirSync(outdir, { recursive: true });

  // BACKEND ONLY: no Vite, no client build, no rollup
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    target: "node18",
    format: "cjs",
    sourcemap: false,
    minify: false,
    logLevel: "info",
    // Keep node externals unbundled (safer for native deps)
    external: [
      // add any native/optional deps here if you hit issues later
    ],
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
    },
  });

  console.log(`✅ Backend build complete: ${outfile}`);
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});