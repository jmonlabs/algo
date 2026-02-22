# How to Release (from iPhone or any browser)

## Steps

1. **Merge your PR to main** ✓ (you can do this from GitHub mobile app)

2. **Go to github.com/jmonlabs/algo/releases**
   - Tap "Draft a new release"

3. **Create the release:**
   - **Tag**: Type `v1.1.0` (or whatever version is in deno.json)
   - **Title**: `v1.1.0`
   - **Description**: Copy from CHANGELOG.md or just write "See CHANGELOG.md"
   - **Target**: Select `main` branch
   - Tap "Publish release"

4. **That's it!** 🎉

The GitHub Action will automatically:
- ✅ Run tests
- ✅ Build npm bundles
- ✅ Publish to JSR (jsr.io/@jmon/algo)
- ✅ Publish to npm (npmjs.com/package/@jmon/algo)

## Check Progress

Go to: `github.com/jmonlabs/algo/actions`

You'll see the "Release" workflow running. It takes ~2-3 minutes.

## Verify

After workflow completes:
- JSR: https://jsr.io/@jmon/algo
- npm: https://www.npmjs.com/package/@jmon/algo

Both should show version 1.1.0.
