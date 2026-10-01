# Integration checks

Scripts that need something installed, which the CI job does not have. They print observations and count their own pass/fail: read their output.

| Script | Needs | What it does |
|---|---|---|
| `gaussian-processes.mjs` | `@tangent.to/ds` | The GP regressor, deliberately unreachable from `jm` so the dependency is only paid for by someone who imports it directly. |

Run it with:

    node tests/integration/gaussian-processes.mjs

The real suites are one directory up, one per space (`notes`, `performance`, `key-context`, `counterpoint`, `voices`, `rhythm-code`, `music-theory`, `generative-algorithms`, `drummer-groove`, `darwin-bodzsar`, `ornament`, `analysis`, `emotional-map`, `corruptor`, `plot-data`), and `browser-load.test.mjs`, which loads `src/index.js` in a headless browser the way jsDelivr serves it. `npm test` runs them all; the CI job lists them by name.

The scripts that used to live here (`all-features`, `comprehensive-tests`, `corruptor-microtuning`, `score-renderer`, `tone-esm-compat`, `bun-compatibility`) walked the library's internals and lagged behind every move; the suites cover their ground, score rendering is `jmon/show`, and the Bun check imported a package version that no longer exists. They are in git history before 2026-10-01.
