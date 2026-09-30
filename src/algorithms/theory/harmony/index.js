import { Scale } from "./Scale.js";
import { Progression } from "./Progression.js";
import { Voice } from "./Voice.js";
import { Ornament } from "./Ornament.js";
import { Articulation } from "./Articulation.js";
import { chordify, chordifyMany } from "./Chordify.js";
import { Arpeggiate, arpeggiate } from "./Arpeggiate.js";
import { Strum, strum } from "./Strum.js";
import { Key, key } from "./Key.js";
import Solfege from "./Solfege.js";
import { counterpoint, parallelPerfects, voiceChorale } from "../../../voices/counterpoint.js";

// Export both as namespace and individual exports
export {
  counterpoint,
  parallelPerfects,
  voiceChorale,
  Arpeggiate,
  Articulation,
  Key,
  Ornament,
  Progression,
  Scale,
  Strum,
  Voice,
  arpeggiate,
  chordify,
  chordifyMany,
  key,
  strum,
  Solfege,
};

// The harmony namespace. Ornament, Articulation, Strum and Arpeggiate are
// performance now (jm.performance.ornament, articulate, strum, arpeggiate)
// and are exported above for the package's own use only.
export default {
  Scale,
  Progression,
  Voice,
  Key,
  key,
  chordify,
  chordifyMany,
  Solfege,
  counterpoint,
  parallelPerfects,
  voiceChorale,
};
