import { Scale } from "./Scale.js";
import { Progression } from "./Progression.js";
import { Voice } from "./Voice.js";
import { Ornament } from "./Ornament.js";
import { Articulation } from "./Articulation.js";
import { chordify, chordifyMany } from "./Chordify.js";
import { Arpeggiate, arpeggiate } from "./Arpeggiate.js";
import { Strum, strum } from "./Strum.js";
import { Key, key } from "./Key.js";

// Export both as namespace and individual exports
export {
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
};

// Export harmony namespace
export default {
  Arpeggiate,
  Scale,
  Progression,
  Voice,
  Ornament,
  Articulation,
  Strum,
  Key,
  key,
  arpeggiate,
  chordify,
  chordifyMany,
  strum,
};
