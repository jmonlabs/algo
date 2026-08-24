/**
 * Drum style presets used by the `drummer()` function.
 *
 * Each preset declares:
 * - `name` — preset key
 * - `steps` — grid resolution per bar (16 = 16th notes in 4/4)
 * - `patterns` — per-instrument array of probabilities (0-1) per step
 * - `velocities` — per-instrument base velocity (0-1) when triggered
 *
 * The probabilities are what `drummer()` actually plays: each bar rolls
 * seeded dice against them (variation 'live'), or keeps just the canonical
 * steps at probability ≥ 0.5 (variation 'fixed'). A step's probability also
 * sets its accent — sure slots hit at full base velocity, unlikely slots
 * come out as ghost notes. In multi-meter `sections` mode the kick/snare
 * anchors come from the meter, and these grids are tiled over the bar as
 * the style's syncopation and cymbal layers.
 *
 * Instrument keys correspond to the General MIDI drum map (see drum-map.js):
 *   kick, snare, hihat, openhat, ride, crash, clap, rim, tom_low/mid/high
 */

export const presets = {
  // Boom-bap kick + backbeat snare + 16th hi-hat. The classic.
  "hip-hop": {
    name: "hip-hop",
    steps: 16,
    patterns: {
      kick: [0.95, 0, 0, 0, 0, 0, 0.35, 0, 0.85, 0, 0.25, 0, 0, 0, 0.15, 0],
      snare: [0, 0, 0, 0, 0.9, 0, 0, 0.15, 0, 0, 0, 0, 0.9, 0, 0, 0.2],
      hihat: [0.7, 0.4, 0.65, 0.4, 0.7, 0.4, 0.65, 0.4, 0.7, 0.4, 0.65, 0.4, 0.7, 0.4, 0.65, 0.4],
      openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.25, 0]
    },
    velocities: { kick: 1.0, snare: 0.95, hihat: 0.5, openhat: 0.7 }
  },

  // Classic 4/4, 8th-note feel. Kick on 1+3, snare on 2+4.
  rock: {
    name: "rock",
    steps: 16,
    patterns: {
      kick: [0.95, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0.95, 0, 0, 0, 0, 0, 0, 0, 0.95, 0, 0, 0.1],
      hihat: [0.7, 0, 0.55, 0, 0.7, 0, 0.55, 0, 0.7, 0, 0.55, 0, 0.7, 0, 0.55, 0]
    },
    velocities: { kick: 1.0, snare: 0.95, hihat: 0.55 }
  },

  // Driving four-on-the-floor kick, hard snare, crash on 1.
  punk: {
    name: "punk",
    steps: 16,
    patterns: {
      kick: [0.95, 0, 0, 0, 0.85, 0, 0, 0, 0.95, 0, 0, 0, 0.85, 0, 0, 0],
      snare: [0, 0, 0, 0, 0.95, 0, 0, 0, 0, 0, 0, 0, 0.95, 0, 0, 0.15],
      hihat: [0.85, 0, 0.65, 0, 0.85, 0, 0.65, 0, 0.85, 0, 0.65, 0, 0.85, 0, 0.65, 0],
      crash: [0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    velocities: { kick: 1.0, snare: 1.0, hihat: 0.6, crash: 0.85 }
  },

  // Double-kick gallops, hard backbeat, dense hi-hat, crash accents.
  metal: {
    name: "metal",
    steps: 16,
    patterns: {
      kick: [0.9, 0.25, 0.5, 0.25, 0, 0.25, 0.5, 0.25, 0.9, 0.25, 0.5, 0.25, 0, 0.25, 0.5, 0.25],
      snare: [0, 0, 0, 0, 0.95, 0, 0, 0.15, 0, 0, 0, 0, 0.95, 0, 0, 0.2],
      hihat: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6],
      crash: [0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    velocities: { kick: 1.0, snare: 1.0, hihat: 0.65, crash: 0.9 }
  },

  // Slow, structured heartbeat. Kick on 1 and 3 (steps 0, 8), snare backbeat
  // on 2 and 4 (steps 4, 12) but sparse so it doesn't dominate, gentle 8th-note
  // hihat as time-keeper, occasional openhat anticipation. Predictable enough
  // to feel like a pattern; soft enough to feel ambient.
  // Pair with low density (0.4-0.7), low complexity (0), high humanize.
  ambient: {
    name: "ambient",
    steps: 16,
    patterns: {
      kick: [0.95, 0, 0, 0, 0, 0, 0, 0, 0.85, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0.15],
      hihat: [0.5, 0, 0.4, 0, 0.5, 0, 0.4, 0, 0.5, 0, 0.4, 0, 0.5, 0, 0.4, 0],
      openhat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0]
    },
    velocities: { kick: 0.85, snare: 0.7, hihat: 0.4, openhat: 0.55 }
  },

  // Shuffle base, kick 1+3, snare backbeat. Pair with swing 0.5+.
  blues: {
    name: "blues",
    steps: 16,
    patterns: {
      kick: [0.9, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0.2, 0],
      snare: [0, 0, 0, 0, 0.9, 0, 0, 0.2, 0, 0, 0, 0, 0.9, 0, 0, 0],
      hihat: [0.7, 0, 0.5, 0, 0.7, 0, 0.5, 0, 0.7, 0, 0.5, 0, 0.7, 0, 0.5, 0]
    },
    velocities: { kick: 0.95, snare: 0.85, hihat: 0.55 }
  },

  // Ride-driven swing, foot hi-hat on 2+4, feathered kick, snare ghosts.
  jazz: {
    name: "jazz",
    steps: 16,
    patterns: {
      kick: [0.4, 0, 0, 0, 0, 0, 0, 0, 0.35, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0.1, 0, 0.4, 0, 0.1, 0, 0, 0, 0.1, 0, 0.4, 0, 0.1, 0],
      ride: [0.85, 0, 0.6, 0, 0.85, 0, 0.65, 0.35, 0.85, 0, 0.6, 0, 0.85, 0, 0.65, 0.35],
      hihat: [0, 0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0]
    },
    velocities: { kick: 0.6, snare: 0.45, ride: 0.65, hihat: 0.55 }
  },

  // Complex, displaced backbeat, anticipations. Pair with fillFrequency: 4.
  progrock: {
    name: "progrock",
    steps: 16,
    patterns: {
      kick: [0.9, 0, 0, 0.25, 0, 0, 0.35, 0, 0.9, 0, 0, 0, 0, 0.25, 0, 0],
      snare: [0, 0, 0, 0, 0.85, 0, 0, 0.25, 0, 0, 0.15, 0, 0.85, 0, 0, 0.3],
      hihat: [0.6, 0.35, 0.55, 0.35, 0.6, 0.35, 0.55, 0.35, 0.6, 0.35, 0.55, 0.35, 0.6, 0.35, 0.55, 0.35],
      crash: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2]
    },
    velocities: { kick: 0.95, snare: 0.9, hihat: 0.55, crash: 0.85 }
  },

  // Low-density, off-grid, unpredictable. Vary seed for different feels.
  experimental: {
    name: "experimental",
    steps: 16,
    patterns: {
      kick: [0.3, 0.15, 0.2, 0, 0.15, 0.2, 0, 0.15, 0.3, 0, 0.15, 0.2, 0, 0.15, 0.2, 0.15],
      snare: [0.1, 0, 0.25, 0, 0.15, 0.15, 0, 0.2, 0, 0.25, 0.1, 0.2, 0, 0.15, 0.15, 0],
      hihat: [0.3, 0.25, 0.3, 0.25, 0.3, 0.25, 0.3, 0.25, 0.3, 0.25, 0.3, 0.25, 0.3, 0.25, 0.3, 0.25],
      clap: [0, 0, 0, 0.2, 0, 0, 0, 0.15, 0, 0, 0, 0.2, 0, 0, 0, 0.15],
      rim: [0, 0.15, 0, 0, 0, 0.1, 0, 0, 0.15, 0, 0, 0.1, 0, 0, 0.15, 0]
    },
    velocities: { kick: 0.7, snare: 0.6, hihat: 0.45, clap: 0.7, rim: 0.65 }
  },

  // Syncopated kick, displaced backbeat, polyrhythmic feel.
  mathrock: {
    name: "mathrock",
    steps: 16,
    patterns: {
      kick: [0.9, 0, 0, 0.35, 0.25, 0, 0.65, 0, 0, 0, 0.85, 0, 0, 0.35, 0, 0],
      snare: [0, 0, 0.1, 0, 0, 0, 0, 0.85, 0, 0.25, 0, 0, 0.15, 0, 0, 0.65],
      hihat: [0.7, 0.5, 0.65, 0.5, 0.7, 0.5, 0.65, 0.5, 0.7, 0.5, 0.65, 0.5, 0.7, 0.5, 0.65, 0.5],
      rim: [0, 0, 0, 0, 0, 0.15, 0, 0, 0, 0, 0, 0.15, 0, 0, 0, 0]
    },
    velocities: { kick: 0.95, snare: 0.9, hihat: 0.55, rim: 0.7 }
  },

  // Bossa kick (1 + and-of-2), sidestick clave, constant soft hi-hat/shaker.
  bossanova: {
    name: "bossanova",
    steps: 16,
    patterns: {
      kick: [0.9, 0, 0, 0, 0, 0, 0.85, 0, 0, 0, 0.9, 0, 0, 0, 0.85, 0],
      rim: [0.85, 0, 0, 0.8, 0, 0, 0.85, 0, 0, 0.8, 0, 0, 0.85, 0, 0.8, 0],
      hihat: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    },
    velocities: { kick: 0.85, rim: 0.75, hihat: 0.4 }
  },

  // Syncopated, ghost notes everywhere, "less is more" kick.
  funk: {
    name: "funk",
    steps: 16,
    patterns: {
      kick: [0.95, 0, 0, 0, 0, 0, 0.25, 0, 0.35, 0, 0, 0, 0, 0, 0.15, 0],
      snare: [0, 0, 0.2, 0, 0.9, 0, 0.15, 0.1, 0, 0.25, 0, 0.1, 0.9, 0, 0.2, 0],
      hihat: [0.7, 0.35, 0.65, 0.35, 0.7, 0.35, 0.65, 0.35, 0.7, 0.35, 0.65, 0.35, 0.7, 0.35, 0.65, 0.35],
      openhat: [0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0, 0, 0, 0, 0.2, 0]
    },
    velocities: { kick: 1.0, snare: 0.95, hihat: 0.55, openhat: 0.7 }
  },

  // One-drop: kick + snare hit together on beat 3, no kick on 1.
  reggae: {
    name: "reggae",
    steps: 16,
    patterns: {
      kick: [0, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0.15],
      hihat: [0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0, 0, 0, 0.7, 0],
      rim: [0.35, 0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0]
    },
    velocities: { kick: 0.95, snare: 0.9, hihat: 0.6, rim: 0.6 }
  },

  // Four-on-the-floor electronic, claps on 2+4, off-beat open hi-hat.
  house: {
    name: "house",
    steps: 16,
    patterns: {
      kick: [0.95, 0, 0, 0, 0.95, 0, 0, 0, 0.95, 0, 0, 0, 0.95, 0, 0, 0],
      clap: [0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0],
      hihat: [0.45, 0, 0, 0, 0.45, 0, 0, 0, 0.45, 0, 0, 0, 0.45, 0, 0, 0],
      openhat: [0, 0, 0.65, 0, 0, 0, 0.65, 0, 0, 0, 0.65, 0, 0, 0, 0.65, 0]
    },
    velocities: { kick: 1.0, clap: 0.9, hihat: 0.5, openhat: 0.65 }
  },

  // Amen-break style: kick on 1 and step 10, snare backbeat with chops.
  dnb: {
    name: "dnb",
    steps: 16,
    patterns: {
      kick: [0.95, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.85, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0.9, 0, 0, 0.2, 0, 0, 0, 0, 0.9, 0, 0.35, 0],
      hihat: [0.6, 0.55, 0.6, 0.55, 0.6, 0.55, 0.6, 0.55, 0.6, 0.55, 0.6, 0.55, 0.6, 0.55, 0.6, 0.55]
    },
    velocities: { kick: 1.0, snare: 0.95, hihat: 0.5 }
  },

  // Slower hip-hop with dub-feel space, 8th hi-hat instead of 16ths.
  triphop: {
    name: "triphop",
    steps: 16,
    patterns: {
      kick: [0.9, 0, 0, 0, 0, 0, 0.15, 0, 0.85, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0.1],
      hihat: [0.5, 0, 0.35, 0, 0.5, 0, 0.35, 0, 0.5, 0, 0.35, 0, 0.5, 0, 0.35, 0],
      openhat: [0, 0, 0, 0, 0, 0, 0.25, 0, 0, 0, 0, 0, 0, 0, 0.25, 0]
    },
    velocities: { kick: 0.9, snare: 0.85, hihat: 0.45, openhat: 0.6 }
  },

  // Polyrhythmic Tony Allen-inspired: snare on 3, kick + rim + clap interplay.
  afrobeat: {
    name: "afrobeat",
    steps: 16,
    patterns: {
      kick: [0.85, 0, 0, 0.25, 0, 0, 0.65, 0, 0, 0.35, 0, 0, 0.8, 0, 0, 0.25],
      snare: [0, 0, 0.25, 0, 0, 0.15, 0, 0, 0.85, 0, 0, 0.15, 0, 0, 0.25, 0],
      hihat: [0.6, 0.4, 0.55, 0.4, 0.6, 0.4, 0.55, 0.4, 0.6, 0.4, 0.55, 0.4, 0.6, 0.4, 0.55, 0.4],
      rim: [0, 0, 0, 0.3, 0, 0, 0, 0.2, 0, 0, 0, 0.3, 0, 0, 0, 0.2],
      clap: [0, 0, 0, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0.3, 0, 0, 0]
    },
    velocities: { kick: 0.95, snare: 0.85, hihat: 0.55, rim: 0.6, clap: 0.65 }
  },

  // Chopped, displaced, unpredictable. Dense per bar, irregular placement.
  breakbeat: {
    name: "breakbeat",
    steps: 16,
    patterns: {
      kick: [0.85, 0, 0, 0.25, 0, 0.15, 0, 0, 0.35, 0, 0.65, 0, 0, 0.25, 0, 0.15],
      snare: [0, 0, 0, 0, 0.85, 0, 0.25, 0, 0, 0.15, 0, 0.25, 0.8, 0, 0, 0.35],
      hihat: [0.55, 0.45, 0.55, 0.45, 0.55, 0.45, 0.55, 0.45, 0.55, 0.45, 0.55, 0.45, 0.55, 0.45, 0.55, 0.45],
      rim: [0, 0, 0.15, 0, 0, 0, 0, 0.15, 0, 0.15, 0, 0, 0, 0.15, 0, 0]
    },
    velocities: { kick: 0.95, snare: 0.9, hihat: 0.55, rim: 0.65 }
  },

  // Generic shuffle, between blues and swing. Pair with swing 0.5+.
  shuffle: {
    name: "shuffle",
    steps: 16,
    patterns: {
      kick: [0.9, 0, 0, 0, 0, 0, 0, 0.15, 0.85, 0, 0, 0, 0, 0, 0.25, 0],
      snare: [0, 0, 0, 0, 0.85, 0, 0, 0.15, 0, 0, 0, 0, 0.85, 0, 0, 0.15],
      hihat: [0.65, 0, 0.5, 0, 0.65, 0, 0.5, 0, 0.65, 0, 0.5, 0, 0.65, 0, 0.5, 0]
    },
    velocities: { kick: 0.95, snare: 0.9, hihat: 0.55 }
  }
};

/**
 * Look up a preset by name.
 * @param {string} name
 * @returns {Object}
 */
export function getPreset(name) {
  if (!(name in presets)) {
    const available = Object.keys(presets).join(", ");
    throw new Error(
      `Unknown drummer preset: "${name}". Available: ${available}`
    );
  }
  return presets[name];
}
