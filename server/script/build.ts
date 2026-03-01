import { build as esbuild } from "esbuild";
import { rm } from "fs/promises";

// Railway build runs inside /server, so everything here is relative to /server.
// We bundle everything (no externals) so we don't depend on package.json deps being complete.

async function buildServerOnly() {
  await rm("dist", { recursive: true, force: true });

  console.log("building server (Railway)...");

  await esbuild({
    entryPoints: ["index.ts"],      // /server/index.ts
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",      // /server/dist/index.cjs
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    logLevel: "info",
  });
}

buildServerOnly().catch((err) => {
  console.error(err);
  process.exit(1);
});