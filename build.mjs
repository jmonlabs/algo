#!/usr/bin/env node

// Node.js bundler for algo using esbuild
import * as esbuild from "esbuild";
import { mkdir } from "fs/promises";

const entryPoint = "./src/index.js";
const outDir = "./dist";

// Ensure dist directory exists
try {
  await mkdir(outDir, { recursive: true });
} catch {
  // Directory already exists
}

console.log("🔨 Building algo with Node + esbuild...");

// Build ESM bundle
console.log("📦 Building ESM bundle...");
await esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  format: "esm",
  outfile: `${outDir}/jmon.esm.js`,
  external: ["plotly.js", "tone", "vexflow", "module", "fs", "path", "url", "crypto"],
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
  external: ["plotly.js", "tone", "vexflow", "module", "fs", "path", "url", "crypto"],
  platform: "browser",
});

console.log("✅ UMD bundle created: dist/jmon.umd.js");

console.log("✨ Build complete!");
