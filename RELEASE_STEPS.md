# Release Steps for @jmon/algo

## What Changed in This Release

### Fixed
- **Score Renderer**: Fixed floating point precision issues in measure splitting
- **Score Renderer**: Added time equality tolerance to prevent rounding errors
- **API Consistency**: Fixed all test API inconsistencies for alpha package
  - Scale: Changed `'pentatonic_major'` → `'major pentatonic'`
  - Voice: Removed non-existent `harmonize()`, use `leadProgression()`
  - Articulation: Fixed `apply()` signature (needs array + index)
  - Darwin: Pass `initialPhrases` in constructor, use `evolveGenerations()`
  - Loop: Pass required `loops` parameter in constructor
  - Phasor: Use correct constructor signature and `simulate()`
  - Removed calls to non-existent `toPitches()` methods

### Added
- **Documentation**: Added API.md with comprehensive API reference
- **Documentation**: Added OBSERVABLE_GUIDE.md for Observable Framework users
- **Tests**: Added comprehensive test suite for score renderer
- **Microtuning**: Full microtuning support through converters

## Release Steps

### 1. Update Version in deno.json

Current version: `1.0.0`
New version: `1.1.0` (minor release - new features + bug fixes)

Already updated in deno.json ✓

### 2. Create CHANGELOG.md

```bash
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-22

### Fixed
- Score renderer floating point precision in measure splitting
- Time equality comparisons now use tolerance to prevent rounding errors
- API consistency across all modules (no legacy hacks for alpha)
  - Scale naming: `'pentatonic_major'` → `'major pentatonic'`
  - Voice API: use `leadProgression()` instead of non-existent `harmonize()`
  - Articulation API: correct `apply(notes, index, type, params)` signature
  - Darwin API: pass `initialPhrases` in constructor
  - Loop API: requires `loops` parameter
  - Phasor API: correct constructor signature
  - Removed calls to non-existent `toPitches()` methods

### Added
- Comprehensive API documentation (API.md)
- Observable Framework integration guide (OBSERVABLE_GUIDE.md)
- Score renderer test suite
- Full microtuning support through converters

## [1.0.0] - Initial Release
EOF
```

### 3. Commit Version Changes

```bash
git add deno.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.1"
```

### 4. Create Git Tag

```bash
git tag -a v1.1.0 -m "Release v1.1.0

- Fix score renderer floating point precision
- Fix API inconsistencies across modules
- Add comprehensive documentation
- Add microtuning support"

git push origin v1.1.0
```

### 5. Publish to JSR

```bash
# Publish using deno
deno publish

# Or if using npx
npx jsr publish
```

### 6. Verify Publication

After publishing, verify at:
- https://jsr.io/@jmon/algo
- Check that version 1.1.0 appears
- Test import: `import jm from "jsr:@jmon/algo@1.1.0"`

### 7. Create GitHub Release (Optional)

Go to GitHub repository → Releases → Draft a new release
- Tag: v1.1.0
- Title: "v1.1.0 - Documentation, Microtuning & Bug Fixes"
- Copy content from CHANGELOG.md

## Troubleshooting

### If publish fails

1. Check you're authenticated: `deno login jsr`
2. Verify deno.json has correct package name
3. Ensure all files in `publish.include` exist
4. Check no files in `publish.exclude` are required

### If tests fail before publish

```bash
deno test -A
```

Fix any failing tests before publishing.

## Post-Release

1. Update documentation sites if needed
2. Announce on social media / Discord / etc.
3. Monitor for issues in first 24-48 hours
