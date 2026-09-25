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
import { chordName, toRegister } from './chord-shape.js';

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
  Solfege,
  chordName,
  toRegister,
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
  chordName,
  toRegister,
  chordify,
  chordifyMany,
  strum,
  Solfege,
};
