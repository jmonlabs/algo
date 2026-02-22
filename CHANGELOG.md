# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-22

### Fixed
- **Score Renderer**: Fixed floating point precision issues in measure splitting that could cause incorrect measure boundaries
- **Score Renderer**: Added time equality tolerance (0.0001) to prevent floating point rounding errors
- **API Consistency**: Fixed test API inconsistencies across all modules (no legacy hacks for alpha package)
  - Scale: Corrected naming convention `'pentatonic_major'` → `'major pentatonic'`
  - Voice: Removed non-existent `harmonize()` method, use `leadProgression()` instead
  - Articulation: Fixed `apply()` method signature to `apply(notes, index, type, params)`
  - Darwin (Genetic Algorithm): Corrected to pass `initialPhrases` in constructor and use `evolveGenerations()`
  - Loop: Added required `loops` parameter to constructor
  - Phasor: Fixed constructor signature to `(distance, frequency, phase, subPhasors)`
  - Removed incorrect calls to non-existent `toPitches()` methods on generators

### Added
- **Documentation**: Comprehensive API reference (API.md)
- **Documentation**: Observable Framework integration guide (OBSERVABLE_GUIDE.md)
- **Tests**: Score renderer test suite with 8 comprehensive test cases
- **Tests**: All music theory and generative algorithm tests now passing (24/24)
- **Microtuning**: Full microtuning support through tonejs converter for Corruptor module

## [1.0.0] - 2024-01-XX

### Added
- Initial release of JMON algorithmic composition library
- Music theory modules (scales, chords, progressions, voice leading)
- Generative algorithms (cellular automata, fractals, genetic, walks, minimalism)
- Browser and Deno runtime support
- JSR package publication
- Observable Framework compatibility
