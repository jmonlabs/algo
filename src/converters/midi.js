/* jmon-to-midi.js - Convert JMON format to Standard MIDI File (no external deps) */
import { compileEvents } from "../algorithms/audio/index.js";

// --- Built-in MIDI binary encoder ---

function writeVarLen(value) {
    const bytes = [];
    bytes.push(value & 0x7f);
    value >>= 7;
    while (value > 0) {
        bytes.push((value & 0x7f) | 0x80);
        value >>= 7;
    }
    return bytes.reverse();
}

function writeUint16(value) {
    return [(value >> 8) & 0xff, value & 0xff];
}

function writeUint32(value) {
    return [(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function writeString(str) {
    return Array.from(str, c => c.charCodeAt(0));
}

function encodeTrack(events) {
    const data = [];
    let lastTick = 0;

    // Sort events by tick, then by type (note-off before note-on at same tick)
    events.sort((a, b) => a.tick - b.tick || a.sortOrder - b.sortOrder);

    for (const evt of events) {
        const delta = evt.tick - lastTick;
        data.push(...writeVarLen(delta));
        data.push(...evt.bytes);
        lastTick = evt.tick;
    }

    // End of track
    data.push(0x00, 0xff, 0x2f, 0x00);
    return data;
}

function buildMidiFile(composition) {
    const bpm = composition.tempo || composition.bpm || 120;
    const ticksPerBeat = 480;
    const rawTracks = composition.tracks || [];
    const tracksArray = Array.isArray(rawTracks)
        ? rawTracks
        : (rawTracks && typeof rawTracks === 'object' ? Object.values(rawTracks) : []);

    const trackChunks = [];

    // Track 0: tempo track
    const tempoEvents = [];
    const microsecondsPerBeat = Math.round(60000000 / bpm);
    tempoEvents.push({
        tick: 0,
        sortOrder: -1,
        bytes: [0xff, 0x51, 0x03,
            (microsecondsPerBeat >> 16) & 0xff,
            (microsecondsPerBeat >> 8) & 0xff,
            microsecondsPerBeat & 0xff]
    });

    // Title
    const title = composition.title || composition.metadata?.title || '';
    if (title) {
        const titleBytes = writeString(title);
        tempoEvents.push({
            tick: 0,
            sortOrder: -2,
            bytes: [0xff, 0x03, ...writeVarLen(titleBytes.length), ...titleBytes]
        });
    }

    trackChunks.push(encodeTrack(tempoEvents));

    // Note tracks
    for (const track of tracksArray) {
        const notesSrc = Array.isArray(track.events) ? track.events
            : (Array.isArray(track.notes) ? track.notes
                : (Array.isArray(track) ? track : []));
        const safeNotes = Array.isArray(notesSrc) ? notesSrc : [];

        const events = [];
        const label = track.label || track.name || '';
        if (label) {
            const labelBytes = writeString(label);
            events.push({
                tick: 0,
                sortOrder: -2,
                bytes: [0xff, 0x03, ...writeVarLen(labelBytes.length), ...labelBytes]
            });
        }

        // Add time to notes if missing
        let currentTime = 0;
        const notesWithTime = safeNotes.map(note => {
            const t = note.time !== undefined ? note.time : currentTime;
            currentTime = t + (note.duration || 1);
            return { ...note, time: t };
        });

        for (const note of notesWithTime) {
            const pitch = typeof note.pitch === 'number' ? note.pitch : 60;
            if (pitch === null || pitch === undefined) continue; // rest
            const velocity = Math.round((note.velocity || 0.8) * 127);
            const startTick = Math.round((note.time || 0) * ticksPerBeat);
            const endTick = Math.round(((note.time || 0) + (note.duration || 1)) * ticksPerBeat);
            const channel = 0;

            events.push({
                tick: startTick,
                sortOrder: 1,
                bytes: [0x90 | channel, pitch, velocity]
            });
            events.push({
                tick: endTick,
                sortOrder: 0, // note-off sorts before note-on at same tick
                bytes: [0x80 | channel, pitch, 0]
            });
        }

        trackChunks.push(encodeTrack(events));
    }

    // Assemble file
    const numTracks = trackChunks.length;
    const fileBytes = [];

    // Header: MThd
    fileBytes.push(...writeString('MThd'));
    fileBytes.push(...writeUint32(6)); // header length
    fileBytes.push(...writeUint16(1)); // format 1 (multi-track)
    fileBytes.push(...writeUint16(numTracks));
    fileBytes.push(...writeUint16(ticksPerBeat));

    // Track chunks
    for (const trackData of trackChunks) {
        fileBytes.push(...writeString('MTrk'));
        fileBytes.push(...writeUint32(trackData.length));
        fileBytes.push(...trackData);
    }

    return new Uint8Array(fileBytes);
}

// --- Public API ---

export class Midi {
    static midiToNoteName(midi) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const noteIndex = midi % 12;
        return noteNames[noteIndex] + octave;
    }
    static convert(composition) {
        const bpm = composition.tempo || composition.bpm || 120;
        const timeSignature = composition.timeSignature || '4/4';
        const rawTracks = composition.tracks || [];
        const tracksArray = Array.isArray(rawTracks)
            ? rawTracks
            : (rawTracks && typeof rawTracks === 'object' ? Object.values(rawTracks) : []);

        return {
            header: { bpm, timeSignature },
            tracks: tracksArray.map(track => {
                const label = track.label || track.name;
                const notesSrc = Array.isArray(track.events) ? track.events
                                : (Array.isArray(track.notes) ? track.notes
                                : (Array.isArray(track) ? track : []));
                const safeNotes = Array.isArray(notesSrc) ? notesSrc : [];
                const perf = compileEvents({ events: safeNotes }, { tempo: bpm, timeSignature });

                const notes = safeNotes.map(note => ({
                    pitch: note.pitch,
                    noteName: (typeof note.pitch === 'number') ? Midi.midiToNoteName(note.pitch) : note.pitch,
                    time: note.time,
                    duration: note.duration,
                    velocity: note.velocity || 0.8
                }));

                return {
                    label,
                    notes,
                    modulations: (perf && Array.isArray(perf.modulations)) ? perf.modulations : []
                };
            })
        };
    }
}

/**
 * Convert a JMON composition to a MIDI file download link.
 * No external dependencies required.
 *
 * @param {Object} composition - The JMON composition
 * @param {Object} [options] - Options
 * @param {string} [options.filename='composition.mid'] - Output filename
 * @returns {HTMLAnchorElement} A download link element for the MIDI file
 *
 * @example
 * display(jm.converters.midi(composition));
 * display(jm.converters.midi(composition, { filename: "my-song.mid" }));
 */
export function midi(composition, options = {}) {
    const { filename = 'composition.mid' } = options;
    const bytes = buildMidiFile(composition);
    const blob = new Blob([bytes], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.textContent = `Download ${filename}`;
    return a;
}
