/**
 * ABC Notation Converter
 * Convert JMON to ABC notation format
 */

/**
 * Convert MIDI pitch number to ABC note name
 *
 * @param {number} midi - MIDI pitch number (60 = middle C)
 * @returns {string} ABC note name
 */
function midiToABC(midi) {
  if (typeof midi !== 'number') return 'C';

  const noteNames = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];

  if (octave === 4) {
    return noteName;
  } else if (octave === 5) {
    return noteName.toLowerCase();
  } else if (octave > 5) {
    const ticks = "'".repeat(octave - 5);
    return noteName.toLowerCase() + ticks;
  } else if (octave === 3) {
    return noteName;
  } else {
    const commas = ','.repeat(4 - octave);
    return noteName + commas;
  }
}

/**
 * Convert JMON duration to ABC duration
 *
 * @param {number} duration - Duration in quarter notes
 * @returns {string} ABC duration suffix
 */
function durationToABC(duration) {
  if (duration >= 4) return '4';
  if (duration >= 3) return '3';
  if (duration >= 2) return '2';
  if (duration >= 1.5) return '3/2';
  if (duration >= 1) return '';
  if (duration >= 0.75) return '3/4';
  if (duration >= 0.5) return '/2';
  if (duration >= 0.25) return '/4';
  return '/8';
}

/**
 * Convert JMON composition to ABC notation
 *
 * @param {Object} composition - The JMON composition
 * @returns {string} ABC notation string
 *
 * @example
 * const abcText = jm.converters.abc(composition);
 */
export function abc(composition) {
  const lines = [];

  lines.push('X:1');

  const title = composition.title || composition.metadata?.title || 'Untitled';
  lines.push(`T:${title}`);

  const tempo = composition.tempo || 120;
  lines.push(`Q:1/4=${tempo}`);

  const timeSignature = composition.timeSignature || '4/4';
  lines.push(`M:${timeSignature}`);

  lines.push('L:1/4');

  const track = composition.tracks?.[0];
  const keySignature = composition.keySignature || 'C';
  const clef = track?.clef || 'treble';

  const clefMap = {
    'treble': 'treble',
    'bass': 'bass',
    'alto': 'alto',
    'tenor': 'tenor',
    'percussion': 'perc'
  };
  const abcClef = clefMap[clef] || 'treble';

  lines.push(`K:${keySignature} clef=${abcClef}`);

  if (!track?.notes?.length) {
    lines.push('z4');
    return lines.join('\n');
  }

  const [beatsPerMeasure, beatValue] = timeSignature.split('/').map(Number);
  const measureDuration = beatsPerMeasure * (4 / beatValue);

  const abcNotes = [];
  let currentMeasureDuration = 0;

  track.notes.forEach((note, index) => {
    const duration = note.duration || 1;
    const abcDuration = durationToABC(duration);

    // Handle chords (array of pitches) vs single notes
    let abcNote;
    if (Array.isArray(note.pitch)) {
      // Chord: convert each pitch and wrap in brackets
      const chordNotes = note.pitch
        .filter(p => typeof p === 'number') // Filter out nulls/invalid pitches
        .map(p => midiToABC(p));

      if (chordNotes.length > 1) {
        // Multiple notes = chord notation [CEG]
        abcNote = `[${chordNotes.join('')}]`;
      } else if (chordNotes.length === 1) {
        // Single note in array
        abcNote = chordNotes[0];
      } else {
        // Empty array or all nulls = rest
        abcNote = 'z';
      }
    } else if (note.pitch === null || note.pitch === undefined) {
      // Rest
      abcNote = 'z';
    } else {
      // Single note
      abcNote = midiToABC(note.pitch);
    }

    abcNotes.push(`${abcNote}${abcDuration}`);

    currentMeasureDuration += duration;

    if (currentMeasureDuration >= measureDuration) {
      if (index < track.notes.length - 1) {
        abcNotes.push('|');
      }
      currentMeasureDuration = 0;
    }
  });

  lines.push(abcNotes.join(' '));

  return lines.join('\n');
}

/**
 * Download an ABC notation file from a JMON composition
 *
 * @param {Object} composition - The JMON composition
 * @param {string} filename - Output filename (default: "composition.abc")
 * @returns {void}
 *
 * @example
 * jm.converters.downloadABC(composition, "my-song.abc");
 */
export function downloadABC(composition, filename = "composition.abc") {
  const abcText = abc(composition);

  const blob = new Blob([abcText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
