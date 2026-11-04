# Atlas and Library sections

Two independent home-only editorial sections follow The Med Times and precede medical experiences. `js/ecosystem-sections.js` renders semantic HTML; `css/ecosystem-sections.css` contains scoped, responsive CSS. No new client runtime, dependency, canvas, iframe, persistent storage, scroll listener or third-party request.

Atlas: wine palette, official vector wordmark, real heart study-interface preview and anatomy/exploration copy. Library: cream editorial spread, official wordmark, real catalog preview and source/collection copy. Both have native external links, explicit new-tab announcements, lazy dimensioned WebP assets, visible keyboard focus, readable text without JavaScript and reduced-motion handling.

Public destinations: https://themedatlas.vercel.app/ and https://themedlibrary.vercel.app/. These are product links, not an activated connection to Club. Both sections state Club activation is in preparation. Library copy explains that full-text availability depends on each source. Image provenance is in `assets/ecosystem/SOURCES.md`.

`tests/ecosystem.mjs` verifies placement, destinations, accessibility attributes, honest availability, resource budgets and normal-flow CSS. The exact approved insertions are recorded in `tests/ecosystem-approved.json`; normalization preserves existing historical regression checks without hiding duplicate, changed, or neighboring content. `tests/ecosystem-baseline.json` verifies every pre-existing generated route against main f1ddb34a0e869d617dd6eb35045703197ca3e06e. The existing wordmark-count assertion now includes Atlas and Library, and Times still precedes medical experiences with the two approved folds between them.

Build: `npm run build`. Checks: `npm run check` and `npm test`. Output: `dist/`.
