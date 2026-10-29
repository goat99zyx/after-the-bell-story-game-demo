# Harbor Dispatch 3D — The porcelain run

Original AI-assisted playable slice: one harbor, one delivery van, one fragile-cargo mission. Three.js 0.186.1 (MIT license in vendor/LICENSE). Serve this directory over HTTP; index.html is the entry. No build step or external asset requests.

WASD/arrows drive, Space handbrake, Shift boost, E load/unload, R recover (8 seconds), P pause, C camera. Drag to orbit and wheel to zoom. Touch controls appear on narrow/coarse-pointer screens. Sound is opt-in.

Includes arcade vehicle motion, collisions, cargo damage, two bridges and a risky ramp, moving props, procedural architecture, wheel/body animation, shadows, local best score. Not a full vehicle simulator. Mobile layout was tested in desktop Edge at 390x844, not physical iOS/Android. WeChat port and platform approval are not complete. No payments or advertising are integrated; no revenue is claimed.

Tests: node physics.test.mjs; node browser.test.mjs (local Playwright/Edge path); node route.test.mjs after browser test exports rendered colliders. The route test drives continuously from loading to unloading without teleportation. Browser test checks actual WebGL rendering, keyboard drive, loading, pause, and responsive layout.
