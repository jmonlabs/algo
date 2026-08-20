/**
 * Browser-load integration test.
 *
 * Spawns a static HTTP server over the repo, opens a fixture page in
 * headless Chrome, and verifies that `import("/src/index.js")` resolves
 * to a module exposing the public API the live REPL relies on
 * (`jm.key`, `jm.theory.harmony.Key`, `jm.generative.walks.Chain`,
 * etc.). This is the exact load path used by the jsDelivr-served
 * `https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js` URL.
 *
 * Run:   node tests/browser-load.test.mjs
 * Needs: puppeteer (installed by CI; `npm i puppeteer` locally).
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MIME = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".html": "text/html",
  ".wasm": "application/wasm",
  ".map": "application/json",
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(ROOT, reqPath);
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      fs.readFile(filePath, (err, body) => {
        if (err) {
          res.writeHead(404).end("not found");
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, {
          "content-type": MIME[ext] ?? "application/octet-stream",
        });
        res.end(body);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

const FIXTURE_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><title>test</title></head><body>
<pre id="out"></pre>
<script type="module">
  const out = document.getElementById("out");
  const log = (m) => { out.textContent += m + "\\n"; };
  window.__results = {};
  try {
    const ns = await import("/src/index.js");
    const jm = ns.default ?? ns;
    const checks = {
      "jm exists": !!jm,
      "jm.key is function": typeof jm.key === "function",
      "jm.theory.harmony.Key is function":
        typeof jm.theory?.harmony?.Key === "function",
      "jm.generative.walks.Chain is function":
        typeof jm.generative?.walks?.Chain === "function",
      // play and score moved to jmon/show, converters to jmon/io. Assert
      // they are gone, so a stale copy of either cannot pass unnoticed.
      "jm.play is gone": jm.play === undefined,
      "jm.score is gone": jm.score === undefined,
      "jm.converters is gone": jm.converters === undefined,
      "jm.analysis is object": typeof jm.analysis === "object",
      "jm.utils.retrograde is function": typeof jm.utils?.retrograde === "function",
    };
    const k = jm.key("C", "major");
    checks["jm.key('C','major').tonic === 'C'"] = k.tonic === "C";
    checks["jm.key('C','major').mode === 'major'"] = k.mode === "major";
    checks["k.scale is function"] = typeof k.scale === "function";
    checks["k.voice is function"] = typeof k.voice === "function";
    const chain = new jm.generative.walks.Chain({
      walkRange: [0, 7], walkStart: 3,
      walkProbability: [-1, 0, 1], roundTo: 0,
    });
    const walk = chain.line({ length: 8, seed: 42 });
    checks["Chain.line returns 8-length array"] =
      Array.isArray(walk) && walk.length === 8;
    window.__results = checks;
    for (const [name, ok] of Object.entries(checks)) {
      log((ok ? "PASS  " : "FAIL  ") + name);
    }
  } catch (e) {
    window.__results = { __error: e.stack || e.message || String(e) };
    log("ERROR: " + (e.stack || e.message || e));
  }
  document.title = "done";
</script>
</body></html>`;

async function loadPuppeteer() {
  // Try the normal resolution first, then a couple of fallback paths so
  // the test runs even when puppeteer was installed outside the project.
  const candidates = [
    "puppeteer",
    path.join(ROOT, "node_modules/puppeteer/lib/puppeteer/puppeteer.js"),
    "/tmp/node_modules/puppeteer/lib/puppeteer/puppeteer.js",
  ];
  for (const spec of candidates) {
    try {
      const mod = await import(spec);
      return mod.default ?? mod;
    } catch { /* try next */ }
  }
  console.error(
    "puppeteer not installed. Install with: npm i puppeteer"
  );
  process.exit(2);
}

const { server, port } = await startServer();
const fixturePath = path.join(ROOT, ".browser-load-fixture.html");
fs.writeFileSync(fixturePath, FIXTURE_HTML);

let exitCode = 0;
try {
  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) =>
    console.error("PAGEERROR:", e.message));
  page.on("requestfailed", (r) => {
    const url = r.url();
    // favicon.ico is fetched automatically by Chrome; ignore.
    if (!url.endsWith("/favicon.ico")) {
      console.error("REQFAIL:", url, r.failure()?.errorText);
    }
  });

  await page.goto(`http://127.0.0.1:${port}/.browser-load-fixture.html`,
    { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.title === "done",
    { timeout: 30000 });

  const results = await page.evaluate(() => window.__results);
  const output = await page.$eval("#out", (el) => el.textContent);
  console.log(output);

  if (results.__error) {
    console.error("FAILED: import threw");
    exitCode = 1;
  } else {
    const failed = Object.entries(results).filter(([, ok]) => !ok);
    if (failed.length) {
      console.error(`FAILED (${failed.length}):`,
        failed.map(([n]) => n).join(", "));
      exitCode = 1;
    } else {
      console.log("All checks passed.");
    }
  }
  await browser.close();
} finally {
  fs.unlinkSync(fixturePath);
  server.close();
}

process.exit(exitCode);
