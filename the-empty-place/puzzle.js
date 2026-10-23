/* The Empty Place — original jam puzzle data and rule engine. */
(function (root) {
  const guests = ['Mara', 'Ivo', 'June', 'Sol', 'Nia'];
  const rounds = [
    {
      eyebrow: 'WELCOME SERVICE / 12:00',
      title: 'A perfectly ordinary lunch',
      story: 'The civic hall has put out six chairs for five guests. The host says the extra place is simply good manners. One line on the seating card is wrong.',
      after: 'The host smiles. “We always leave one place open. It is only polite.” The name card on that chair is blank on both sides.',
      answer: { Mara: 1, Ivo: 2, June: 3, Sol: 4, Nia: 5 },
      lie: 4,
      clues: [
        'June sits beside Sol.',
        'Nia sits somewhere clockwise of Mara.',
        'Nia sits opposite Ivo.',
        'Ivo sits beside Mara.',
        'Nia has seat 3.',
        'Nia sits somewhere clockwise of Sol.',
        'June sits immediately clockwise of Ivo.'
      ]
    },
    {
      eyebrow: 'SECOND SERVICE / 12:06',
      title: 'The photograph changes',
      story: 'A fresh photograph develops on the wall. Everyone is in a different place, although nobody stood up. The host quietly replaces the seating card.',
      after: 'In the new photograph, there are six shadows. Only five people are visible. The host folds the picture before anyone else can count.',
      answer: { Mara: 3, Ivo: 1, June: 5, Sol: 2, Nia: 4 },
      lie: 1,
      clues: [
        'Mara sits somewhere clockwise of Ivo.',
        'Nia sits opposite Sol.',
        'June has seat 5.',
        'Ivo sits opposite Nia.',
        'Mara sits immediately clockwise of Sol.',
        'Sol sits beside Mara.',
        'Nia sits somewhere clockwise of Ivo.'
      ]
    },
    {
      eyebrow: 'THIRD SERVICE / 12:11',
      title: 'Someone is being counted',
      story: 'The music is still cheerful. The attendance board reads SIX PRESENT. On the table are five warm cups and one untouched cup that has begun to steam.',
      after: 'You cross out the false line. Under the ink, the paper has been printed with your name. The host says, “That must be a clerical error.”',
      answer: { Mara: 4, Ivo: 5, June: 1, Sol: 3, Nia: 2 },
      lie: 5,
      clues: [
        'Sol sits immediately clockwise of Nia.',
        'Mara sits beside Ivo.',
        'Nia sits somewhere clockwise of June.',
        'Sol sits beside Nia.',
        'Ivo sits somewhere clockwise of Nia.',
        'Ivo sits immediately clockwise of Nia.',
        'June sits opposite Mara.'
      ]
    },
    {
      eyebrow: 'FINAL SERVICE / 12:00',
      title: 'The invitation is addressed to you',
      story: 'The clock returns to noon. A sixth cup now bears your fingerprints. The host asks you to arrange the table one last time and trust the printed instructions.',
      after: 'The host reads the guest list again: Mara. Ivo. June. Sol. Nia. You. The empty chair was never waiting for someone else. You leave the false instruction on the table and walk out into the noon light.',
      answer: { Mara: 2, Ivo: 4, June: 5, Sol: 1, Nia: 3 },
      lie: 2,
      clues: [
        'Ivo sits opposite Sol.',
        'Ivo sits beside Nia.',
        'Sol has seat 5.',
        'June sits beside Ivo.',
        'Nia sits beside Mara.',
        'Ivo sits somewhere clockwise of Sol.',
        'June has seat 5.'
      ]
    }
  ];

  function parseClue(line) {
    let m = line.match(/^(\w+) has seat (\d)\.$/);
    if (m) return { type: 'seat', a: m[1], n: Number(m[2]) };
    m = line.match(/^(\w+) sits (beside|opposite|immediately clockwise of|somewhere clockwise of) (\w+)\.$/);
    if (m) return { type: m[2], a: m[1], b: m[3] };
    throw new Error('Unrecognized clue: ' + line);
  }

  function trueFor(clue, positions) {
    const c = typeof clue === 'string' ? parseClue(clue) : clue;
    const a = positions[c.a];
    if (!Number.isInteger(a)) return false;
    if (c.type === 'seat') return a === c.n;
    const b = positions[c.b];
    if (!Number.isInteger(b)) return false;
    const delta = (a - b + 6) % 6;
    if (c.type === 'beside') return delta === 1 || delta === 5;
    if (c.type === 'opposite') return delta === 3;
    if (c.type === 'immediately clockwise of') return delta === 1;
    if (c.type === 'somewhere clockwise of') return a > b;
    throw new Error('Unknown clue type');
  }

  function permutations(items) {
    if (items.length === 0) return [[]];
    return items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [item, ...rest]));
  }

  function solutions(round) {
    const found = [];
    for (const seats of permutations([1, 2, 3, 4, 5])) {
      const positions = Object.fromEntries(guests.map((name, i) => [name, seats[i]]));
      const falseLines = round.clues.map((line, i) => !trueFor(line, positions) ? i : -1).filter(i => i >= 0);
      if (falseLines.length === 1) found.push({ positions, lie: falseLines[0] });
    }
    return found;
  }

  root.EmptyPlacePuzzle = { guests, rounds, parseClue, trueFor, solutions };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.EmptyPlacePuzzle;
})(typeof globalThis !== 'undefined' ? globalThis : this);
