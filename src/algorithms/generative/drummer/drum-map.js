/**
 * General MIDI drum map (channel 10 standard).
 * Maps instrument keys (used in patterns) to MIDI note numbers.
 * Used as the default drum mapping; override via the `drumMap` option
 * on the `drummer()` function.
 */
export const DEFAULT_DRUM_MAP = {
  kick: 36,
  snare: 38,
  hihat: 42,
  openhat: 46,
  ride: 51,
  crash: 49,
  tom_low: 41,
  tom_mid: 47,
  tom_high: 50,
  clap: 39,
  rim: 37
};
