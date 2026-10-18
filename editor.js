(() => {
  "use strict";
  const draftKey = "after-the-bell-story-draft";
  const $ = (id) => document.getElementById(id);
  const copy = (value) => JSON.parse(JSON.stringify(value));
  let draft;
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey));
    draft = saved?.scenes?.[saved.startScene] && saved?.items ? saved : copy(window.STORY);
  } catch { draft = copy(window.STORY); }
  let currentScene = draft.startScene;

  function status(message) { $("status").textContent = message; }
  function persist() {
    try { localStorage.setItem(draftKey, JSON.stringify(draft)); status("Draft saved in this browser."); }
    catch { status("Browser storage is full. Download story.js to save your changes."); }
  }
  function input(label, value, onInput, multiline = false) {
    const wrapper = document.createElement("label");
    wrapper.append(document.createTextNode(label));
    const field = document.createElement(multiline ? "textarea" : "input");
    field.value = value || "";
    field.maxLength = multiline ? 1200 : 180;
    field.addEventListener("input", () => { onInput(field.value); persist(); });
    wrapper.append(field);
    return wrapper;
  }
  function heading(tag, value) {
    const el = document.createElement(tag);
    el.textContent = value;
    return el;
  }
  function renderTabs() {
    const tabs = $("scene-tabs");
    tabs.replaceChildren();
    for (const [id, scene] of Object.entries(draft.scenes)) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = scene.title;
      button.setAttribute("aria-current", String(id === currentScene));
      button.addEventListener("click", () => { currentScene = id; renderTabs(); renderScene(); });
      tabs.append(button);
    }
  }
  function renderScene() {
    const scene = draft.scenes[currentScene];
    const box = $("scene-editor");
    box.replaceChildren(heading("h2", `Scene: ${scene.title}`));
    const fields = document.createElement("div");
    fields.className = "field-grid";
    fields.append(
      input("Scene title", scene.title, (v) => { scene.title = v; box.querySelector("h2").textContent = `Scene: ${v}`; renderTabs(); }),
      input("Chapter label", scene.chapter, (v) => { scene.chapter = v; }),
      input("Scene description", scene.description, (v) => { scene.description = v; })
    );
    box.append(fields, heading("h3", "Background art"));
    const help = document.createElement("p");
    help.className = "art-help";
    help.textContent = "Choose a JPG, PNG, or WebP image under 500 KB. Your artwork is embedded into the downloaded story.js file.";
    box.append(help);
    const uploadLabel = document.createElement("label");
    uploadLabel.textContent = "Upload scene background";
    const upload = document.createElement("input");
    upload.type = "file";
    upload.accept = "image/jpeg,image/png,image/webp";
    upload.addEventListener("change", async () => {
      const file = upload.files?.[0];
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 500000) { status("Choose a JPG, PNG, or WebP image under 500 KB."); upload.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => { scene.image = reader.result; persist(); renderScene(); };
      reader.onerror = () => status("Could not read that image. Try another file.");
      reader.readAsDataURL(file);
    });
    uploadLabel.append(upload);
    box.append(uploadLabel);
    if (scene.image) {
      const image = document.createElement("img");
      image.className = "image-preview";
      image.alt = "Current scene background";
      image.src = scene.image;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-art";
      remove.textContent = "Remove background";
      remove.addEventListener("click", () => { delete scene.image; persist(); renderScene(); });
      box.append(image, remove);
    }
    box.append(heading("h3", "Interactions and dialogue"));
    for (const hotspot of scene.hotspots) {
      const group = document.createElement("div");
      group.className = "interaction";
      group.append(heading("h4", hotspot.label));
      group.append(input("Clickable label", hotspot.label, (v) => { hotspot.label = v; group.querySelector("h4").textContent = v; }));
      if (hotspot.dialogue) {
        group.append(input("Speaker", hotspot.dialogue.speaker, (v) => { hotspot.dialogue.speaker = v; }));
        group.append(input("Dialogue", hotspot.dialogue.text, (v) => { hotspot.dialogue.text = v; }, true));
        for (const choice of hotspot.dialogue.choices || []) {
          group.append(input("Choice label", choice.label, (v) => { choice.label = v; }));
          if (choice.next) group.append(input("Response to this choice", choice.next.text, (v) => { choice.next.text = v; }, true));
        }
      }
      box.append(group);
    }
  }
  $("story-title").value = draft.title;
  $("story-objective").value = draft.objective;
  $("story-title").addEventListener("input", (event) => { draft.title = event.target.value; persist(); });
  $("story-objective").addEventListener("input", (event) => { draft.objective = event.target.value; persist(); });
  $("preview").addEventListener("click", () => { persist(); window.open("index.html?preview=1", "_blank", "noopener"); });
  $("download").addEventListener("click", () => {
    const text = `/* Made with the After the Bell story editor. */\nwindow.STORY = ${JSON.stringify(draft, null, 2)};\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "story.js";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("Downloaded story.js. Replace the sample file with this one.");
  });
  $("reset").addEventListener("click", () => {
    if (!confirm("Reset all edits in this browser to the original sample?")) return;
    draft = copy(window.STORY);
    currentScene = draft.startScene;
    $("story-title").value = draft.title;
    $("story-objective").value = draft.objective;
    persist(); renderTabs(); renderScene();
  });
  renderTabs(); renderScene();
})();
