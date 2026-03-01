/**
 * VexFlow converter for JMON compositions
 * Converts JMON format to VexFlow notation objects
 *
 * Added features:
 * - Title text (from composition.metadata.title)
 * - Tempo text (from composition.tempo or composition.bpm)
 * - Multiline wrapping of measures (rendererConfig.measuresPerLine)
 */

import { deriveVisualFromArticulations } from "../utils/notation/deriveVisualFromArticulations.js";

class VexFlowConverter {
  constructor() {
    this.noteMap = {
      60: "C/4",
      61: "C#/4",
      62: "D/4",
      63: "D#/4",
      64: "E/4",
      65: "F/4",
      66: "F#/4",
      67: "G/4",
      68: "G#/4",
      69: "A/4",
      70: "A#/4",
      71: "B/4",
      72: "C/5",
      73: "C#/5",
      74: "D/5",
      75: "D#/5",
      76: "E/5",
      77: "F/5",
      78: "F#/5",
      79: "G/5",
      80: "G#/5",
      81: "A/5",
      82: "A#/5",
      83: "B/5",
    };
  }

  /**
   * Convert MIDI note number to VexFlow pitch notation
   */
  midiToVexFlow(midiNote) {
    if (this.noteMap[midiNote]) {
      return this.noteMap[midiNote];
    }

    // Calculate for notes outside the map
    const octave = Math.floor(midiNote / 12) - 1;
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const noteName = noteNames[midiNote % 12];
    return `${noteName}/${octave}`;
  }

  /**
   * Convert duration to VexFlow duration string
   */
  durationToVexFlow(duration) {
    // VexFlow uses string durations: "w", "h", "q", "8", "16", "32"
    if (duration >= 4) return "w"; // whole note
    if (duration >= 2) return "h"; // half note
    if (duration >= 1) return "q"; // quarter note
    if (duration >= 0.5) return "8"; // eighth note
    if (duration >= 0.25) return "16"; // sixteenth note
    return "32"; // thirty-second note
  }

  /**
   * Convert JMON composition to VexFlow format
   */
  convertToVexFlow(composition) {
    const result = {
      timeSignature: composition.timeSignature || "4/4",
      keySignature: composition.keySignature || "C",
      clef: composition.clef,
      metadata: composition.metadata || {},
      tempo: composition.tempo ?? composition.bpm ?? null,
      tracks: [],
    };

    // Handle tracks: array, object map, or single-track fallback
    let tracks = [];
    if (Array.isArray(composition.tracks)) {
      tracks = composition.tracks.map((t, i) => ({
        name: t.name || `Track ${i + 1}`,
        notes: t.notes || t,
        clef: t.clef,
      }));
    } else if (composition.tracks && typeof composition.tracks === "object") {
      tracks = Object.entries(composition.tracks).map(([name, notes], i) => ({
        name: name || `Track ${i + 1}`,
        notes,
        clef: (notes && notes.clef) || undefined,
      }));
    } else if (composition.notes) {
      tracks = [{
        name: composition.name || "Track 1",
        notes: composition.notes,
        clef: composition.clef,
      }];
    } else {
      tracks = [{
        name: "Track 1",
        notes: composition,
        clef: composition.clef,
      }];
    }

    tracks.forEach((track, trackIndex) => {
      const notes = track.notes || track;
      const vexFlowNotes = [];

      if (Array.isArray(notes)) {
        notes.forEach((note) => {
          const pitches = Array.isArray(note.pitch)
            ? note.pitch
            : (note.pitch !== null && note.pitch !== undefined
              ? [note.pitch]
              : []);
          if (pitches.length > 0) {
            const vexFlowNote = {
              keys: pitches.map((p) =>
                String(this.midiToVexFlow(p)).toLowerCase()
              ),
              duration: this.durationToVexFlow(note.duration || 1),
              time: note.time ?? 0,
            };

            // Add articulations if present (according to JMON schema)
            if (note.articulation || (Array.isArray(note.articulations) && note.articulations.length)) {
              // Handle single articulation (JMON schema format)
              if (note.articulation && typeof note.articulation === 'string') {
                vexFlowNote.articulations = [note.articulation];
              }
              // Handle legacy array-based articulations
              else if (Array.isArray(note.articulations) && note.articulations.length) {
                const hints = deriveVisualFromArticulations(note.articulations);
                if (hints && hints.vexflow) {
                  // Pre-resolved VexFlow articulation glyph codes
                  if (Array.isArray(hints.vexflow.articulations) && hints.vexflow.articulations.length) {
                    vexFlowNote.vfArticulations = hints.vexflow.articulations.slice();
                  }
                  // Stroke (arpeggiate/strum) direction/style
                  if (hints.vexflow.stroke) {
                    vexFlowNote.stroke = { ...hints.vexflow.stroke };
                  }
                  // Gliss/Portamento hint
                  if (hints.vexflow.gliss) {
                    const g = hints.vexflow.gliss;
                    try {
                      vexFlowNote.gliss = {
                        type: g.type,
                        targetKey: (typeof g.target === "number")
                          ? String(this.midiToVexFlow(g.target)).toLowerCase()
                          : undefined,
                        curve: g.curve || "linear",
                        text: g.text || (g.type === "portamento" ? "port." : "gliss.")
                      };
                    } catch (_) {
                      // safe fallback: omit gliss if conversion fails
                    }
                  }
                }
              }
            }

            // Add ornaments if present (JMON schema)
            if (Array.isArray(note.ornaments) && note.ornaments.length) {
              vexFlowNote.ornaments = note.ornaments.map(ornament => {
                const processedOrnament = { type: ornament.type };

                if (ornament.parameters) {
                  processedOrnament.parameters = { ...ornament.parameters };

                  // Handle grace notes specifically
                  if (ornament.type === 'grace_note' && ornament.parameters.gracePitches) {
                    processedOrnament.parameters.gracePitches = ornament.parameters.gracePitches.map(pitch => {
                      if (typeof pitch === 'number') {
                        return this.midiToVexFlow(pitch);
                      }
                      return pitch; // assume it's already in proper format
                    });
                  }
                }

                return processedOrnament;
              });
            }

            vexFlowNotes.push(vexFlowNote);
          } else {
            // Rest
            vexFlowNotes.push({
              keys: [],
              duration: this.durationToVexFlow(note.duration || 1),
              time: note.time ?? 0,
              isRest: true,
            });
          }
        });
      }

      result.tracks.push({
        name: track.name || `Track ${trackIndex + 1}`,
        notes: vexFlowNotes,
        clef: track.clef,
      });
    });

    return result;
  }

  /**
   * Create VexFlow renderer configuration
   */
  createRenderer(elementId, width = 800, height = 200) {
    return {
      elementId,
      width,
      height,
      renderer: "svg", // or 'canvas'
      scale: 1.0,
    };
  }

  /**
   * Generate VexFlow rendering instructions
   */
  generateRenderingInstructions(vexFlowData, rendererConfig) {
    return {
      type: "vexflow",
      data: vexFlowData,
      config: rendererConfig,
      render: function (VF) {
        // This function will be called with VexFlow library loaded
        // Resolve target element from either a direct element reference or an elementId
        const targetEl =
          (rendererConfig.element && rendererConfig.element.nodeType === 1)
            ? rendererConfig.element
            : (rendererConfig.elementId
              ? document.getElementById(rendererConfig.elementId)
              : null);

        // Ensure we always have a valid HTMLDivElement for VexFlow
        let div = targetEl;
        const root = (document.body || document.documentElement);

        if (!div) {
          // No element provided: create a container and attach it
          div = document.createElement("div");
          div.id = rendererConfig.elementId || `vexflow-${Date.now()}`;
          root.appendChild(div);
        } else {
          // Caller provided an element. Make sure it has an id and is attached to DOM.
          if (!div.id) {
            div.id = rendererConfig.elementId || `vexflow-${Date.now()}`;
          }
          if (!root.contains(div)) {
            // Attach to DOM
            root.appendChild(div);
          }
        }
        // Ensure renderer uses the actual element's id
        rendererConfig.elementId = div.id;
        const VFNS = (() => {
          const candidates = [
            VF,
            VF && VF.default,
            typeof globalThis.window !== "undefined" && (globalThis.window.VF || globalThis.window.VexFlow),
            typeof globalThis.window !== "undefined" &&
            globalThis.window.Vex &&
            (globalThis.window.Vex.Flow || globalThis.window.Vex),
          ];
          for (const c of candidates) {
            if (c) return c;
          }
          return null;
        })();

        try {
          // Prefer Factory API when available (v4+)
          const FactoryCtor = VFNS &&
            (VFNS.Factory ||
              (VFNS.Flow && VFNS.Flow.Factory) ||
              (VFNS.VF && VFNS.VF.Factory));
          if (!FactoryCtor) {
            throw new Error("VexFlow Factory API not available on this build");
          }
          const factory = new FactoryCtor({
            renderer: {
              // Use elementId for VexFlow Factory (falls back to generated div id)
              elementId: rendererConfig.elementId || div.id,
              width: rendererConfig.width,
              height: rendererConfig.height,
            },
          });

          // Draw using low-level API with Factory context to avoid EasyScore strictness
          const context = factory.getContext();
          const Flow = (VFNS && (VFNS.Flow || VFNS)) || {};
          const accMode = rendererConfig.accidentalsMode || "auto";
          const getKeyAccidentalMap = (key) => {
            const k = (key || "C").trim();
            const majorSharps = {
              C: 0,
              G: 1,
              D: 2,
              A: 3,
              E: 4,
              B: 5,
              "F#": 6,
              "C#": 7,
            };
            const majorFlats = {
              C: 0,
              F: 1,
              Bb: 2,
              Eb: 3,
              Ab: 4,
              Db: 5,
              Gb: 6,
              Cb: 7,
            };
            const minorSharps = {
              A: 0,
              E: 1,
              B: 2,
              "F#": 3,
              "C#": 4,
              "G#": 5,
              "D#": 6,
              "A#": 7,
            };
            const minorFlats = {
              A: 0,
              D: 1,
              G: 2,
              C: 3,
              F: 4,
              Bb: 5,
              Eb: 6,
              Ab: 7,
            };
            const orderSharps = ["f", "c", "g", "d", "a", "e", "b"];
            const orderFlats = ["b", "e", "a", "d", "g", "c", "f"];
            const isMinor = /m(in)?$/i.test(k);
            const base = k.replace(/m(in)?$/i, "");
            let count = 0;
            let type = "natural";
            if (isMinor && minorSharps[base] !== undefined) {
              count = minorSharps[base];
              type = "sharp";
            } else if (isMinor && minorFlats[base] !== undefined) {
              count = minorFlats[base];
              type = "flat";
            } else if (majorSharps[base] !== undefined) {
              count = majorSharps[base];
              type = "sharp";
            } else if (majorFlats[base] !== undefined) {
              count = majorFlats[base];
              type = "flat";
            }
            const map = {
              a: "natural",
              b: "natural",
              c: "natural",
              d: "natural",
              e: "natural",
              f: "natural",
              g: "natural",
            };
            if (type === "sharp") {
              for (let i = 0; i < count; i++) map[orderSharps[i]] = "sharp";
            }
            if (type === "flat") {
              for (let i = 0; i < count; i++) map[orderFlats[i]] = "flat";
            }
            return map;
          };
          const keyAccMap = getKeyAccidentalMap(vexFlowData.keySignature);

          // Helpers
          const durToTicks = (d) => {
            const s = String(d).replace(/r/g, "");
            const map = { w: 32, h: 16, q: 8, "8": 4, "16": 2, "32": 1 };
            return map[s] || 0;
          };
          const parseTS = (ts) => {
            const [n, d] = (ts || "4/4").split("/").map((x) => parseInt(x, 10));
            return { n: n || 4, d: d || 4 };
          };
          const ts = parseTS(vexFlowData.timeSignature);
          const measureCapacity = Math.max(1, Math.round((32 * ts.n) / ts.d));

          // Segment notes into measures
          const ticksToDur = (ticks) => {
            const inv = { 32: "w", 16: "h", 8: "q", 4: "8", 2: "16", 1: "32" };
            return inv[ticks] || "q";
          };
          // Split notes across measures and mark ties
          const measures = [];
          let cur = [];
          let acc = (() => {
            const notes = vexFlowData.tracks[0].notes || [];
            const minTime = notes.reduce(
              (m, n) => Math.min(m, n.time ?? 0),
              Number.POSITIVE_INFINITY,
            );
            const base = minTime === Number.POSITIVE_INFINITY ? 0 : minTime;
            // Convert beats to 32nd-note ticks (1 beat = 8 ticks)
            return Math.round((base * 8) % measureCapacity);
          })();
          const originalNotes = vexFlowData.tracks[0].notes;
          const graceBuf = [];
          for (const nd of originalNotes) {
            const ticks = durToTicks(nd.duration);
            const isGrace = !!nd.grace;
            if (isGrace) {
              graceBuf.push(nd);
              continue;
            }
            let t = ticks;
            let firstPart = true;
            while (t > 0) {
              const remaining = measureCapacity - acc;
              const slice = Math.min(t, remaining);
              const part = { ...nd, duration: ticksToDur(slice) };
              if (firstPart && graceBuf.length) {
                part.graceNotes = graceBuf.splice(0, graceBuf.length);
              }
              if (!firstPart) part.tieFromPrev = true;
              if (slice < t) part.tieToNext = true;
              cur.push(part);
              acc += slice;
              t -= slice;
              firstPart = false;
              if (acc >= measureCapacity) {
                measures.push(cur);
                cur = [];
                acc = 0;
              }
            }
          }
          if (cur.length) measures.push(cur);

          // Layout params
          const left = 10;
          const right = 10;
          const top = 40;
          const avail = Math.max(
            100,
            (rendererConfig.width || 800) - left - right,
          );
          const mCount = Math.max(1, measures.length);
          // Increase minimum measure width to prevent note cramping
          const mWidth = Math.max(300, Math.floor(avail / mCount));
          // Auto-detect clef based on median pitch across measures
          const keyToMidi = (k) => {
            const m = /^([a-g])(b|#)?\/(-?\d+)$/.exec(k);
            if (!m) return 60; // default to middle C
            const letters = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
            const letter = letters[m[1]];
            const acc = m[2] === "#" ? 1 : (m[2] === "b" ? -1 : 0);
            const octave = parseInt(m[3], 10);
            return (octave + 1) * 12 + letter + acc;
          };
          const allPitches = [];
          measures.forEach((ms) => {
            ms.forEach((n) => {
              if (n && !n.isRest && Array.isArray(n.keys) && n.keys[0]) {
                allPitches.push(keyToMidi(String(n.keys[0]).toLowerCase()));
              }
            });
          });
          const median = allPitches.length
            ? (() => {
              const arr = [...allPitches].sort((a, b) => a - b);
              const mid = arr.length / 2;
              return arr.length % 2
                ? arr[Math.floor(mid)]
                : (arr[mid - 1] + arr[mid]) / 2;
            })()
            : 60;
          const detectedClef = median < 60 ? "bass" : "treble";

          // Determine wrapping
          const measuresPerLine =
            rendererConfig.measuresPerLine && rendererConfig.measuresPerLine > 0
              ? Math.max(1, Math.floor(rendererConfig.measuresPerLine))
              : Math.max(
                1,
                Math.floor(
                  avail /
                    Math.max(120, Math.floor(avail / Math.max(1, mCount))),
                ),
              );

          // Chunk measures into lines
          const lines = [];
          for (let i = 0; i < measures.length; i += measuresPerLine) {
            lines.push(measures.slice(i, i + measuresPerLine));
          }

          // Layout gap between systems
          const systemGap = 80;

          // Render each system (line)
          const allBeams = [];
          const createdNotes = [];
          lines.forEach((lineMeasures, sysIndex) => {
            const y = top + sysIndex * systemGap;

            // One stave per system
            const stave = new Flow.Stave(left, y, avail);

            const normalizeClef = (c) => {
              const m = (c || "").toString().toLowerCase();
              const map = {
                g: "treble",
                treble: "treble",
                f: "bass",
                bass: "bass",
                c: "alto",
                alto: "alto",
                tenor: "tenor",
                "treble-8vb": "treble-8vb",
                "treble-8va": "treble-8va",
                "bass-8vb": "bass-8vb",
              };
              return map[m] || "treble";
            };
            const clefToUse = normalizeClef(
              vexFlowData.clef ||
                (vexFlowData.tracks &&
                  vexFlowData.tracks[0] &&
                  vexFlowData.tracks[0].clef) ||
                detectedClef,
            );
            stave.addClef(clefToUse);
            if (vexFlowData.timeSignature && sysIndex === 0) {
              stave.addTimeSignature(vexFlowData.timeSignature);
            }
            if (
              vexFlowData.keySignature && vexFlowData.keySignature !== "C" &&
              sysIndex === 0
            ) {
              stave.addKeySignature(vexFlowData.keySignature);
            }
            stave.setContext(context).draw();

            // Title and tempo (draw on first system)
            if (sysIndex === 0) {
              try {
                const title = vexFlowData.metadata &&
                  vexFlowData.metadata.title;
                if (title) {
                  context.save();
                  context.setFont("bold 16px Arial");
                  context.fillText(title, left, y - 20);
                  context.restore();
                }
                if (vexFlowData.tempo) {
                  context.save();
                  context.setFont("12px Arial");
                  const tempoText = `♩ = ${vexFlowData.tempo}`;
                  context.fillText(tempoText, left + 200, y - 8);
                  context.restore();
                }
              } catch {
                // Ignore optional rendering errors
              }
            }

            // Build tickables for the system (insert barlines between measures)
            const tickables = [];
            lineMeasures.forEach((mNotes, idxInLine) => {
              const sorted = mNotes.slice().sort((a, b) =>
                (a.time ?? 0) - (b.time ?? 0)
              );
              sorted.forEach((noteData) => {
                if (noteData.isRest) {
                  tickables.push(
                    new Flow.StaveNote({
                      keys: ["d/5"],
                      duration: String(noteData.duration).replace(/r?$/, "r"),
                    }),
                  );
                } else {
                  const note = new Flow.StaveNote({
                    keys: noteData.keys.map((k) => k.toLowerCase()),
                    duration: noteData.duration,
                  });
                  tickables.push(note);
                  createdNotes.push({ vf: note, data: noteData });
                }
              });
              // Internal barline (skip after last in line)
              if (
                idxInLine < lineMeasures.length - 1 && Flow.BarNote &&
                Flow.Barline && Flow.Barline.type
              ) {
                tickables.push(new Flow.BarNote(Flow.Barline.type.SINGLE));
              }
            });

            // Voice and format for this system
            const voice = new Flow.Voice({
              num_beats: Math.max(1, lineMeasures.length) * measureCapacity,
              beat_value: 32,
            });
            if (
              voice.setMode && Flow.Voice && Flow.Voice.Mode &&
              Flow.Voice.Mode.SOFT !== undefined
            ) {
              voice.setMode(Flow.Voice.Mode.SOFT);
            } else if (typeof voice.setStrict === "function") {
              voice.setStrict(false);
            }
            voice.addTickables(
              tickables.filter((t) =>
                typeof t.getTicks === "function"
                  ? t.getTicks().value() > 0
                  : true
              ),
            );

            const formatter = new Flow.Formatter().joinVoices([voice]);
            formatter.format([voice], avail - 20);
            voice.draw(context, stave);
          });

          // Build all tickables and beams per measure, insert BarNote between measures
          const allTickables = [];
          // createdNotes already declared earlier
          // allBeams already declared earlier
          measures.forEach((mNotes, idx) => {
            const tickables = mNotes.slice().sort((a, b) =>
              (a.time ?? 0) - (b.time ?? 0)
            ).map((noteData) => {
              if (noteData.isRest) {
                return new Flow.StaveNote({
                  keys: ["d/5"],
                  duration: String(noteData.duration).replace(/r?$/, "r"),
                });
              }
              const note = new Flow.StaveNote({
                keys: noteData.keys.map((k) => k.toLowerCase()),
                duration: noteData.duration,
              });
              // Grace notes (attach if present on this note)
              if (
                noteData.graceNotes && Flow.GraceNoteGroup && Flow.GraceNote
              ) {
                try {
                  const gnotes = noteData.graceNotes.map((g) =>
                    new Flow.GraceNote({
                      keys: (g.keys || []).map((kk) =>
                        String(kk).toLowerCase()
                      ),
                      duration: "16",
                      slash: true,
                    })
                  );
                  const ggroup = new Flow.GraceNoteGroup(gnotes, true);
                  if (typeof ggroup.beamNotes === "function") {
                    ggroup.beamNotes();
                  }
                  if (
                    typeof ggroup.setContext === "function" &&
                    typeof ggroup.attachToNote === "function"
                  ) {
                    ggroup.setContext(context);
                    ggroup.attachToNote(note);
                  }
                } catch {
                // Ignore optional rendering errors
              }
              }

              // Handle JMON ornaments (like grace notes from ornaments array)
              if (Array.isArray(noteData.ornaments) && noteData.ornaments.length && Flow.GraceNoteGroup && Flow.GraceNote) {
                const graceNoteOrnaments = noteData.ornaments.filter(orn => orn.type === 'grace_note');

                if (graceNoteOrnaments.length > 0) {
                  try {
                    const allGraceNotes = graceNoteOrnaments.flatMap(orn => {
                      if (orn.parameters && orn.parameters.gracePitches) {
                        return orn.parameters.gracePitches.map(pitch =>
                          new Flow.GraceNote({
                            keys: [String(pitch).toLowerCase()],
                            duration: "16",
                            slash: orn.parameters.graceNoteType === "acciaccatura",
                          })
                        );
                      }
                      return [];
                    });

                    if (allGraceNotes.length > 0) {
                      const ggroup = new Flow.GraceNoteGroup(allGraceNotes, true);
                      if (typeof ggroup.beamNotes === "function") {
                        ggroup.beamNotes();
                      }
                      if (
                        typeof ggroup.setContext === "function" &&
                        typeof ggroup.attachToNote === "function"
                      ) {
                        ggroup.setContext(context);
                        ggroup.attachToNote(note);
                      }
                    }
                  } catch (e) {
                    console.warn('Failed to render grace note ornaments:', e);
                  }
                }
              }
              // Accidentals display (auto/always)
              if (Flow.Accidental) {
                noteData.keys.forEach((origKey, idx2) => {
                  const k = origKey.toLowerCase();
                  const m = /^([a-g])(#{1,2}|b{1,2})?\/-?\d+$/.exec(k);
                  const letter = m ? m[1] : k[0];
                  const acc = m && m[2] ? (m[2].includes("#") ? "#" : "b") : "";
                  const sig = keyAccMap[letter] || "natural";
                  let glyph = null;
                  if (acc === "#" && sig !== "sharp") {
                    glyph = "#";
                  } else if (acc === "b" && sig !== "flat") {
                    glyph = "b";
                  }
                  if (glyph) {
                    if (typeof note.addAccidental === "function") {
                      note.addAccidental(idx2, new Flow.Accidental(glyph));
                    } else if (typeof note.addModifier === "function") {
                      note.addModifier(new Flow.Accidental(glyph), idx2);
                    }
                  }
                });
              }
              // Articulations glyphs: handle both JMON schema and VexFlow codes
              const articulationMap = {
                staccato: "a.",
                accent: "a>",
                tenuto: "a-",
                marcato: "a^",
                legato: "a-", // similar to tenuto for VexFlow
              };

              // Handle precomputed VexFlow codes first
              if (Array.isArray(noteData.vfArticulations) && noteData.vfArticulations.length) {
                noteData.vfArticulations.forEach((code) => {
                  if (
                    Flow &&
                    Flow.Articulation &&
                    Flow.Modifier &&
                    Flow.Modifier.Position &&
                    (typeof note.addArticulation === "function" ||
                      typeof note.addModifier === "function")
                  ) {
                    const art = new Flow.Articulation(code);
                    if (art && typeof art.setPosition === "function") {
                      art.setPosition(Flow.Modifier.Position.ABOVE);
                    }
                    if (typeof note.addArticulation === "function") {
                      note.addArticulation(0, art);
                    } else if (typeof note.addModifier === "function") {
                      note.addModifier(art, 0);
                    }
                  }
                });
              }

              // Handle JMON schema articulations (from converted notes)
              else if (Array.isArray(noteData.articulations)) {
                noteData.articulations.forEach((a) => {
                  const articulationType = typeof a === "string" ? a : (a && a.type);
                  const code = articulationMap[articulationType] || null;
                  if (!code) return;
                  if (
                    Flow &&
                    Flow.Articulation &&
                    Flow.Modifier &&
                    Flow.Modifier.Position &&
                    (typeof note.addArticulation === "function" ||
                      typeof note.addModifier === "function")
                  ) {
                    const art = new Flow.Articulation(code);
                    if (art && typeof art.setPosition === "function") {
                      art.setPosition(Flow.Modifier.Position.ABOVE);
                    }
                    if (typeof note.addArticulation === "function") {
                      note.addArticulation(0, art);
                    } else if (typeof note.addModifier === "function") {
                      note.addModifier(art, 0);
                    }
                  }
                });
              }

              // Stroke (arpeggiate/strum) direction, if supported by VexFlow
              if (noteData.stroke && Flow && Flow.Stroke) {
                try {
                  const dir = (noteData.stroke.direction || "up").toLowerCase();
                  const style = (noteData.stroke.style || "roll").toLowerCase();
                  const type =
                    Flow.Stroke.Type &&
                    (style === "brush"
                      ? (dir === "down" ? Flow.Stroke.Type.BRUSH_DOWN : Flow.Stroke.Type.BRUSH_UP)
                      : (dir === "down" ? Flow.Stroke.Type.ROLL_DOWN : Flow.Stroke.Type.ROLL_UP));
                  if (type && typeof note.addStroke === "function") {
                    note.addStroke(0, new Flow.Stroke(type));
                  }
                } catch (_) {
                  // safe fallback: skip stroke if not supported
                }
              }

              return note;
            });

            // Pass through dots and collect notes for ties
            tickables.forEach((n, i) => {
              const d = mNotes[i];
              if (!d || d.isRest) return;
              const dotCount = (typeof d.dots === "number")
                ? d.dots
                : (d.dots === true || d.dot === true || d.dotted === true
                  ? 1
                  : 0);
              for (let k = 0; k < dotCount; k++) {
                if (typeof n.addDotToAll === "function") {
                  n.addDotToAll();
                } else if (Flow.Dot) {
                  // Fallback: attach Dot modifier to all keys
                  d.keys.forEach((_, idx) => {
                    if (typeof n.addModifier === "function") {
                      n.addModifier(new Flow.Dot(), idx);
                    }
                  });
                }
              }
              createdNotes.push({ vf: n, data: d });
            });
            allTickables.push(...tickables);

            // Beams per measure (ignore rests)
            if (Flow.Beam && typeof Flow.Beam.generateBeams === "function") {
              const beamables = tickables.filter(
                (t) => typeof t.isRest !== "function" || !t.isRest(),
              );
              try {
                const beams = Flow.Beam.generateBeams(beamables);
                beams.forEach((b) => b.setContext(context));
                allBeams.push(...beams);
              } catch (_) {
                // ignore beaming errors
              }
            }

            // Internal barline between measures
            if (
              idx < measures.length - 1 &&
              Flow.BarNote &&
              Flow.Barline &&
              Flow.Barline.type
            ) {
              allTickables.push(new Flow.BarNote(Flow.Barline.type.SINGLE));
            }
          });

          const totalTicks = measures.length * measureCapacity;
          const voice = new Flow.Voice({
            num_beats: totalTicks,
            beat_value: 32,
          });
          if (
            voice.setMode && Flow.Voice && Flow.Voice.Mode &&
            Flow.Voice.Mode.SOFT !== undefined
          ) {
            voice.setMode(Flow.Voice.Mode.SOFT);
          } else if (typeof voice.setStrict === "function") {
            voice.setStrict(false);
          }
          voice.addTickables(
            allTickables.filter((t) =>
              typeof t.getTicks === "function" ? t.getTicks().value() > 0 : true
            ),
          );

          // Note: Voice drawing is handled per system in the lines.forEach loop above
          // Removing duplicate voice.draw call that uses undefined 'stave' variable

          if (allBeams.length) {
            allBeams.forEach((b) => {
              try {
                b.draw();
              } catch (_) {
                // Ignore optional errors
              }
            });
          }
          // Rendering complete - styling handled by main score function

          // Append collapsible VexFlow source block (like ABC)
          try {
            const details = document.createElement("details");
            details.style.marginTop = "10px";
            const summary = document.createElement("summary");
            summary.textContent = "VexFlow Source";
            summary.style.cursor = "pointer";
            details.appendChild(summary);
            const pre = document.createElement("pre");
            pre.textContent = JSON.stringify(vexFlowData, null, 2);
            details.appendChild(pre);
            // VexFlow source details are appended in index.js. Do not duplicate here.
          } catch (_) {
                // Ignore optional errors
              }
          // Draw simple ties when requested (tie to next note)
          if (createdNotes.length && Flow.StaveTie) {
            for (let i = 0; i < createdNotes.length - 1; i++) {
              const cur = createdNotes[i];
              if (!cur) continue;
              const d = cur.data || {};
              const isTieStart =
                !!(d.tieToNext || d.tieStart || d.tie === "start");
              if (!isTieStart) continue;
              // Find next actual note
              let next = null;
              for (let j = i + 1; j < createdNotes.length; j++) {
                if (createdNotes[j]) {
                  next = createdNotes[j];
                  break;
                }
              }
              if (next) {
                try {
                  new Flow.StaveTie({
                    first_note: cur.vf,
                    last_note: next.vf,
                    first_indices: [0],
                    last_indices: [0],
                  }).setContext(context).draw();
                } catch (_) {
                  // ignore tie errors
                }
              }
            }
          }

          // Draw glissando/portamento when available (safe fallback if unsupported)
          if (createdNotes.length && Flow && Flow.Glissando) {
            for (let i = 0; i < createdNotes.length - 1; i++) {
              const start = createdNotes[i];
              if (!start || !start.data || !start.vf) continue;
              const g = start.data.gliss;
              if (!g) continue;

              // Find target note by key match if provided, otherwise next note
              let end = null;
              if (g.targetKey) {
                for (let j = i + 1; j < createdNotes.length; j++) {
                  const cand = createdNotes[j];
                  if (cand && cand.data && Array.isArray(cand.data.keys)) {
                    const hasKey = cand.data.keys.some(
                      (k) => String(k).toLowerCase() === String(g.targetKey).toLowerCase()
                    );
                    if (hasKey) {
                      end = cand;
                      break;
                    }
                  }
                }
              }
              if (!end) {
                for (let j = i + 1; j < createdNotes.length; j++) {
                  if (createdNotes[j]) { end = createdNotes[j]; break; }
                }
              }

              if (end && end.vf) {
                try {
                  const gl = new Flow.Glissando({
                    from: start.vf,
                    to: end.vf,
                    text: g.text || (g.type === "portamento" ? "port." : "gliss."),
                  });
                  if (gl && typeof gl.setContext === "function") {
                    gl.setContext(context).draw();
                  }
                } catch (_) {
                  // safe fallback: skip gliss if not supported
                }
              }
            }
          }
        } catch (factoryError) {
          console.warn(
            "Factory API failed, trying low-level API:",
            factoryError,
          );

          // Fallback to low-level API (supports UMD/ESM and v4/v5)
          const Flow = (VFNS && (VFNS.Flow || VFNS.VF || VFNS)) || {};
          const accMode = rendererConfig.accidentalsMode || "auto";
          const getKeyAccidentalMap = (key) => {
            const k = (key || "C").trim();
            const majorSharps = {
              C: 0,
              G: 1,
              D: 2,
              A: 3,
              E: 4,
              B: 5,
              "F#": 6,
              "C#": 7,
            };
            const majorFlats = {
              C: 0,
              F: 1,
              Bb: 2,
              Eb: 3,
              Ab: 4,
              Db: 5,
              Gb: 6,
              Cb: 7,
            };
            const minorSharps = {
              A: 0,
              E: 1,
              B: 2,
              "F#": 3,
              "C#": 4,
              "G#": 5,
              "D#": 6,
              "A#": 7,
            };
            const minorFlats = {
              A: 0,
              D: 1,
              G: 2,
              C: 3,
              F: 4,
              Bb: 5,
              Eb: 6,
              Ab: 7,
            };
            const orderSharps = ["f", "c", "g", "d", "a", "e", "b"];
            const orderFlats = ["b", "e", "a", "d", "g", "c", "f"];
            const isMinor = /m(in)?$/i.test(k);
            const base = k.replace(/m(in)?$/i, "");
            let count = 0;
            let type = "natural";
            if (isMinor && minorSharps[base] !== undefined) {
              count = minorSharps[base];
              type = "sharp";
            } else if (isMinor && minorFlats[base] !== undefined) {
              count = minorFlats[base];
              type = "flat";
            } else if (majorSharps[base] !== undefined) {
              count = majorSharps[base];
              type = "sharp";
            } else if (majorFlats[base] !== undefined) {
              count = majorFlats[base];
              type = "flat";
            }
            const map = {
              a: "natural",
              b: "natural",
              c: "natural",
              d: "natural",
              e: "natural",
              f: "natural",
              g: "natural",
            };
            if (type === "sharp") {
              for (let i = 0; i < count; i++) map[orderSharps[i]] = "sharp";
            }
            if (type === "flat") {
              for (let i = 0; i < count; i++) map[orderFlats[i]] = "flat";
            }
            return map;
          };
          const keyAccMap = getKeyAccidentalMap(vexFlowData.keySignature);
          const Renderer = (Flow && Flow.Renderer) || VFNS.Renderer ||
            (VFNS.Flow && VFNS.Flow.Renderer);
          if (!Renderer || !Renderer.Backends) {
            throw new Error(
              "VexFlow low-level API not available (Renderer missing)",
            );
          }
          const renderer = new Renderer(
            div,
            Renderer.Backends.SVG,
          );
          renderer.resize(rendererConfig.width, rendererConfig.height);

          // Rendering complete

          const context = renderer.getContext();

          // Helpers
          const durToTicks = (d) => {
            const s = String(d).replace(/r/g, "");
            const map = { w: 32, h: 16, q: 8, "8": 4, "16": 2, "32": 1 };
            return map[s] || 0;
          };
          const parseTS = (ts) => {
            const [n, d] = (ts || "4/4").split("/").map((x) => parseInt(x, 10));
            return { n: n || 4, d: d || 4 };
          };
          const ts = parseTS(vexFlowData.timeSignature);
          const measureCapacity = Math.max(1, Math.round((32 * ts.n) / ts.d));

          // Segment notes into measures
          const ticksToDur = (ticks) => {
            const inv = { 32: "w", 16: "h", 8: "q", 4: "8", 2: "16", 1: "32" };
            return inv[ticks] || "q";
          };
          // Split notes across measures and mark ties
          const measures = [];
          let cur = [];
          let acc = (() => {
            const notes = vexFlowData.tracks[0].notes || [];
            const minTime = notes.reduce(
              (m, n) => Math.min(m, n.time ?? 0),
              Number.POSITIVE_INFINITY,
            );
            const base = minTime === Number.POSITIVE_INFINITY ? 0 : minTime;
            // Convert beats to 32nd-note ticks (1 beat = 8 ticks)
            return Math.round((base * 8) % measureCapacity);
          })();
          const originalNotes = vexFlowData.tracks[0].notes;
          const graceBuf = [];
          for (const nd of originalNotes) {
            const ticks = durToTicks(nd.duration);
            const isGrace = !!nd.grace;
            if (isGrace) {
              graceBuf.push(nd);
              continue;
            }
            let t = ticks;
            let firstPart = true;
            while (t > 0) {
              const remaining = measureCapacity - acc;
              const slice = Math.min(t, remaining);
              const part = { ...nd, duration: ticksToDur(slice) };
              if (firstPart && graceBuf.length) {
                part.graceNotes = graceBuf.splice(0, graceBuf.length);
              }
              if (!firstPart) part.tieFromPrev = true;
              if (slice < t) part.tieToNext = true;
              cur.push(part);
              acc += slice;
              t -= slice;
              firstPart = false;
              if (acc >= measureCapacity) {
                measures.push(cur);
                cur = [];
                acc = 0;
              }
            }
          }
          if (cur.length) measures.push(cur);

          // Layout params
          const left = 10;
          const right = 10;
          const top = 40;
          const avail = Math.max(
            100,
            (rendererConfig.width || 800) - left - right,
          );
          const mCount = Math.max(1, measures.length);
          // Increase minimum measure width to prevent note cramping
          const mWidth = Math.max(300, Math.floor(avail / mCount));

          // Determine clef based on median pitch (renderer fallback)
          const fallbackKeyToMidi = (k) => {
            const m = /^([a-g])(b|#)?\/(-?\d+)$/.exec(k);
            if (!m) return 60;
            const letters = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
            const letter = letters[m[1]];
            const acc = m[2] === "#" ? 1 : (m[2] === "b" ? -1 : 0);
            const octave = parseInt(m[3], 10);
            return (octave + 1) * 12 + letter + acc;
          };
          const fallbackPitches = [];
          measures.forEach((ms) => {
            ms.forEach((n) => {
              if (n && !n.isRest && Array.isArray(n.keys) && n.keys[0]) {
                fallbackPitches.push(
                  fallbackKeyToMidi(String(n.keys[0]).toLowerCase()),
                );
              }
            });
          });
          const fallbackMedian = fallbackPitches.length
            ? (() => {
              const arr = [...fallbackPitches].sort((a, b) => a - b);
              const mid = arr.length / 2;
              return arr.length % 2
                ? arr[Math.floor(mid)]
                : (arr[mid - 1] + arr[mid]) / 2;
            })()
            : 60;
          const detectedClef = fallbackMedian < 60 ? "bass" : "treble";
          // Fallback renderer: multiline systems
          const measuresPerLine =
            rendererConfig.measuresPerLine && rendererConfig.measuresPerLine > 0
              ? Math.max(1, Math.floor(rendererConfig.measuresPerLine))
              : Math.max(
                1,
                Math.floor(
                  avail /
                    Math.max(
                      120,
                      Math.floor(avail / Math.max(1, measures.length)),
                    ),
                ),
              );
          const lines = [];
          for (let i = 0; i < measures.length; i += measuresPerLine) {
            lines.push(measures.slice(i, i + measuresPerLine));
          }
          const systemGap = 80;

          const allBeams = [];
          const createdNotes = [];

          lines.forEach((lineMeasures, sysIndex) => {
            const y = top + sysIndex * systemGap;

            const stave = new Flow.Stave(left, y, avail);
            const normalizeClef = (c) => {
              const m = (c || "").toString().toLowerCase();
              const map = {
                g: "treble",
                treble: "treble",
                f: "bass",
                bass: "bass",
                c: "alto",
                alto: "alto",
                tenor: "tenor",
                "treble-8vb": "treble-8vb",
                "treble-8va": "treble-8va",
                "bass-8vb": "bass-8vb",
              };
              return map[m] || "treble";
            };
            const clefToUse = normalizeClef(
              vexFlowData.clef ||
                (vexFlowData.tracks &&
                  vexFlowData.tracks[0] &&
                  vexFlowData.tracks[0].clef) ||
                detectedClef,
            );
            stave.addClef(clefToUse);
            if (vexFlowData.timeSignature && sysIndex === 0) {
              stave.addTimeSignature(vexFlowData.timeSignature);
            }
            if (
              vexFlowData.keySignature && vexFlowData.keySignature !== "C" &&
              sysIndex === 0
            ) {
              stave.addKeySignature(vexFlowData.keySignature);
            }
            stave.setContext(context).draw();

            // Title and tempo on first system
            if (sysIndex === 0) {
              try {
                const title = vexFlowData.metadata &&
                  vexFlowData.metadata.title;
                if (title) {
                  context.save();
                  context.setFont("bold 16px Arial");
                  context.fillText(title, left, y - 20);
                  context.restore();
                }
                if (vexFlowData.tempo) {
                  context.save();
                  context.setFont("12px Arial");
                  const tempoText = `♩ = ${vexFlowData.tempo}`;
                  context.fillText(tempoText, left + 200, y - 8);
                  context.restore();
                }
              } catch {
                // Ignore optional rendering errors
              }
            }

            const tickables = [];
            lineMeasures.forEach((mNotes, idxInLine) => {
              const sorted = mNotes.slice().sort((a, b) =>
                (a.time ?? 0) - (b.time ?? 0)
              );
              sorted.forEach((noteData) => {
                if (noteData.isRest) {
                  tickables.push(
                    new Flow.StaveNote({
                      keys: ["d/5"],
                      duration: String(noteData.duration).replace(/r?$/, "r"),
                    }),
                  );
                } else {
                  const note = new Flow.StaveNote({
                    keys: noteData.keys.map((k) => k.toLowerCase()),
                    duration: noteData.duration,
                  });
                  tickables.push(note);
                  createdNotes.push({ vf: note, data: noteData });
                }
              });
              if (
                idxInLine < lineMeasures.length - 1 && Flow.BarNote &&
                Flow.Barline && Flow.Barline.type
              ) {
                tickables.push(new Flow.BarNote(Flow.Barline.type.SINGLE));
              }
            });

            const voice = new Flow.Voice({
              num_beats: Math.max(1, lineMeasures.length) * measureCapacity,
              beat_value: 32,
            });
            if (
              voice.setMode && Flow.Voice && Flow.Voice.Mode &&
              Flow.Voice.Mode.SOFT !== undefined
            ) {
              voice.setMode(Flow.Voice.Mode.SOFT);
            } else if (typeof voice.setStrict === "function") {
              voice.setStrict(false);
            }
            voice.addTickables(
              tickables.filter((t) =>
                typeof t.getTicks === "function"
                  ? t.getTicks().value() > 0
                  : true
              ),
            );

            const formatter = new Flow.Formatter().joinVoices([voice]);
            formatter.format([voice], avail - 20);
            voice.draw(context, stave);
          });

          const allTickables = [];
          // createdNotes already declared earlier
          // allBeams already declared earlier
          measures.forEach((mNotes, idx) => {
            const tickables = mNotes.slice().sort((a, b) =>
              (a.time ?? 0) - (b.time ?? 0)
            ).map((noteData) => {
              if (noteData.isRest) {
                return new Flow.StaveNote({
                  keys: ["d/5"],
                  duration: String(noteData.duration).replace(/r?$/, "r"),
                });
              }
              const note = new Flow.StaveNote({
                keys: noteData.keys.map((k) => k.toLowerCase()),
                duration: noteData.duration,
              });
              // Grace notes (attach if present on this note)
              if (
                noteData.graceNotes && Flow.GraceNoteGroup && Flow.GraceNote
              ) {
                try {
                  const gnotes = noteData.graceNotes.map((g) =>
                    new Flow.GraceNote({
                      keys: (g.keys || []).map((kk) =>
                        String(kk).toLowerCase()
                      ),
                      duration: "16",
                      slash: true,
                    })
                  );
                  const ggroup = new Flow.GraceNoteGroup(gnotes, true);
                  if (typeof ggroup.beamNotes === "function") {
                    ggroup.beamNotes();
                  }
                  if (
                    typeof ggroup.setContext === "function" &&
                    typeof ggroup.attachToNote === "function"
                  ) {
                    ggroup.setContext(context);
                    ggroup.attachToNote(note);
                  }
                } catch {
                // Ignore optional rendering errors
              }
              }

              // Handle JMON ornaments (like grace notes from ornaments array)
              if (Array.isArray(noteData.ornaments) && noteData.ornaments.length && Flow.GraceNoteGroup && Flow.GraceNote) {
                const graceNoteOrnaments = noteData.ornaments.filter(orn => orn.type === 'grace_note');

                if (graceNoteOrnaments.length > 0) {
                  try {
                    const allGraceNotes = graceNoteOrnaments.flatMap(orn => {
                      if (orn.parameters && orn.parameters.gracePitches) {
                        return orn.parameters.gracePitches.map(pitch =>
                          new Flow.GraceNote({
                            keys: [String(pitch).toLowerCase()],
                            duration: "16",
                            slash: orn.parameters.graceNoteType === "acciaccatura",
                          })
                        );
                      }
                      return [];
                    });

                    if (allGraceNotes.length > 0) {
                      const ggroup = new Flow.GraceNoteGroup(allGraceNotes, true);
                      if (typeof ggroup.beamNotes === "function") {
                        ggroup.beamNotes();
                      }
                      if (
                        typeof ggroup.setContext === "function" &&
                        typeof ggroup.attachToNote === "function"
                      ) {
                        ggroup.setContext(context);
                        ggroup.attachToNote(note);
                      }
                    }
                  } catch (e) {
                    console.warn('Failed to render grace note ornaments:', e);
                  }
                }
              }
              // Accidentals display (auto/always)
              if (Flow.Accidental) {
                noteData.keys.forEach((origKey, idx2) => {
                  const k = origKey.toLowerCase();
                  const m = /^([a-g])(#{1,2}|b{1,2})?\/-?\d+$/.exec(k);
                  const letter = m ? m[1] : k[0];
                  const acc = m && m[2] ? (m[2].includes("#") ? "#" : "b") : "";
                  const sig = keyAccMap[letter] || "natural";
                  let glyph = null;
                  if (acc === "#" && sig !== "sharp") {
                    glyph = "#";
                  } else if (acc === "b" && sig !== "flat") {
                    glyph = "b";
                  }
                  if (glyph) {
                    if (typeof note.addAccidental === "function") {
                      note.addAccidental(idx2, new Flow.Accidental(glyph));
                    } else if (typeof note.addModifier === "function") {
                      note.addModifier(new Flow.Accidental(glyph), idx2);
                    }
                  }
                });
              }
              // Articulations glyphs: handle both JMON schema and VexFlow codes
              const articulationMap = {
                staccato: "a.",
                accent: "a>",
                tenuto: "a-",
                marcato: "a^",
                legato: "a-", // similar to tenuto for VexFlow
              };

              // Handle precomputed VexFlow codes first
              if (Array.isArray(noteData.vfArticulations) && noteData.vfArticulations.length) {
                noteData.vfArticulations.forEach((code) => {
                  if (
                    Flow &&
                    Flow.Articulation &&
                    Flow.Modifier &&
                    Flow.Modifier.Position &&
                    (typeof note.addArticulation === "function" ||
                      typeof note.addModifier === "function")
                  ) {
                    const art = new Flow.Articulation(code);
                    if (art && typeof art.setPosition === "function") {
                      art.setPosition(Flow.Modifier.Position.ABOVE);
                    }
                    if (typeof note.addArticulation === "function") {
                      note.addArticulation(0, art);
                    } else if (typeof note.addModifier === "function") {
                      note.addModifier(art, 0);
                    }
                  }
                });
              }

              // Handle JMON schema articulations (from converted notes)
              else if (Array.isArray(noteData.articulations)) {
                noteData.articulations.forEach((a) => {
                  const articulationType = typeof a === "string" ? a : (a && a.type);
                  const code = articulationMap[articulationType] || null;
                  if (!code) return;
                  if (
                    Flow &&
                    Flow.Articulation &&
                    Flow.Modifier &&
                    Flow.Modifier.Position &&
                    (typeof note.addArticulation === "function" ||
                      typeof note.addModifier === "function")
                  ) {
                    const art = new Flow.Articulation(code);
                    if (art && typeof art.setPosition === "function") {
                      art.setPosition(Flow.Modifier.Position.ABOVE);
                    }
                    if (typeof note.addArticulation === "function") {
                      note.addArticulation(0, art);
                    } else if (typeof note.addModifier === "function") {
                      note.addModifier(art, 0);
                    }
                  }
                });
              }
              return note;
            });

            // Pass through dots and collect notes for ties
            tickables.forEach((n, i) => {
              const d = mNotes[i];
              if (!d || d.isRest) return;
              const dotCount = (typeof d.dots === "number")
                ? d.dots
                : (d.dots === true || d.dot === true || d.dotted === true
                  ? 1
                  : 0);
              for (let k = 0; k < dotCount; k++) {
                if (typeof n.addDotToAll === "function") {
                  n.addDotToAll();
                } else if (Flow.Dot) {
                  d.keys.forEach((_, idx) => {
                    if (typeof n.addModifier === "function") {
                      n.addModifier(new Flow.Dot(), idx);
                    }
                  });
                }
              }
              createdNotes.push({ vf: n, data: d });
            });
            allTickables.push(...tickables);

            if (Flow.Beam && typeof Flow.Beam.generateBeams === "function") {
              const beamables = tickables.filter(
                (t) => typeof t.isRest !== "function" || !t.isRest(),
              );
              try {
                const beams = Flow.Beam.generateBeams(beamables);
                beams.forEach((b) => b.setContext(context));
                allBeams.push(...beams);
              } catch (_) {
                // ignore beaming errors
              }
            }

            if (
              idx < measures.length - 1 &&
              Flow.BarNote &&
              Flow.Barline &&
              Flow.Barline.type
            ) {
              allTickables.push(new Flow.BarNote(Flow.Barline.type.SINGLE));
            }
          });

          const totalTicks = measures.length * measureCapacity;
          const voice = new Flow.Voice({
            num_beats: totalTicks,
            beat_value: 32,
          });
          if (
            voice.setMode && Flow.Voice && Flow.Voice.Mode &&
            Flow.Voice.Mode.SOFT !== undefined
          ) {
            voice.setMode(Flow.Voice.Mode.SOFT);
          } else if (typeof voice.setStrict === "function") {
            voice.setStrict(false);
          }
          voice.addTickables(
            allTickables.filter((t) =>
              typeof t.getTicks === "function" ? t.getTicks().value() > 0 : true
            ),
          );

          // Note: Voice drawing is handled per system in the lines.forEach loop above
          // Removing duplicate voice.draw call that uses undefined 'stave' variable

          if (allBeams.length) {
            allBeams.forEach((b) => {
              try {
                b.draw();
              } catch (_) {
                // Ignore optional errors
              }
            });
          }

          // Rendering complete - styling handled by main score function

          // Draw simple ties when requested (tie to next note)
          if (createdNotes.length && Flow.StaveTie) {
            for (let i = 0; i < createdNotes.length - 1; i++) {
              const cur = createdNotes[i];
              if (!cur) continue;
              const d = cur.data || {};
              const isTieStart =
                !!(d.tieToNext || d.tieStart || d.tie === "start");
              if (!isTieStart) continue;
              let next = null;
              for (let j = i + 1; j < createdNotes.length; j++) {
                if (createdNotes[j]) {
                  next = createdNotes[j];
                  break;
                }
              }
              if (next) {
                try {
                  new Flow.StaveTie({
                    first_note: cur.vf,
                    last_note: next.vf,
                    first_indices: [0],
                    last_indices: [0],
                  }).setContext(context).draw();
                } catch (_) {
                  // ignore tie errors
                }
              }
            }
          }
        }
      },
    };
  }
}

/**
 * Main conversion function for VexFlow
 */
function convertToVexFlow(composition, options = {}) {
  const converter = new VexFlowConverter();
  const vexFlowData = converter.convertToVexFlow(composition);

  if (options.elementId) {
    const rendererConfig = converter.createRenderer(
      options.elementId,
      options.width,
      options.height,
    );
    return converter.generateRenderingInstructions(vexFlowData, rendererConfig);
  }

  return vexFlowData;
}

export { convertToVexFlow, VexFlowConverter };
