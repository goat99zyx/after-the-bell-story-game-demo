# Nightwatch Microgrid

An original browser simulation built during the Game Gauntlet SIM Jam development window. Four days of three shifts each: forecast wind, solar, weather and district demand, then dispatch diesel and battery power, allocate it to critical services, and maintain the grid.

## Play

Serve this directory with any static HTTP server and open `index.html`. No build step, accounts, external assets, analytics or runtime dependencies are required. Game progress is saved in browser localStorage. The game runs on desktop and mobile browsers with JavaScript modules enabled.

## Controls

- `+` and `−` buttons adjust diesel, battery discharge and district allocation.
- **Auto assign** fills the clinic first, then pumps, homes and port.
- Pick up to one maintenance action each shift.
- **Run this shift** advances time and records the outcome.
- **How to play** opens the rules. The help dialog closes with its button, Escape, or a backdrop click.

## Rules

After shift 12, win with at least 35% trust, no more than two clinic outage shifts, and nonnegative funds. Every unmet MW affects trust; clinic and pumps carry the largest penalties. Diesel uses fuel and raises emissions. Spare renewable power charges the battery. The score rewards service, trust, remaining funds and battery, while penalizing emissions and clinic outages.

## Files

- `index.html`: accessible game shell and help.
- `style.css`: responsive interface and original CSS illustration.
- `sim.mjs`: deterministic simulation engine with explicit validation.
- `app.mjs`: interface, controls and local save.

## AI and rights disclosure

The game concept, rules, code, CSS illustration and this document were created with AI assistance and reviewed by the submitter. No third-party artwork, music, fonts, engines or asset packs are bundled. The submitter can grant only commercial rights actually held and cannot guarantee exclusive copyright in AI-generated elements. Publication or licensing requires separate terms.
