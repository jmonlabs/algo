/**
 * Tests for MIDI to JMON converter
 */

import { MidiToJmon, midiToJmon } from "../midi-to-jmon.js";

// Mock Tone.js for testing
const mockTone = {
  Midi: class MockMidi {
    constructor(data) {
      // Mock a simple MIDI file structure
      this.header = {
        tempos: [{ time: 0, bpm: 120 }],
        timeSignatures: [{ time: 0, numerator: 4, denominator: 4 }],
      };

      this.tracks = [
        {
          channel: 0,
          name: "Piano",
          instrument: { name: "Acoustic Grand Piano", number: 0 },
          notes: [
            {
              midi: 60, // Middle C
              time: 0,
              duration: 0.5,
              velocity: 0.8,
            },
            {
              midi: 64, // E
              time: 0.5,
              duration: 0.5,
              velocity: 0.7,
            },
            {
              midi: 67, // G
              time: 1.0,
              duration: 1.0,
              velocity: 0.9,
            },
          ],
          controlChanges: {
            1: [ // Modulation wheel
              { time: 0.5, value: 64 },
            ],
          },
        },
        {
          channel: 9, // Drum channel
          name: "Drums",
          instrument: { name: "Standard Drum Kit", number: 128 },
          notes: [
            {
              midi: 36, // Bass drum
              time: 0,
              duration: 0.1,
              velocity: 1.0,
            },
            {
              midi: 38, // Snare
              time: 0.5,
              duration: 0.1,
              velocity: 0.8,
            },
          ],
        },
      ];
    }
  },
};

describe("MidiToJmon", () => {
  let converter;
  const mockMidiData = new Uint8Array([0x4D, 0x54, 0x68, 0x64]); // "MThd" header

  beforeEach(() => {
    converter = new MidiToJmon({ Tone: mockTone });
  });

  describe("constructor", () => {
    test("should create converter with default options", () => {
      const conv = new MidiToJmon();
      expect(conv.options.trackNaming).toBe("auto");
      expect(conv.options.mergeDrums).toBe(true);
      expect(conv.options.includeModulations).toBe(true);
    });

    test("should accept custom options", () => {
      const conv = new MidiToJmon({
        trackNaming: "numbered",
        mergeDrums: false,
        quantize: 0.25,
      });
      expect(conv.options.trackNaming).toBe("numbered");
      expect(conv.options.mergeDrums).toBe(false);
      expect(conv.options.quantize).toBe(0.25);
    });
  });

  describe("initializeTone", () => {
    test("should return provided Tone instance", async () => {
      const tone = await converter.initializeTone();
      expect(tone).toBe(mockTone);
    });

    test("should throw error if no Tone instance available in Node.js", async () => {
      const conv = new MidiToJmon({ Tone: null });
      await expect(conv.initializeTone()).rejects.toThrow(
        "Tone instance required in Node.js environment",
      );
    });
  });

  describe("convertToJmon", () => {
    test("should convert MIDI to valid JMON structure", async () => {
      const result = await converter.convertToJmon(mockMidiData);

      expect(result).toHaveProperty("format", "jmon");
      expect(result).toHaveProperty("version", "1.0");
      expect(result).toHaveProperty("tempo", 120);
      expect(result).toHaveProperty("tracks");
      expect(Array.isArray(result.tracks)).toBe(true);
    });

    test("should handle conversion errors gracefully", () => {
      const badConverter = new MidiToJmon({
        Tone: {
          Midi: class {
            constructor() {
              throw new Error("Parse error");
            }
          },
        },
      });

      expect(() => badConverter.convertToJmon(mockMidiData))
        .toThrow("Failed to parse MIDI file: Parse error");
    });
  });

  describe("convertTracks", () => {
    test("should convert MIDI tracks to JMON tracks", () => {
      const mockParsed = new mockTone.Midi();
      const result = converter.convertTracks(
        mockParsed.tracks,
        mockTone,
        mockParsed,
      );

      expect(result).toHaveLength(2); // Piano + Drums
      expect(result[0]).toHaveProperty("label", "Piano");
      expect(result[1]).toHaveProperty("label", "Drums");

      // Check notes structure
      expect(result[0].notes).toHaveLength(3);
      expect(result[0].notes[0]).toHaveProperty("pitch", 60);
      expect(result[0].notes[0]).toHaveProperty("velocity", 0.8);
    });

    test("should skip empty tracks", () => {
      const emptyTracks = [
        { notes: [] },
        { notes: [{ midi: 60, time: 0, duration: 0.5, velocity: 0.8 }] },
      ];

      const result = converter.convertTracks(emptyTracks, mockTone, {});
      expect(result).toHaveLength(1);
    });
  });

  describe("generateTrackName", () => {
    const mockTrack = {
      name: "My Track",
      channel: 0,
      instrument: { name: "Piano" },
    };

    test("should use track name when available", () => {
      const name = converter.generateTrackName(mockTrack, 0, {});
      expect(name).toBe("My Track");
    });

    test("should use numbering strategy", () => {
      converter.options.trackNaming = "numbered";
      const name = converter.generateTrackName({}, 2, {});
      expect(name).toBe("Track 3");
    });

    test("should detect drum tracks", () => {
      const drumTrack = { channel: 9 };
      const name = converter.generateTrackName(drumTrack, 0, {});
      expect(name).toBe("Drums");
    });
  });

  describe("isDrumTrack", () => {
    test("should identify drum tracks correctly", () => {
      expect(converter.isDrumTrack({ channel: 9 })).toBe(true);
      expect(converter.isDrumTrack({ channel: 0 })).toBe(false);
      expect(converter.isDrumTrack({})).toBe(false);
    });
  });

  describe("time conversion", () => {
    test("should convert seconds to quarter notes", () => {
      const quarters = converter.convertSecondsToQuarterNotes(2.0, 120);
      expect(quarters).toBe(4); // 2 seconds at 120 BPM = 4 quarter notes
    });

    test("should convert duration to note values", () => {
      expect(converter.convertDurationToNoteValue(0.5)).toBe("4n"); // Quarter note at 120 BPM
      expect(converter.convertDurationToNoteValue(0.25)).toBe("8n"); // Eighth note
      expect(converter.convertDurationToNoteValue(2.0)).toBe("1n"); // Whole note
    });
  });

  describe("metadata extraction", () => {
    test("should extract tempo", () => {
      const mockParsed = {
        header: { tempos: [{ bpm: 140 }] },
        tracks: [],
      };

      expect(converter.extractTempo(mockParsed)).toBe(140);
    });

    test("should extract time signature", () => {
      const mockParsed = {
        header: { timeSignatures: [{ numerator: 3, denominator: 4 }] },
        tracks: [],
      };

      expect(converter.extractTimeSignature(mockParsed)).toBe("3/4");
    });

    test("should use defaults when no metadata available", () => {
      const mockParsed = { header: {}, tracks: [] };

      expect(converter.extractTempo(mockParsed)).toBe(120);
      expect(converter.extractTimeSignature(mockParsed)).toBeNull();
    });
  });

  describe("quantization", () => {
    test("should quantize notes to grid", () => {
      const notes = [
        { time: 0.1, pitch: 60 },
        { time: 0.6, pitch: 64 },
        { time: 1.3, pitch: 67 },
      ];

      const quantized = converter.quantizeNotes(notes, 0.5);

      expect(quantized[0].time).toBe(0); // 0.1 -> 0
      expect(quantized[1].time).toBe(0.5); // 0.6 -> 0.5
      expect(quantized[2].time).toBe(1.5); // 1.3 -> 1.5
    });
  });

  describe("modulations", () => {
    test("should extract MIDI control changes", () => {
      const controlChanges = {
        1: [{ time: 0.5, value: 64 }], // Modulation wheel
        7: [{ time: 1.0, value: 100 }], // Volume
      };

      const modulations = converter.extractModulations(controlChanges);

      expect(modulations).toHaveLength(2);
      expect(modulations[0]).toMatchObject({
        type: "cc",
        controller: 1,
        value: 64,
      });
    });
  });
});

describe("midiToJmon function", () => {
  test("should be a wrapper for MidiToJmon.convert", async () => {
    const mockMidiData = new Uint8Array([0x4D, 0x54, 0x68, 0x64]);
    const options = { Tone: mockTone };

    const result = await midiToJmon(mockMidiData, options);

    expect(result).toHaveProperty("format", "jmon");
    expect(result).toHaveProperty("tracks");
  });
});

describe("integration", () => {
  test("should produce JMON that validates against schema", async () => {
    const result = await midiToJmon(mockMidiData, { Tone: mockTone });

    // Basic JMON structure validation
    expect(result.format).toBe("jmon");
    expect(result.version).toBe("1.0");
    expect(typeof result.tempo).toBe("number");
    expect(Array.isArray(result.tracks)).toBe(true);

    // Validate track structure
    for (const track of result.tracks) {
      expect(track).toHaveProperty("label");
      expect(Array.isArray(track.notes)).toBe(true);

      // Validate note structure
      for (const note of track.notes) {
        expect(typeof note.pitch).toBe("number");
        expect(typeof note.time).toBe("number");
        expect(typeof note.velocity).toBe("number");
      }
    }
  });
});
