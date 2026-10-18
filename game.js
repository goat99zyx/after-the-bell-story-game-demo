(() => {
  "use strict";

  const story = window.STORY;
  const saveKey = "after-the-bell-save-v1";
  const $ = (id) => document.getElementById(id);
  const emptyState = () => ({ scene: story.startScene, items: [], used: [], finished: false });

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(saveKey));
      if (!saved || !story.scenes[saved.scene] || !Array.isArray(saved.items) || !Array.isArray(saved.used)) return emptyState();
      return { scene: saved.scene, items: saved.items.filter((id) => story.items[id]), used: saved.used, finished: Boolean(saved.finished) };
    } catch {
      return emptyState();
    }
  }

  let state = loadState();
  let lastFocus = null;

  function save() {
    try { localStorage.setItem(saveKey, JSON.stringify(state)); } catch { /* Private browsing may disable storage. */ }
  }

  function closeDialogue() {
    $("dialogue-layer").hidden = true;
    (lastFocus?.isConnected ? lastFocus : $("scene-title")).focus();
  }

  function showDialogue(node) {
    if (!node) return;
    if ($("dialogue-layer").hidden) lastFocus = document.activeElement;
    $("dialogue-speaker").textContent = node.speaker || "You";
    $("dialogue-text").textContent = node.text || "";
    const choices = $("dialogue-choices");
    choices.replaceChildren();
    const options = node.choices?.length ? node.choices : [{ label: "Continue", close: true }];
    for (const option of options) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.addEventListener("click", () => option.next ? showDialogue(option.next) : closeDialogue());
      choices.append(button);
    }
    $("dialogue-layer").hidden = false;
    $("dialogue-close").focus();
  }

  function useHotspot(hotspot) {
    if (hotspot.once && state.used.includes(hotspot.id)) {
      showDialogue(hotspot.after);
      return;
    }
    if (hotspot.requires && !hotspot.requires.every((id) => state.items.includes(id))) {
      showDialogue(hotspot.missing);
      return;
    }
    if (hotspot.collect && !state.items.includes(hotspot.collect)) state.items.push(hotspot.collect);
    if (hotspot.once) state.used.push(hotspot.id);
    if (hotspot.ending) state.finished = true;
    save();
    render();
    showDialogue(hotspot.dialogue);
  }

  function render() {
    const scene = story.scenes[state.scene];
    $("chapter").textContent = scene.chapter;
    $("scene-title").textContent = scene.title;
    $("objective").textContent = state.finished ? "You found the note. The next chapter is yours to write." : story.objective;
    $("stage").dataset.scene = scene.art;
    $("stage-hint").textContent = scene.description;

    const hotspotBox = $("hotspots");
    hotspotBox.replaceChildren();
    for (const hotspot of scene.hotspots) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hotspot";
      button.style.left = `${hotspot.x}%`;
      button.style.top = `${hotspot.y}%`;
      button.setAttribute("aria-label", hotspot.label);
      button.innerHTML = `<span class="hotspot-icon" aria-hidden="true"></span><span class="hotspot-label"></span>`;
      button.querySelector(".hotspot-icon").textContent = hotspot.icon;
      button.querySelector(".hotspot-label").textContent = hotspot.label;
      button.addEventListener("click", () => useHotspot(hotspot));
      hotspotBox.append(button);
    }

    const exitBox = $("exits");
    exitBox.replaceChildren();
    for (const exit of scene.exits) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "exit-button";
      button.textContent = exit.label;
      button.addEventListener("click", () => {
        state.scene = exit.scene;
        save();
        render();
        $("scene-title").focus();
      });
      exitBox.append(button);
    }

    const inventory = $("inventory-items");
    inventory.replaceChildren();
    if (!state.items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-inventory";
      empty.textContent = "Nothing yet. Keep exploring.";
      inventory.append(empty);
    } else {
      for (const id of state.items) {
        const item = document.createElement("span");
        item.className = "item";
        item.textContent = `${story.items[id].icon}  ${story.items[id].name}`;
        inventory.append(item);
      }
    }
  }

  $("restart").addEventListener("click", () => {
    state = emptyState();
    save();
    closeDialogue();
    render();
  });
  $("dialogue-close").addEventListener("click", closeDialogue);
  $("dialogue-layer").addEventListener("click", (event) => {
    if (event.target === $("dialogue-layer")) closeDialogue();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("dialogue-layer").hidden) closeDialogue();
    if (event.key === "Tab" && !$("dialogue-layer").hidden) {
      const focusable = [...$("dialogue-layer").querySelectorAll("button")];
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index === 0) { event.preventDefault(); focusable.at(-1).focus(); }
      if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); focusable[0].focus(); }
    }
  });
  $("scene-title").tabIndex = -1;
  render();
})();
