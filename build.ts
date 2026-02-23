#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

// Deno bundler for algo using esbuild
import * as esbuild from "npm:esbuild@0.27.3";

const entryPoint = "./src/index.js";
const outDir = "./dist";

// Ensure dist directory exists
try {
  await Deno.mkdir(outDir, { recursive: true });
} catch {
  // Directory already exists
}

console.log("🔨 Building algo with Deno + esbuild...");

// Build ESM bundle
console.log("📦 Building ESM bundle...");
await esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  format: "esm",
  outfile: `${outDir}/jmon.esm.js`,
  external: ["plotly.js", "tone", "vexflow", "@tangent.to/ds"],
  platform: "browser",
});

console.log("✅ ESM bundle created: dist/jmon.esm.js");

// Build UMD bundle
console.log("📦 Building UMD bundle...");
await esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  format: "iife",
  globalName: "jm",
  outfile: `${outDir}/jmon.umd.js`,
  external: ["plotly.js", "tone", "vexflow", "@tangent.to/ds"],
  platform: "browser",
});

console.log("✅ UMD bundle created: dist/jmon.umd.js");

esbuild.stop();
console.log("✨ Build complete!");
