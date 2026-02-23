/**
 * Articulation System for JMON
 * Handles articulation application with immutable transformations
 */

import { ARTICULATION_TYPES } from "../../constants/ArticulationTypes.js";

export class Articulation {
  /**
   * Apply articulation to notes array (returns new array, immutable)
   * This API matches the Ornament pattern for consistency
   *
   * Overloaded signatures:
   * - apply(notes[], noteIndex, articulationType, params) - array API (immutable)
   * - apply(note, articulationType) - single note API (mutates in place, returns {success})
   *
   * @param {Array|Object} notes - The notes array or single note object
   * @param {number|Array|string} noteIndex - Index of note to articulate, array of indices, or articulation type
   * @param {string} articulationType - Type of articulation (when using array API)
   * @param {Object} params - Parameters for complex articulations
   * @returns {Array|Object} New notes array with articulation applied, or {success: boolean}
   */
  static apply(notes, noteIndex, articulationType, params = {}) {
    // Detect single-note API: apply(note, articulationType)
    if (!Array.isArray(notes) && typeof notes === 'object' && typeof noteIndex === 'string') {
      return this._applySingleNote(notes, noteIndex);
    }
    if (!Array.isArray(notes) || notes.length === 0) {
      return notes;
    }

    // Handle array of indices
    if (Array.isArray(noteIndex)) {
      let result = notes;
      // Sort indices in descending order to handle insertions correctly
      // (when staccato inserts rests, later indices shift)
      const sortedIndices = [...noteIndex].sort((a, b) => b - a);

      for (const idx of sortedIndices) {
        result = this.apply(result, idx, articulationType, params);
      }
      return result;
    }

    // Handle single index
    if (noteIndex < 0 || noteIndex >= notes.length) {
      console.warn(`Note index ${noteIndex} out of bounds`);
      return notes;
    }

    const articulationDef = ARTICULATION_TYPES[articulationType];
    if (!articulationDef) {
      console.warn(`Unknown articulation type: ${articulationType}`);
      return notes;
    }

    const note = notes[noteIndex];
    if (!note || typeof note !== "object") {
      console.warn(`Invalid note at index ${noteIndex}`);
      return notes;
    }

    // Create new notes array
    const newNotes = notes.slice();

    // Handle articulation based on type
    switch (articulationType) {
      case 'staccato':
        return this._applyStaccato(newNotes, noteIndex);

      case 'staccatissimo':
        return this._applyStaccatissimo(newNotes, noteIndex);

      case 'accent':
      case 'marcato':
        return this._applyAccent(newNotes, noteIndex, articulationType);

      case 'tenuto':
        return this._applyTenuto(newNotes, noteIndex);

      case 'legato':
        return this._applyLegato(newNotes, noteIndex);

      case 'glissando':
      case 'portamento':
      case 'bend':
      case 'vibrato':
      case 'tremolo':
      case 'crescendo':
      case 'diminuendo':
        return this._applyComplexArticulation(newNotes, noteIndex, articulationType, params);

      default:
        return notes;
    }
  }

  /**
   * Apply articulation to a single note (mutates in place)
   * Legacy API for backward compatibility
   * @param {Object} note - The note object to modify
   * @param {string} articulationType - Type of articulation
   * @returns {{success: boolean}} Result object
   */
  static _applySingleNote(note, articulationType) {
    if (!note || typeof note !== 'object') {
      return { success: false };
    }

    const articulationDef = ARTICULATION_TYPES[articulationType];
    if (!articulationDef) {
      console.warn(`Unknown articulation type: ${articulationType}`);
      return { success: false };
    }

    // Apply articulation directly to the note object
    switch (articulationType) {
      case 'staccato':
        note.duration = note.duration * 0.5;
        break;

      case 'staccatissimo':
        note.duration = note.duration * 0.25;
        break;

      case 'accent':
      case 'marcato': {
        const multiplier = articulationType === 'marcato' ? 1.3 : 1.2;
        const velocity = note.velocity !== undefined ? note.velocity : 0.8;
        note.velocity = Math.min(1.0, velocity * multiplier);
        break;
      }

      case 'tenuto':
        // Mark for full duration (no duration change)
        break;

      case 'legato':
        note.duration = note.duration * 1.05;
        break;

      default:
        return { success: false };
    }

    // Add articulation to articulations array
    if (!Array.isArray(note.articulations)) {
      note.articulations = [];
    }
    note.articulations.push(articulationType);

    return { success: true };
  }

  /**
   * Apply staccato - shorten duration and insert rest
   */
  static _applyStaccato(notes, noteIndex) {
    const note = notes[noteIndex];
    const originalDuration = note.duration;
    const shortenedDuration = originalDuration * 0.5;
    const restDuration = originalDuration - shortenedDuration;

    // Create shortened note with articulation
    const shortenedNote = {
      ...note,
      duration: shortenedDuration,
      articulations: [...(Array.isArray(note.articulations) ? note.articulations : []), 'staccato']
    };

    // Create rest to fill the gap
    const rest = {
      pitch: null,
      duration: restDuration,
      time: note.time + shortenedDuration
    };

    // Insert shortened note and rest
    notes[noteIndex] = shortenedNote;
    notes.splice(noteIndex + 1, 0, rest);

    return notes;
  }

  /**
   * Apply staccatissimo - very short duration with rest
   */
  static _applyStaccatissimo(notes, noteIndex) {
    const note = notes[noteIndex];
    const originalDuration = note.duration;
    const shortenedDuration = originalDuration * 0.25;
    const restDuration = originalDuration - shortenedDuration;

    const shortenedNote = {
      ...note,
      duration: shortenedDuration,
      articulations: [...(Array.isArray(note.articulations) ? note.articulations : []), 'staccatissimo']
    };

    const rest = {
      pitch: null,
      duration: restDuration,
      time: note.time + shortenedDuration
    };

    notes[noteIndex] = shortenedNote;
    notes.splice(noteIndex + 1, 0, rest);

    return notes;
  }

  /**
   * Apply accent or marcato - increase velocity
   */
  static _applyAccent(notes, noteIndex, type) {
    const note = notes[noteIndex];
    const multiplier = type === 'marcato' ? 1.3 : 1.2;
    const velocity = note.velocity !== undefined ? note.velocity : 0.8;

    notes[noteIndex] = {
      ...note,
      velocity: Math.min(1.0, velocity * multiplier),
      articulations: [...(Array.isArray(note.articulations) ? note.articulations : []), type]
    };

    return notes;
  }

  /**
   * Apply tenuto - mark for full duration
   */
  static _applyTenuto(notes, noteIndex) {
    const note = notes[noteIndex];

    notes[noteIndex] = {
      ...note,
      articulations: [...(Array.isArray(note.articulations) ? note.articulations : []), 'tenuto']
    };

    return notes;
  }

  /**
   * Apply legato - extend duration slightly
   */
  static _applyLegato(notes, noteIndex) {
    const note = notes[noteIndex];

    notes[noteIndex] = {
      ...note,
      duration: note.duration * 1.05,
      articulations: [...(Array.isArray(note.articulations) ? note.articulations : []), 'legato']
    };

    return notes;
  }

  /**
   * Apply complex articulation with parameters
   */
  static _applyComplexArticulation(notes, noteIndex, type, params) {
    const note = notes[noteIndex];

    notes[noteIndex] = {
      ...note,
      articulations: [
        ...(Array.isArray(note.articulations) ? note.articulations : []),
        { type, ...params }
      ]
    };

    return notes;
  }

  /**
   * Validate articulation consistency in a sequence
   */
  static validateSequence(sequence) {
    const issues = [];

    sequence.forEach((note, index) => {
      const arr = Array.isArray(note.articulations) ? note.articulations : [];
      for (const a of arr) {
        const type = typeof a === "string" ? a : a?.type;
        const articulationDef = ARTICULATION_TYPES[type];

        if (!type || !articulationDef) {
          issues.push({
            type: "unknown_articulation",
            noteIndex: index,
            articulation: type,
            message: `Unknown articulation type: ${type}`,
          });
          continue;
        }

        if (Array.isArray(articulationDef.requiredParams)) {
          for (const param of articulationDef.requiredParams) {
            if (typeof a !== "object" || !(param in a)) {
              issues.push({
                type: "missing_parameter",
                noteIndex: index,
                articulation: type,
                message: `Missing required parameter '${param}' for ${type}`,
              });
            }
          }
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get available articulation types with descriptions
   */
  static getAvailableTypes() {
    return Object.entries(ARTICULATION_TYPES).map(([type, def]) => ({
      type,
      complex: def.complex,
      description: def.description,
      requiredParams: def.requiredParams || [],
      optionalParams: def.optionalParams || [],
    }));
  }
}
