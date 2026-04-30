/**
 * Notebook-side player that embeds the REAL Tone.js player inside an iframe.
 *
 * The Jupyter/Observable frontend is a browser page — it has a DOM and can
 * run Tone.js. What it doesn't have is a way to `import` our library from
 * the Deno/Node kernel side. The trick: inline the UMD bundle as a base64
 * data URL inside an iframe's `srcdoc`, point a script tag at the caller-
 * provided Tone URL, and then call `window.jm.default.play(composition,
 * { Tone })`. Inside the iframe `env.isBrowser()` is true, so `jm.play()`
 * takes its **browser path** and spawns the existing `music-player.js` UI
 * — full JMON fidelity preserved: per-track synths, audioGraph, effects,
 * vibrato, tremolo, glissando, microtuning, the works. No MIDI round-trip,
 * no feature loss.
 *
 * ## Decoupling
 *
 * jmon/algo does not ship Tone.js and does not pick a CDN for you. Just
 * like `jm.score({toolkit})` requires you to hand over a Verovio toolkit,
 * `jm.play({Tone})` requires you to hand over Tone:
 *
 *   - **Browser path:** `Tone` is a live module (e.g. `import * as Tone
 *     from "tone"`). Same as before.
 *   - **Notebook path:** `Tone` is a **URL string** pointing at a Tone.js
 *     UMD script. The iframe's `<script src>` tag loads it in its own
 *     browser context, where it can create an AudioContext.
 *
 * If you don't want to retype the URL every time, alias it:
 *
 *   const ToneUrl = "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js";
 *   await jm.play(composition, { Tone: ToneUrl });
 */

const JMON_CDN_FALLBACK =
  "https://cdn.jsdelivr.net/npm/@jmon/algo@latest/dist/jmon.umd.js";

let _cachedBundle = null;

/**
 * Read `dist/jmon.umd.js` from disk (Deno or Node) or return null if we
 * can't — the caller will fall back to a CDN URL in that case. Result is
 * cached for the lifetime of the kernel so repeat calls are cheap.
 */
async function loadLocalUmdBundle() {
  if (_cachedBundle !== null) return _cachedBundle;
  const bundleUrl = new URL("../dist/jmon.umd.js", import.meta.url);
  try {
    if (typeof Deno !== "undefined" && typeof Deno.readTextFile === "function") {
      _cachedBundle = await Deno.readTextFile(bundleUrl);
      return _cachedBundle;
    }
    if (typeof process !== "undefined" && process.versions?.node) {
      const { readFile } = await import("node:fs/promises");
      _cachedBundle = await readFile(bundleUrl, "utf8");
      return _cachedBundle;
    }
  } catch {
    // File not readable — caller will fall back to CDN.
  }
  _cachedBundle = "";
  return "";
}

/**
 * Minimal base64 encoder (handles the UMD bundle's non-ASCII characters if
 * any). Browsers and Deno both have `btoa`, but `btoa` only takes Latin-1.
 * We encode as UTF-8 first.
 */
function toBase64(str) {
  if (typeof btoa === "function") {
    // Encode UTF-8 → binary string → base64, in chunks to avoid stack
    // overflow on ~400KB inputs.
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, i + chunkSize),
      );
    }
    return btoa(binary);
  }
  // Node fallback
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64");
  }
  throw new Error("No base64 encoder available");
}

/** HTML-escape a string for safe inclusion in an attribute value. */
function escapeAttr(html) {
  return html
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

/**
 * Build a notebook-embeddable player. Returns a MIME bundle whose
 * `text/html` content is an iframe that loads Tone.js (from a URL the
 * caller provides) plus the jmon/algo UMD bundle, and spawns the full
 * browser player inside.
 *
 * @param {Object} composition - The JMON composition
 * @param {Object} options
 * @param {string} options.Tone - **Required.** URL of a Tone.js UMD
 *   script. The iframe loads it via `<script src>` into its own browser
 *   context. Example:
 *   `"https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js"`
 * @param {number} [options.height=160] - iframe height in pixels
 * @param {string} [options.bundleUrl] - Override the jmon bundle source.
 *   Defaults to the local `dist/jmon.umd.js` (inlined as a data URL) or
 *   the published jsDelivr bundle if the local file is unreadable.
 * @param {boolean} [options.autoplay=false] - Start playback immediately
 * @returns {Promise<Object>} MIME bundle: { text/html, text/plain }
 */
export async function notebookPlayer(composition, options = {}) {
  const {
    Tone: toneUrl,
    height = 160,
    bundleUrl: bundleOverride,
    autoplay = false,
  } = options;

  if (typeof toneUrl !== "string" || toneUrl.length === 0) {
    throw new Error(
      "jm.play() in a notebook/headless context requires a Tone.js URL.\n" +
      "Pass it via the `Tone` option:\n" +
      "  await jm.play(composition, {\n" +
      '    Tone: "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js"\n' +
      "  });\n" +
      "(In a browser, `Tone` should be a live Tone.js module instead.)"
    );
  }

  // Resolve the jmon bundle URL: explicit override > local file > CDN.
  let jmonSrc;
  if (bundleOverride) {
    jmonSrc = bundleOverride;
  } else {
    const local = await loadLocalUmdBundle();
    if (local) {
      jmonSrc = `data:text/javascript;base64,${toBase64(local)}`;
    } else {
      jmonSrc = JMON_CDN_FALLBACK;
    }
  }

  // Extract options that make sense inside the iframe and drop anything
  // that can't be JSON-serialized (e.g. a Tone instance the caller passed
  // in for a browser use case — the iframe brings its own Tone).
  const safeOptions = JSON.stringify({
    autoplay,
  });
  const compositionJson = JSON.stringify(composition);

  const doc =
    `<!DOCTYPE html><html><head><meta charset="utf-8">` +
    `<style>` +
    `html,body{margin:0;padding:0;background:transparent;` +
    `font-family:system-ui,-apple-system,sans-serif}` +
    `#err{color:#ff6b6b;padding:8px;font-family:monospace;` +
    `font-size:12px;white-space:pre-wrap}` +
    `</style>` +
    `<script src="${toneUrl}"></script>` +
    `<script src="${jmonSrc}"></script>` +
    `</head><body>` +
    `<div id="root"></div>` +
    `<script>` +
    `(async () => {` +
    `  const composition = ${compositionJson};` +
    `  const options = ${safeOptions};` +
    `  try {` +
    // Wait up to 5s for Tone and jm to show up (CDN scripts are async).
    `    const deadline = Date.now() + 5000;` +
    `    while ((!window.Tone || !window.jm) && Date.now() < deadline) {` +
    `      await new Promise(r => setTimeout(r, 25));` +
    `    }` +
    `    if (!window.Tone) throw new Error("Tone.js failed to load from ${toneUrl}");` +
    `    if (!window.jm) throw new Error("jmon/algo bundle failed to load");` +
    // The UMD bundle wraps ESM exports via __toCommonJS, so the default
    // export sits at `.default`. Fall back to `.jm` (named export) and
    // then to `window.jm` itself for older bundle shapes.
    `    const api = window.jm.default || window.jm.jm || window.jm;` +
    `    if (!api || typeof api.play !== "function") {` +
    `      throw new Error("jm.play not found on loaded bundle (keys: " + Object.keys(window.jm).join(",") + ")");` +
    `    }` +
    `    const player = await api.play(composition, { Tone: window.Tone, ...options });` +
    `    const root = document.getElementById("root");` +
    `    root.innerHTML = "";` +
    `    root.appendChild(player);` +
    `  } catch (err) {` +
    `    const pre = document.createElement("pre");` +
    `    pre.id = "err";` +
    `    pre.textContent = (err && err.stack) || String(err);` +
    `    document.body.appendChild(pre);` +
    `  }` +
    `})();` +
    `</script></body></html>`;

  const html =
    `<iframe srcdoc="${escapeAttr(doc)}" ` +
    `style="width:100%;height:${height}px;border:none;display:block" ` +
    `sandbox="allow-scripts allow-same-origin"></iframe>`;

  return {
    "text/html": html,
    "text/plain": `[player: ${composition.tracks?.length || 0} track(s)]`,
  };
}
