/**
 * Convenience API for accessing musical constants
 * Provides helpful methods to explore and query available constants
 */

import { ARTICULATION_TYPES } from './ArticulationTypes.js';
import { ORNAMENT_TYPES } from './OrnamentTypes.js';
import { MusicTheoryConstants } from './MusicTheoryConstants.js';

export class ConstantsAPI {
  /**
   * List all available constant categories
   * @returns {string[]} Array of category names
   *
   * @example
   * jm.constants.list()
   * // => ['articulations', 'ornaments', 'scales', 'intervals', ...]
   */
  static list() {
    return [
      'articulations',
      'ornaments',
      'scales',
      'intervals',
      'chromaticScale',
      'modes'
    ];
  }

  /**
   * Get all constants of a specific category
   * @param {string} category - Category name
   * @returns {Object|Array} Constants for that category
   *
   * @example
   * jm.constants.get('articulations')
   * // => { staccato: {...}, accent: {...}, ... }
   *
   * @example
   * jm.constants.get('scales')
   * // => { major: [...], minor: [...], ... }
   */
  static get(category) {
    switch (category) {
      case 'articulations':
        return ARTICULATION_TYPES;
      case 'ornaments':
        return ORNAMENT_TYPES;
      case 'scales':
        return MusicTheoryConstants.scaleIntervals;
      case 'intervals':
        return MusicTheoryConstants.intervals;
      case 'chromaticScale':
        return MusicTheoryConstants.chromaticScale;
      case 'modes':
        return {
          ionian: MusicTheoryConstants.scaleIntervals.major,
          dorian: MusicTheoryConstants.scaleIntervals.dorian,
          phrygian: MusicTheoryConstants.scaleIntervals.phrygian,
          lydian: MusicTheoryConstants.scaleIntervals.lydian,
          mixolydian: MusicTheoryConstants.scaleIntervals.mixolydian,
          aeolian: MusicTheoryConstants.scaleIntervals.minor,
          locrian: MusicTheoryConstants.scaleIntervals.locrian
        };
      default:
        throw new Error(`Unknown constant category: ${category}. Available: ${this.list().join(', ')}`);
    }
  }

  /**
   * Describe a specific constant with details
   * @param {string} category - Category name
   * @param {string} name - Constant name within category
   * @returns {Object} Description object
   *
   * @example
   * jm.constants.describe('articulations', 'staccato')
   * // => { name: 'staccato', complex: false, description: '...', ... }
   */
  static describe(category, name) {
    const constants = this.get(category);

    if (category === 'articulations' || category === 'ornaments') {
      const item = constants[name];
      if (!item) {
        throw new Error(`Unknown ${category} type: ${name}. Available: ${Object.keys(constants).join(', ')}`);
      }
      return {
        name,
        category,
        ...item
      };
    }

    if (category === 'scales' || category === 'modes') {
      const intervals = constants[name];
      if (!intervals) {
        throw new Error(`Unknown ${category} name: ${name}. Available: ${Object.keys(constants).join(', ')}`);
      }
      return {
        name,
        category,
        intervals,
        noteCount: intervals.length
      };
    }

    if (category === 'intervals') {
      const semitones = constants[name];
      if (semitones === undefined) {
        throw new Error(`Unknown interval: ${name}. Available: ${Object.keys(constants).join(', ')}`);
      }
      return {
        name,
        category,
        semitones
      };
    }

    if (category === 'chromaticScale') {
      const index = parseInt(name);
      if (isNaN(index) || index < 0 || index >= constants.length) {
        throw new Error(`Invalid chromatic scale index: ${name}. Must be 0-${constants.length - 1}`);
      }
      return {
        index,
        note: constants[index],
        category
      };
    }

    throw new Error(`Cannot describe category: ${category}`);
  }

  /**
   * Search constants by description or properties
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {string[]} [options.categories] - Limit search to specific categories
   * @returns {Array} Array of matching results
   *
   * @example
   * jm.constants.search('slide')
   * // => [{ category: 'articulations', name: 'glissando', ... }, ...]
   */
  static search(query, options = {}) {
    const { categories = ['articulations', 'ornaments'] } = options;
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const category of categories) {
      try {
        const constants = this.get(category);

        if (category === 'articulations' || category === 'ornaments') {
          for (const [name, def] of Object.entries(constants)) {
            const searchText = `${name} ${def.description || ''}`.toLowerCase();
            if (searchText.includes(lowerQuery)) {
              results.push({
                category,
                name,
                ...def
              });
            }
          }
        }
      } catch (e) {
        // Skip invalid categories
      }
    }

    return results;
  }

  /**
   * Get all articulation type names
   * @returns {string[]} Array of articulation type names
   *
   * @example
   * jm.constants.listArticulations()
   * // => ['staccato', 'accent', 'tenuto', ...]
   */
  static listArticulations() {
    return Object.keys(ARTICULATION_TYPES);
  }

  /**
   * Get all ornament type names
   * @returns {string[]} Array of ornament type names
   *
   * @example
   * jm.constants.listOrnaments()
   * // => ['grace_note', 'trill', 'mordent', ...]
   */
  static listOrnaments() {
    return Object.keys(ORNAMENT_TYPES);
  }

  /**
   * Get all scale type names
   * @returns {string[]} Array of scale type names
   *
   * @example
   * jm.constants.listScales()
   * // => ['major', 'minor', 'pentatonic', ...]
   */
  static listScales() {
    return Object.keys(MusicTheoryConstants.scaleIntervals);
  }

  /**
   * Get all interval names
   * @returns {string[]} Array of interval names
   *
   * @example
   * jm.constants.listIntervals()
   * // => ['P1', 'm2', 'M2', ...]
   */
  static listIntervals() {
    return Object.keys(MusicTheoryConstants.intervals);
  }
}
