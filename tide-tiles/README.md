# Tide Tiles

An original, dependency-free HTML5 block puzzle. Select one of three shapes, rotate it, and place it on an 8×8 board. Complete rows and columns to clear space and score. Every fifth placement, alternating rows shift in opposite directions. There is a seeded daily challenge and an endless free-play mode.

## Run

Serve the folder with any static HTTP server. For example, run `node dev-server.mjs` and open `http://localhost:8765/`. Browser module imports do not work reliably from `file://`.

## Controls

- Mouse or touch: select a shape, use Rotate, choose a board square.
- Keyboard: `1`–`3` selects shapes; `R` rotates; Tab and Enter navigate and activate board cells.

Best scores and tutorial preference are stored locally in the browser. No analytics, ads, external scripts, fonts, assets, or network calls are included. Sound is synthesized locally and can be muted.
Sound suspends when the tab or window loses focus; the sound control is hidden on browsers without Web Audio support.

## Integration

The page emits a `tidetiles:game` browser event with a detail object on start, score change, and game over. A publisher can listen to this event to integrate its actual leaderboard SDK after licensing. No proprietary API is assumed in this preview.
The publisher SDK is not bundled or claimed as tested; platform integration and device-specific QA are part of a separate agreed delivery scope.

## Rights and commercial scope

The game code, layout, and graphics were created for this project with AI assistance and do not contain third-party art or audio packs. AI-assisted elements may have limits on exclusive copyright claims in some jurisdictions. A public playable preview conveys no commercial license or source rights. Any paid site-lock or exclusive arrangement requires a separate written agreement specifying permitted uses, territory, term, source delivery, payment, and acceptance.
