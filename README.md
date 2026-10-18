# After the Bell — editable story game sample

A small, original interactive story built as a sample for a personal school-themed game commission. It demonstrates scene transitions, clickable people and objects, dialogue choices, collectible items, a gated ending, browser saves, and keyboard-accessible controls.

## Play

Open `index.html` in a modern browser. No account, build tool, server, or internet connection is required.

## Make it yours

Edit `story.js`:

- Change `title`, `objective`, and the text in each scene.
- Add or remove scenes in `scenes`. Each scene has `exits` and `hotspots`.
- Set hotspot `x` and `y` as percentages from the top-left of the play area.
- A hotspot can show `dialogue`, collect an item, require items, or end the story.
- Add item names and icons to `items`.

Edit `style.css` for colors and scene artwork. The sample art is made with CSS so there are no third-party image assets to replace or license. For your own illustrations, replace the `.stage-art` backgrounds with your images and adjust hotspot positions.

The story engine is in `game.js`. If you rename or restructure item IDs, use **Start over** to clear a saved playthrough.

## Delivery scope

This is a working vertical slice with three scenes and one short ending. Names, writing, and art are original; it does not copy characters or assets from any commercial game.

## Custom commissions

The public demo offers a $100 starter project: up to three scenes, six interactions, dialogue choices, and one ending, using the buyer's supplied story and optional art. Scope is agreed before work begins. Prospective buyers can [open an issue](https://github.com/goat99zyx/after-the-bell-story-game-demo/issues/new) to discuss a commission. Please do not post private story details or contact information in a public issue.

## Files

- `index.html` — accessible page structure
- `story.js` — all editable story content
- `game.js` — scene, interaction, dialogue, inventory, and save logic
- `style.css` — layout and original CSS art
