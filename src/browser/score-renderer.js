/**
 * Score Renderer
 * Uses Verovio for rendering musical notation.
 */

import { musicxml } from "../converters/verovio.js";

/**
 * Render sheet music notation using Verovio
 *
 * @param {Object} composition - The JMON composition to render
 * @param {Object} options - Rendering options
 * @param {Function} [options.verovio] - Verovio WASM module factory (from import verovio from "npm:verovio@4.3.1/wasm")
 * @param {Function} [options.VerovioToolkit] - VerovioToolkit class (from import { VerovioToolkit } from "npm:verovio@4.3.1/esm")
 * @param {Object} [options.toolkit] - Pre-initialized VerovioToolkit instance (alternative to verovio + VerovioToolkit)
 * @param {number} [options.width] - Staff width in pixels (default: auto)
 * @param {number} [options.scale] - Scale factor for rendering (default: 100)
 * @returns {HTMLElement} DOM element containing the rendered score
 */
export async function score(composition, options = {}) {
  const {
    verovio: createVerovioModule,
    VerovioToolkit,
    toolkit,
    width,
    scale = 40,
  } = options;

  // Create container
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.overflow = "visible";

  // Create rendering target
  const notationDiv = document.createElement("div");
  notationDiv.id = `rendered-score-${Date.now()}`;
  container.appendChild(notationDiv);

  try {
    if (!toolkit && !createVerovioModule) {
      notationDiv.innerHTML =
        '<p style="color:#ff6b6b">Verovio library not loaded. Import with: import verovio from "npm:verovio@4.3.1/wasm" and import { VerovioToolkit } from "npm:verovio@4.3.1/esm"</p>';
      return container;
    }

    notationDiv.innerHTML = '<p style="color:#888">Initializing Verovio...</p>';

    // Use pre-initialized toolkit or create one from factory
    let vrvToolkit;
    if (toolkit) {
      vrvToolkit = toolkit;
    } else {
      // Support both direct functions and ES module namespace objects (e.g. from dynamic import())
      const factory =
        typeof createVerovioModule === "function"
          ? createVerovioModule
          : createVerovioModule?.default;
      const Toolkit =
        typeof VerovioToolkit === "function"
          ? VerovioToolkit
          : VerovioToolkit?.default;
      const VerovioModule = await factory();
      vrvToolkit = new Toolkit(VerovioModule);
    }

    // Convert JMON to MusicXML
    const musicXML = musicxml(composition);

    // Set options
    const renderOptions = {
      scale: scale,
      adjustPageHeight: true,
      breaks: "auto",
      pageWidth: width || 2100,
      pageHeight: 2970,
      spacingStaff: 12,
      spacingSystem: 12,
    };

    vrvToolkit.setOptions(renderOptions);

    // Load and render MusicXML
    vrvToolkit.loadData(musicXML);
    const svg = vrvToolkit.renderToSVG(1);

    notationDiv.innerHTML = svg;
  } catch (error) {
    console.error("[SCORE] Render error:", error);
    notationDiv.innerHTML = `<p style="color:#ff6b6b">Error: ${error.message}</p>`;
  }

  return container;
}
