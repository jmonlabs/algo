/**
 * Counterpoint: writing several voices over given chords, and reading voices
 * already written.
 *
 * `voiceChorale` takes chords as they are named (a bass and pitch classes)
 * and decides who plays what, at which octave, so that the voices move as
 * little as possible without breaking the rules asked for. `counterpoint`
 * goes the other way: it reads finished voices and reports where they move
 * in parallel fifths or octaves, and where they clash.
 */

const pitchClass = (pitch) => ((pitch % 12) + 12) % 12;

/**
 * Whether two voices move from one perfect consonance (unison, fifth, octave,
 * or their compounds) to another in the same direction: the parallel fifths
 * and octaves of classical counterpoint, where two voices merge into one to
 * the ear.
 *
 * @param {number} a1 - The first voice, before
 * @param {number} b1 - The second voice, before
 * @param {number} a2 - The first voice, after
 * @param {number} b2 - The second voice, after
 * @returns {boolean}
 *
 * @example
 * parallelPerfects(57, 50, 55, 48);  // A over D, then G over C: true
 * parallelPerfects(57, 50, 57, 50);  // nothing moved: false
 */
export function parallelPerfects(a1, b1, a2, b2) {
    const together = Math.sign(a2 - a1) === Math.sign(b2 - b1) && a1 !== a2;
    const perfect = (x, y) => [0, 7].includes(pitchClass(Math.abs(x - y)));
    return together && perfect(a1, b1) && perfect(a2, b2);
}

/** Every way to write one chord for the voices, lowest voice first. */
function voicingsOf(chord, { ranges, maxSpacing, complete }) {
    const wanted = chord.pitchClasses.map(pitchClass);
    const choices = ranges.map(([low, high]) => {
        const pitches = [];
        for (let p = low; p <= high; p++) if (wanted.includes(pitchClass(p))) pitches.push(p);
        return pitches;
    });
    const heardWithBass = typeof chord.bass === 'number' ? [pitchClass(chord.bass)] : [];

    const out = [];
    const build = (voicing) => {
        if (voicing.length === ranges.length) {
            const heard = new Set([...heardWithBass, ...voicing.map(pitchClass)]);
            if (!complete || wanted.every((pc) => heard.has(pc))) out.push(voicing);
            return;
        }
        for (const pitch of choices[voicing.length]) {
            const below = voicing.at(-1);
            if (below !== undefined && (pitch <= below || pitch - below > maxSpacing)) continue;
            build([...voicing, pitch]);
        }
    };
    build([]);
    return out;
}

/** What it costs to go from one chord to the next: how far the voices move. */
function moveCost(from, to, allowParallels) {
    const before = typeof from.bass === 'number' ? [from.bass, ...from.voicing] : from.voicing;
    const after = typeof to.bass === 'number' ? [to.bass, ...to.voicing] : to.voicing;
    if (!allowParallels && before.length === after.length) {
        for (let i = 0; i < before.length; i++) {
            for (let j = i + 1; j < before.length; j++) {
                if (parallelPerfects(before[i], before[j], after[i], after[j])) return Infinity;
            }
        }
    }
    return from.voicing.reduce((sum, pitch, i) => sum + Math.abs(to.voicing[i] - pitch), 0);
}

/**
 * Write chords for several voices, the way a chorale is written: every way of
 * writing each chord is tried, and the sequence kept is the one where the
 * voices move the least, with no voice crossing another and no parallel
 * fifths or octaves (the bass included, when the chords have one).
 *
 * The search is exhaustive (dynamic programming over the chords), so the
 * result is the best there is under the rules, not a good guess. It grows
 * quickly with the number of voices and the width of their ranges: meant for
 * a handful of voices.
 *
 * @param {Array<{bass?: number, pitchClasses: Array<number>}>} chords - Each
 *   chord's notes as pitch classes (0 = C … 11 = B; MIDI pitches are reduced),
 *   and the bass another voice plays under them, as a MIDI pitch. The bass is
 *   not written here: it counts as heard, and for parallels.
 * @param {Object} options
 * @param {Array<[number, number]>} options.ranges - The range of each voice
 *   as `[lowest, highest]` MIDI pitches, from the lowest voice to the highest
 * @param {number} [options.maxSpacing=12] - Most semitones between two
 *   neighbouring voices
 * @param {boolean} [options.cyclic=true] - The chords repeat: the move from
 *   the last chord back to the first is checked and counted too
 * @param {number} [options.top] - Where the highest voice would rather start
 *   (MIDI pitch); without it, any register that moves least is as good
 * @param {boolean} [options.complete=true] - Every note of the chord must be
 *   heard, in the voices or in the bass
 * @param {boolean} [options.allowParallels=false] - Accept parallel fifths
 *   and octaves
 * @returns {Array<Array<number>>} One voicing per chord, lowest voice first
 * @throws {Error} When a chord cannot be written in the ranges, or when no
 *   sequence obeys the rules
 *
 * @example
 * // D minor, C major, over a descending bass: viola, second and first violin.
 * voiceChorale(
 *   [{ bass: 50, pitchClasses: [2, 5, 9] }, { bass: 48, pitchClasses: [0, 4, 7] }],
 *   { ranges: [[48, 67], [55, 74], [60, 79]], top: 69 },
 * );
 */
export function voiceChorale(chords, options = {}) {
    const { ranges, maxSpacing = 12, cyclic = true, top, complete = true, allowParallels = false } = options;
    if (!Array.isArray(chords) || chords.length === 0) return [];
    if (!Array.isArray(ranges) || ranges.length === 0) {
        throw new Error('voiceChorale: `ranges` must give a [lowest, highest] pair for each voice');
    }

    const written = chords.map((chord, k) => {
        if (!Array.isArray(chord?.pitchClasses) || chord.pitchClasses.length === 0) {
            throw new Error(`voiceChorale: chord ${k} has no pitchClasses`);
        }
        const voicings = voicingsOf(chord, { ranges, maxSpacing, complete });
        if (voicings.length === 0) {
            throw new Error(`voiceChorale: chord ${k} cannot be written in these ranges`);
        }
        return voicings;
    });

    const at = (k, voicing) => ({ bass: chords[k].bass, voicing });
    const startCost = (voicing) => (typeof top === 'number' ? Math.abs(voicing.at(-1) - top) : 0);

    // A cycle must come back to the voicing it started from, so each way of
    // writing the first chord is followed separately to the end.
    const starts = cyclic ? written[0].map((first) => [first]) : [written[0]];
    let best = null;
    for (const firsts of starts) {
        let paths = firsts.map((first) => ({ cost: startCost(first), path: [first] }));
        for (let k = 1; k < chords.length; k++) {
            paths = written[k].map((voicing) => {
                let pick = { cost: Infinity, path: null };
                for (const p of paths) {
                    const cost = p.cost + moveCost(at(k - 1, p.path.at(-1)), at(k, voicing), allowParallels);
                    if (cost < pick.cost) pick = { cost, path: [...p.path, voicing] };
                }
                return pick;
            }).filter((p) => p.path);
        }
        for (const p of paths) {
            const back = cyclic ? moveCost(at(chords.length - 1, p.path.at(-1)), at(0, p.path[0]), allowParallels) : 0;
            const cost = p.cost + back;
            if (cost < Infinity && (!best || cost < best.cost)) best = { cost, path: p.path };
        }
    }
    if (!best) {
        throw new Error('voiceChorale: no sequence of voicings obeys the rules; widen the ranges or allow parallels');
    }
    return best.path;
}

/**
 * Read voices already written and report what classical counterpoint would
 * question: parallel fifths and octaves between two voices, and the harshest
 * clashes (a minor second or a major seventh, and their compounds such as the
 * minor ninth).
 *
 * The voices are looked at each time a note starts in any of them. A parallel
 * is reported where the second interval arrives; a clash, where one of its
 * two notes starts. A voice doubling another at the octave on purpose is
 * reported as parallels too: the report says where, not whether it is wrong.
 *
 * @param {Object<string, Array>|Array<Array>} voices - JMON notes per voice,
 *   by name, or a list of voices (then named by their index)
 * @param {Object} [options]
 * @param {number} [options.beatsPerBar=4] - For the `bar` and `beat` of each finding
 * @param {boolean} [options.parallels=true] - Report parallel fifths and octaves
 * @param {Array<number>} [options.clashes=[1, 11]] - The intervals reported as
 *   clashes, in semitones within the octave; `[]` reports none
 * @returns {Array<{kind: 'parallel'|'clash', time: number, bar: number,
 *   beat: number, voices: [string, string], pitches: [number, number],
 *   from?: [number, number]}>} In order of time. `bar` and `beat` count from 1.
 *
 * @example
 * counterpoint({ violin: melody, cello: bass })
 *   .map((f) => `bar ${f.bar}, beat ${f.beat}: ${f.kind} ${f.voices.join(' / ')}`);
 */
export function counterpoint(voices, options = {}) {
    const { beatsPerBar = 4, parallels = true, clashes = [1, 11] } = options;
    const names = Object.keys(voices);
    const lines = names.map((name) =>
        (voices[name] || []).filter((n) => typeof n.pitch === 'number' && typeof n.time === 'number'));
    const soundingAt = (notes, t) => notes.find((n) => n.time <= t && t < n.time + (n.duration || 0));
    const times = [...new Set(lines.flatMap((notes) => notes.map((n) => n.time)))].sort((a, b) => a - b);

    const findings = [];
    let previous = null;
    for (const time of times) {
        const now = lines.map((notes) => soundingAt(notes, time));
        const where = { time, bar: Math.floor(time / beatsPerBar) + 1, beat: (time % beatsPerBar) + 1 };
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const [a, b] = [now[i], now[j]];
                if (!a || !b) continue;
                const pair = { voices: [names[i], names[j]], pitches: [a.pitch, b.pitch] };
                const starts = a.time === time || b.time === time;
                if (starts && clashes.includes(pitchClass(Math.abs(a.pitch - b.pitch)))) {
                    findings.push({ kind: 'clash', ...where, ...pair });
                }
                const [pa, pb] = previous ? [previous[i], previous[j]] : [];
                if (parallels && pa && pb && parallelPerfects(pa.pitch, pb.pitch, a.pitch, b.pitch)) {
                    findings.push({ kind: 'parallel', ...where, ...pair, from: [pa.pitch, pb.pitch] });
                }
            }
        }
        previous = now;
    }
    return findings;
}
