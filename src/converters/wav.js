/* JMON WAV - WAV audio generation from JMON format */
import { compileEvents } from "../algorithms/audio/index.js";
import { createTrackSynth, resolveConnectTarget } from "../browser/synth-factory.js";
import { SYNTHESIZER_TYPES, ALL_EFFECTS } from "../constants/audio-effects.js";
import { normalizeAudioGraph } from "../utils/normalize.js";

// ...existing code...
export function wav(composition, options = {}) {
	return {
		sampleRate: options.sampleRate || 44100,
		duration: options.duration || 10,
		channels: options.channels || 1,
		tempo: composition.tempo || composition.bpm || 120,
		notes: composition.tracks?.flatMap(t => t.notes) || []
	};
}

/**
 * Download a WAV file from a JMON composition
 *
 * @param {Object} composition - The JMON composition
 * @param {Object} Tone - The Tone.js library (import from npm:tone)
 * @param {string} filename - Output filename (default: "composition.wav")
 * @param {number} duration - Duration in seconds (default: auto-calculated from composition)
 * @returns {Promise<void>}
 *
 * @example
 * import * as Tone from "npm:tone@14.7.77";
 * await jm.converters.downloadWav(composition, Tone, "my-song.wav");
 */
export async function downloadWav(composition, Tone, filename = "composition.wav", duration) {
	normalizeAudioGraph(composition);

	// Calculate duration from composition if not provided
	const maxTime = composition.tracks?.reduce((max, track) => {
		const events = track.events || track.notes || [];
		const trackMax = events.reduce((tMax, note) => {
			const endTime = (note.time || 0) + (note.duration || 0);
			return Math.max(tMax, endTime);
		}, 0);
		return Math.max(max, trackMax);
	}, 0) || 4;

	// Convert quarter notes to seconds
	const tempo = composition.tempo || 120;
	const secondsPerQuarterNote = 60 / tempo;
	const calculatedDuration = maxTime * secondsPerQuarterNote + 1; // +1 second buffer

	const finalDuration = duration || calculatedDuration;

	// Render audio offline using Tone.js
	const buffer = await Tone.Offline(async ({ transport }) => {
		transport.bpm.value = tempo;

		// Build audioGraph instruments if present
		const graphInstruments = await buildAudioGraphInstruments(composition, Tone);

		// Compile modulations for all tracks
		const compiledModulations = [];
		const tracks = composition.tracks || [];
		tracks.forEach((track, index) => {
			try {
				const compiled = compileEvents(track);
				compiledModulations[index] = compiled.modulations || [];
			} catch (e) {
				console.warn(`[WAV] Failed to compile modulations for track ${index}:`, e);
				compiledModulations[index] = [];
			}
		});

		// Phase 1: Create synths and effects for each track via the shared
		// factory. Routing matches the live player exactly: track.output >
		// audioGraph default node > heuristic > destination.
		const trackSynths = [];
		const samplers = [];
		tracks.forEach((track, trackIndex) => {
			const trackModulations = compiledModulations[trackIndex] || [];

			const synthRef = track.synthRef;
			const implicitSynthId = (composition.audioGraph || []).find(
				n => SYNTHESIZER_TYPES.includes(n.type)
			)?.id;
			const sharedSynthId = synthRef || implicitSynthId;
			const sharedSynth = sharedSynthId && graphInstruments ? graphInstruments[sharedSynthId] : null;

			const connectTarget = resolveConnectTarget(
				track,
				sharedSynth ? null : composition.audioGraph,
				graphInstruments || {},
				null,
			);

			const { synth, isLoadable, isShared } = createTrackSynth(track, Tone, sharedSynth);
			if (isLoadable) samplers.push(synth);
			if (!isShared) {
				if (connectTarget) synth.connect(connectTarget);
				else synth.toDestination();
			}

			// Check for vibrato/tremolo modulations
			const vibratoMods = trackModulations.filter(
				(m) => m.type === "pitch" && m.subtype === "vibrato"
			);
			const tremoloMods = trackModulations.filter(
				(m) => m.type === "amplitude" && m.subtype === "tremolo"
			);

			let vibratoEffect = null;
			let tremoloEffect = null;

			if (vibratoMods.length > 0 || tremoloMods.length > 0) {
				if (!isShared) synth.disconnect();

				if (vibratoMods.length > 0) {
					const defaultVibrato = vibratoMods[0];
					vibratoEffect = new Tone.Vibrato({
						frequency: defaultVibrato.rate || 5,
						depth: (defaultVibrato.depth || 50) / 100,
					});
					vibratoEffect.wet.value = 0;
				}

				if (tremoloMods.length > 0) {
					const defaultTremolo = tremoloMods[0];
					tremoloEffect = new Tone.Tremolo({
						frequency: defaultTremolo.rate || 8,
						depth: defaultTremolo.depth || 0.3,
					}).start();
					tremoloEffect.wet.value = 0;
				}

				const tail = (node) => {
					if (connectTarget) node.connect(connectTarget);
					else node.toDestination();
				};

				if (vibratoEffect && tremoloEffect) {
					synth.connect(vibratoEffect);
					vibratoEffect.connect(tremoloEffect);
					tail(tremoloEffect);
				} else if (vibratoEffect) {
					synth.connect(vibratoEffect);
					tail(vibratoEffect);
				} else if (tremoloEffect) {
					synth.connect(tremoloEffect);
					tail(tremoloEffect);
				}
			}

			trackSynths.push({ synth, vibratoEffect, tremoloEffect });
		});

		// Phase 2: Wait for all samplers to finish loading
		console.log(`[WAV] Waiting for ${samplers.length} sampler(s) to load...`);
		await Promise.all(samplers.map(s => s.loaded));
		await Tone.loaded();
		console.log('[WAV] Samples loaded, scheduling notes');

		// Phase 3: Schedule notes and modulation effects
		tracks.forEach((track, trackIndex) => {
			const notes = track.events || track.notes || [];
			const trackModulations = compiledModulations[trackIndex] || [];
			const { synth, vibratoEffect, tremoloEffect } = trackSynths[trackIndex];

			// Schedule effect enable/disable
			trackModulations.forEach((mod) => {
				const startTime = mod.start * secondsPerQuarterNote;
				const endTime = mod.end * secondsPerQuarterNote;

				if (mod.type === "pitch" && mod.subtype === "vibrato" && vibratoEffect) {
					transport.schedule(() => {
						vibratoEffect.frequency.value = mod.rate || 5;
						vibratoEffect.depth.value = (mod.depth || 50) / 100;
						vibratoEffect.wet.value = 1;
					}, startTime);
					transport.schedule(() => { vibratoEffect.wet.value = 0; }, endTime);
				}

				if (mod.type === "amplitude" && mod.subtype === "tremolo" && tremoloEffect) {
					transport.schedule(() => {
						tremoloEffect.frequency.value = mod.rate || 8;
						tremoloEffect.depth.value = mod.depth || 0.3;
						tremoloEffect.wet.value = 1;
					}, startTime);
					transport.schedule(() => { tremoloEffect.wet.value = 0; }, endTime);
				}
			});

			// Build glissando lookup
			const modsByNote = {};
			trackModulations.forEach((mod) => {
				if (!modsByNote[mod.index]) modsByNote[mod.index] = [];
				modsByNote[mod.index].push(mod);
			});

			// Schedule notes
			notes.forEach((note, noteIndex) => {
				const time = (note.time || 0) * secondsPerQuarterNote;
				const noteDuration = (note.duration || 1) * secondsPerQuarterNote;
				const noteMods = modsByNote[noteIndex] || [];

				const glissando = noteMods.find(
					(m) => m.type === "pitch" && (m.subtype === "glissando" || m.subtype === "portamento")
				);
				const bend = noteMods.find(
					(m) => m.type === "pitch" && m.subtype === "bend"
				);

				const mt = note.microtuning || 0;

				if (Array.isArray(note.pitch)) {
					const chordNotes = note.pitch.map((p) =>
						typeof p === "number"
							? (mt ? Tone.Frequency(p + mt, "midi").toFrequency() : Tone.Frequency(p, "midi").toNote())
							: p
					);
					synth.triggerAttackRelease(chordNotes, noteDuration, time, note.velocity || 0.8);
				} else {
					const noteName =
						typeof note.pitch === "number"
							? Tone.Frequency(note.pitch, "midi").toNote()
							: note.pitch;

					if (glissando && glissando.to !== undefined) {
						const toNote = typeof glissando.to === "number"
							? Tone.Frequency(glissando.to, "midi").toNote()
							: glissando.to;
						const startFreq = Tone.Frequency(noteName).toFrequency();
						const endFreq = Tone.Frequency(toNote).toFrequency();
						const cents = 1200 * Math.log2(endFreq / startFreq);
						const microtuningCents = mt * 100;

						if (synth.detune) {
							synth.triggerAttack(noteName, time, note.velocity || 0.8);
							synth.detune.setValueAtTime(microtuningCents, time);
							synth.detune.linearRampToValueAtTime(microtuningCents + cents, time + noteDuration);
							synth.triggerRelease(time + noteDuration);
						} else {
							const glissSynth = new Tone.MonoSynth().toDestination();
							glissSynth.triggerAttack(noteName, time, note.velocity || 0.8);
							glissSynth.detune.setValueAtTime(microtuningCents, time);
							glissSynth.detune.linearRampToValueAtTime(microtuningCents + cents, time + noteDuration);
							glissSynth.triggerRelease(time + noteDuration);
						}
					} else if (bend && synth.detune) {
						// Bend : detune ramps from baseline to `amount` cents
						// over a fast attack (~30% of note, capped 0.25s), then
						// holds or returns. Reset slightly after release so
						// subsequent notes start clean.
						const microtuningCents = mt * 100;
						const startDetune = microtuningCents;
						const peakDetune = microtuningCents + bend.amount;
						const rampTime = Math.min(0.25, noteDuration * 0.3);
						const playNote = mt
							? Tone.Frequency(note.pitch + mt, "midi").toFrequency()
							: noteName;
						synth.detune.cancelScheduledValues(time);
						synth.detune.setValueAtTime(startDetune, time);
						synth.detune.linearRampToValueAtTime(peakDetune, time + rampTime);
						if (bend.returnToOriginal) {
							synth.detune.linearRampToValueAtTime(startDetune, time + noteDuration);
						} else {
							synth.detune.setValueAtTime(peakDetune, time + noteDuration);
							synth.detune.setValueAtTime(startDetune, time + noteDuration + 0.05);
						}
						synth.triggerAttackRelease(playNote, noteDuration, time, note.velocity || 0.8);
					} else {
						// Apply microtuning by converting to frequency
						const playNote = mt
							? Tone.Frequency(note.pitch + mt, "midi").toFrequency()
							: noteName;
						synth.triggerAttackRelease(playNote, noteDuration, time, note.velocity || 0.8);
					}
				}
			});
		});

		transport.start(0);
	}, finalDuration);

	// Convert AudioBuffer to WAV blob
	const wavBlob = await audioBufferToWav(buffer);

	// Return a download link element (like the MIDI converter)
	const url = URL.createObjectURL(wavBlob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.textContent = `Download ${filename}`;
	return a;
}

/**
 * Build audioGraph instruments from composition
 * @private
 */
async function buildAudioGraphInstruments(composition, Tone) {
	if (!composition.audioGraph || !Array.isArray(composition.audioGraph)) {
		return null;
	}

	const map = {};
	const { SYNTHESIZER_TYPES, ALL_EFFECTS } = await import("../constants/audio-effects.js");

	try {
		// First pass: Create all nodes
		composition.audioGraph.forEach((node) => {
			const { id, type, options = {} } = node;
			if (!id || !type) return;

			let instrument = null;

			if (SYNTHESIZER_TYPES.includes(type)) {
				// Create synth
				try {
					instrument = new Tone[type](options);
				} catch (e) {
					console.warn(`Failed to create ${type}, using PolySynth:`, e);
					instrument = new Tone.PolySynth();
				}
			} else if (ALL_EFFECTS.includes(type)) {
				// Create effect
				try {
					instrument = new Tone[type](options);
				} catch (e) {
					console.warn(`Failed to create ${type} effect:`, e);
					instrument = null;
				}
			} else if (type === "Destination") {
				map[id] = Tone.Destination;
			}

			if (instrument) {
				map[id] = instrument;
			}
		});

		// Second pass: Connect the routing
		composition.audioGraph.forEach((node) => {
			const { id, target } = node;
			if (!id || !map[id] || map[id] === Tone.Destination) return;

			const currentNode = map[id];

			if (target && map[target]) {
				// Connect to target
				if (map[target] === Tone.Destination) {
					currentNode.toDestination();
				} else {
					currentNode.connect(map[target]);
				}
			} else {
				// No target, connect to destination
				currentNode.toDestination();
			}
		});

		return map;
	} catch (e) {
		console.error("Failed building audioGraph instruments:", e);
		return null;
	}
}

/**
 * Convert an AudioBuffer to a WAV blob
 * @private
 */
function audioBufferToWav(buffer) {
	const numberOfChannels = buffer.numberOfChannels;
	const sampleRate = buffer.sampleRate;
	const length = buffer.length * numberOfChannels * 2;

	const arrayBuffer = new ArrayBuffer(44 + length);
	const view = new DataView(arrayBuffer);

	// WAV header
	const writeString = (offset, string) => {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	};

	writeString(0, "RIFF");
	view.setUint32(4, 36 + length, true);
	writeString(8, "WAVE");
	writeString(12, "fmt ");
	view.setUint32(16, 16, true); // fmt chunk size
	view.setUint16(20, 1, true); // PCM format
	view.setUint16(22, numberOfChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
	view.setUint16(32, numberOfChannels * 2, true); // block align
	view.setUint16(34, 16, true); // bits per sample
	writeString(36, "data");
	view.setUint32(40, length, true);

	// Write audio data
	const channels = [];
	for (let i = 0; i < numberOfChannels; i++) {
		channels.push(buffer.getChannelData(i));
	}

	let offset = 44;
	for (let i = 0; i < buffer.length; i++) {
		for (let channel = 0; channel < numberOfChannels; channel++) {
			const sample = Math.max(-1, Math.min(1, channels[channel][i]));
			view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
			offset += 2;
		}
	}

	return new Blob([arrayBuffer], { type: "audio/wav" });
}
