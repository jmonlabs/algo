/**
 * The package's one seeded generator (mulberry32): the same seed gives the
 * same series, in every runtime. `random(seed)()` is a number in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
export function random(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
