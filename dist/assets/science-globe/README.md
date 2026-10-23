# Independent second-fold globe assets

- `geography.json`: locally precomputed land dots, country outline rings and Brazil highlight geometry. The source is the bundled preprocessing input `tools/globe-source/countries.json`, copied without modification.
- `fallback.svg`: generated from the same geography, projection and first-frame view as the live Canvas2D globe. It contains no text, no embedded image and no external resource.
- Rebuild: `node scripts/generate-globe.mjs`. Preprocessing uses the bundled local D3 array/geo scripts under tools/globe-source in a sandbox, retaining their original copyright headers in the preprocessing sources. Runtime needs no D3, global library, WebGL or external request.

The globe centers longitude −64°, latitude 10°, with a −7° axial roll. Rotation changes geographic longitude through an orthographic spherical projection (not the canvas's CSS rotation). Brazil's color follows its real polygon and land dots. The fallback is a still, not a claim that animation is active.
