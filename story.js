/* Edit this file to create a new story. No build step or server is required. */
window.STORY = {
  title: "After the Bell",
  startScene: "courtyard",
  objective: "Find the note hidden in the memory box.",
  items: {
    brassKey: { name: "Brass key", icon: "✧" },
    paperCrane: { name: "Paper crane", icon: "⌁" }
  },
  scenes: {
    courtyard: {
      chapter: "The last day of school",
      title: "Courtyard",
      description: "The bell has rung, but one small mystery remains.",
      art: "courtyard",
      exits: [{ label: "Go to the hallway", scene: "hallway" }],
      hotspots: [
        {
          id: "friend", label: "Talk to Sam", icon: "☺", x: 29, y: 58,
          dialogue: {
            speaker: "Sam",
            text: "I left you something in the library. I wanted you to find it yourself.",
            choices: [
              { label: "Give me a hint", next: { speaker: "Sam", text: "Start with the bench where we always waited after class." } },
              { label: "I'll look around", close: true }
            ]
          }
        },
        {
          id: "bench", label: "Check the bench", icon: "▤", x: 72, y: 75,
          once: true,
          collect: "brassKey",
          dialogue: { speaker: "You", text: "A little brass key is taped beneath the bench. Sam always did love hiding things." },
          after: { speaker: "You", text: "Only a rectangle of old tape is left under the bench." }
        }
      ]
    },
    hallway: {
      chapter: "A quiet corridor",
      title: "Hallway",
      description: "The classroom doors are closed. The library is still open.",
      art: "hallway",
      exits: [
        { label: "Back to the courtyard", scene: "courtyard" },
        { label: "Enter the library", scene: "library" }
      ],
      hotspots: [
        {
          id: "locker", label: "Open your locker", icon: "▣", x: 27, y: 60,
          once: true,
          collect: "paperCrane",
          dialogue: { speaker: "You", text: "A paper crane sits on the top shelf. Written on its wing: 'Remember our first story?'" },
          after: { speaker: "You", text: "The locker is empty now." }
        },
        {
          id: "poster", label: "Read the poster", icon: "✎", x: 71, y: 42,
          dialogue: { speaker: "Poster", text: "Every great story starts with one curious step." }
        }
      ]
    },
    library: {
      chapter: "One last surprise",
      title: "Library",
      description: "The room smells like old books and fresh rain.",
      art: "library",
      exits: [{ label: "Back to the hallway", scene: "hallway" }],
      hotspots: [
        {
          id: "box", label: "Open the memory box", icon: "▧", x: 55, y: 67,
          requires: ["brassKey", "paperCrane"],
          missing: { speaker: "You", text: "The box is locked. A tiny crane is painted next to the keyhole; there must be more to find." },
          once: true,
          ending: true,
          dialogue: {
            speaker: "Sam's note",
            text: "Every good adventure needs a friend. Thanks for being mine. Ready for the next chapter?"
          },
          after: { speaker: "You", text: "The box is open. You keep the note safe in your pocket." }
        },
        {
          id: "books", label: "Browse the books", icon: "▥", x: 16, y: 44,
          dialogue: { speaker: "You", text: "Some stories end here. The good ones leave room for another chapter." }
        }
      ]
    }
  }
};
