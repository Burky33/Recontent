import { build } from "esbuild";

const isProd = process.env.NODE_ENV === "production";

async function main() {
  await build({
    entryPoints: ["index.ts"], // this is server/index.ts because we run from /server
    outfile: "dist/index.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: ["node20"],
    sourcemap: isProd ? false : true,
    minify: isProd,
    logLevel: "info",
    packages: "external",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});