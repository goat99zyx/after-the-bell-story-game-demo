(function () {
  'use strict';
  const { guests, rounds, trueFor } = window.EmptyPlacePuzzle;
  const $ = id => document.getElementById(id);
  const seatPoints = [
    [50, 8], [86, 28], [86, 72], [50, 92], [14, 72], [14, 28]
  ];
  const saveKey = 'the-empty-place-v1';
  let roundIndex = 0;
  let placements = {};
  let chosenGuest = null;
  let chosenLie = null;
  let attempts = 0;
  let hintsUsed = 0;
  let modalAction = null;

  function save() {
    try { localStorage.setItem(saveKey, JSON.stringify({ roundIndex })); } catch (_) {}
  }
  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(saveKey) || '{}');
      if (Number.isInteger(data.roundIndex) && data.roundIndex >= 0 && data.roundIndex <= rounds.length) roundIndex = data.roundIndex;
    } catch (_) {}
  }
  function setStatus(message, error) {
    $('status').textContent = message;
    $('status').classList.toggle('error', !!error);
  }
  function openModal(kicker, title, copy, button, action) {
    $('modal-kicker').textContent = kicker;
    $('modal-title').textContent = title;
    $('modal-copy').textContent = copy;
    $('modal-action').textContent = button;
    modalAction = action;
    $('modal').classList.add('is-open');
    $('modal').setAttribute('aria-hidden', 'false');
    $('modal-action').focus();
  }
  function closeModal() {
    $('modal').classList.remove('is-open');
    $('modal').setAttribute('aria-hidden', 'true');
    modalAction = null;
    $('check-btn').focus();
  }
  function atSeat(seat) {
    return Object.keys(placements).find(name => placements[name] === seat) || null;
  }
  function renderSeats() {
    const holder = $('seats');
    holder.replaceChildren();
    seatPoints.forEach(([x, y], seat) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'seat' + (seat === 0 ? ' is-empty' : '') + (atSeat(seat) ? ' has-guest' : '');
      button.style.left = x + '%';
      button.style.top = y + '%';
      const name = seat === 0 ? 'EMPTY' : (atSeat(seat) || 'PLACE');
      button.innerHTML = '<span class="seat-number">SEAT ' + seat + '</span><span class="seat-name"></span>';
      button.querySelector('.seat-name').textContent = name;
      button.setAttribute('aria-label', 'Seat ' + seat + ', ' + name.toLowerCase() + (seat ? '. Select to place or remove guest.' : '. Reserved and cannot be filled.'));
      button.disabled = seat === 0;
      if (seat !== 0) button.addEventListener('click', () => chooseSeat(seat));
      holder.append(button);
    });
  }
  function renderGuests() {
    const holder = $('guest-bank');
    holder.replaceChildren();
    guests.forEach(name => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'guest' + (chosenGuest === name ? ' is-selected' : '') + (placements[name] ? ' is-placed' : '');
      button.textContent = name;
      button.setAttribute('aria-pressed', chosenGuest === name ? 'true' : 'false');
      button.setAttribute('aria-label', name + (placements[name] ? ', currently seat ' + placements[name] : ', not seated'));
      button.addEventListener('click', () => {
        chosenGuest = chosenGuest === name ? null : name;
        renderGuests();
        setStatus(chosenGuest ? 'Now choose a numbered seat for ' + chosenGuest + '.' : 'Guest selection cleared.');
      });
      holder.append(button);
    });
  }
  function chooseSeat(seat) {
    const occupant = atSeat(seat);
    if (!chosenGuest) {
      if (occupant) {
        delete placements[occupant];
        setStatus(occupant + ' returned to the guest cards.');
      } else setStatus('Select a guest card first.', true);
    } else {
      if (occupant && occupant !== chosenGuest) delete placements[occupant];
      placements[chosenGuest] = seat;
      setStatus(chosenGuest + ' is seated at place ' + seat + '.');
      chosenGuest = null;
    }
    renderSeats();
    renderGuests();
  }
  function renderClues() {
    const holder = $('clue-list');
    holder.replaceChildren();
    rounds[roundIndex].clues.forEach((line, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'clue' + (chosenLie === i ? ' is-lie' : '');
      button.setAttribute('aria-pressed', chosenLie === i ? 'true' : 'false');
      const number = document.createElement('span');
      number.className = 'clue-index';
      number.textContent = String(i + 1).padStart(2, '0');
      const copy = document.createElement('span');
      copy.textContent = line;
      const mark = document.createElement('span');
      mark.className = 'clue-mark';
      mark.textContent = chosenLie === i ? 'FALSE' : '○';
      button.append(number, copy, mark);
      button.addEventListener('click', () => {
        chosenLie = chosenLie === i ? null : i;
        renderClues();
        setStatus(chosenLie === null ? 'No line marked yet.' : 'Line ' + (chosenLie + 1) + ' marked as false.');
      });
      holder.append(button);
    });
  }
  function renderRound() {
    placements = {};
    chosenGuest = null;
    chosenLie = null;
    attempts = 0;
    hintsUsed = 0;
    if (roundIndex >= rounds.length) { showEnding(); return; }
    const round = rounds[roundIndex];
    $('round-count').textContent = 'SERVICE ' + (roundIndex + 1) + ' / ' + rounds.length;
    $('progress-fill').style.width = ((roundIndex + 1) / rounds.length * 100) + '%';
    $('eyebrow').textContent = round.eyebrow;
    $('story').textContent = round.story;
    renderSeats();
    renderGuests();
    renderClues();
    $('hint-copy').textContent = '';
    $('hint-btn').disabled = false;
    $('hint-btn').textContent = 'Need a hint?';
    setStatus('The host is waiting.');
    save();
  }
  function check() {
    if (roundIndex >= rounds.length) return;
    if (Object.keys(placements).length !== guests.length) { setStatus('Every guest needs a numbered seat.', true); return; }
    if (chosenLie === null) { setStatus('Mark the one line you believe is false.', true); return; }
    const round = rounds[roundIndex];
    const flags = round.clues.map(line => trueFor(line, placements));
    const falseCount = flags.filter(value => !value).length;
    if (falseCount === 1 && !flags[chosenLie]) {
      openModal('SERVICE COMPLETE / ' + String(roundIndex + 1).padStart(2, '0'),
        roundIndex === rounds.length - 1 ? 'You found the way out.' : 'The table is correct.',
        round.after,
        roundIndex === rounds.length - 1 ? 'Finish the story →' : 'Next service →',
        () => { roundIndex++; closeModal(); renderRound(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      return;
    }
    attempts++;
    if (falseCount === 0) setStatus('Every printed line is true here. Exactly one must be false.', true);
    else if (falseCount > 1) setStatus(falseCount + ' lines are false at this table. Only one may lie.', true);
    else setStatus('One line is false, but you marked another. Recheck your choice.', true);
    if (attempts >= 3) $('status').textContent += ' Try a different seat for the guest named in your marked line.';
  }
  function showEnding() {
    $('round-count').textContent = 'SERVICE COMPLETE';
    $('progress-fill').style.width = '100%';
    $('eyebrow').textContent = 'THE DOOR IS OPEN';
    $('story').textContent = 'You kept one chair empty, and now you can leave it behind.';
    openModal('THE END / NOON AGAIN', 'A place for you, if you choose it.',
      'The host never wanted a guest. It wanted someone willing to believe the card over their own eyes. You found the lie. Outside, ordinary sunlight feels new.',
      'Play again ↺',
      () => { roundIndex = 0; closeModal(); renderRound(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  $('check-btn').addEventListener('click', check);
  $('hint-btn').addEventListener('click', () => {
    const anchors = [['Ivo', 'Mara'], ['June', 'Sol'], ['June', 'Nia'], ['Nia', 'Sol']][roundIndex];
    if (!anchors || hintsUsed >= anchors.length) return;
    const name = anchors[hintsUsed++];
    const seat = rounds[roundIndex].answer[name];
    const nextHint = 'The photograph confirms: ' + name + ' is at seat ' + seat + '.';
    $('hint-copy').textContent = ($('hint-copy').textContent ? $('hint-copy').textContent + ' ' : '') + nextHint;
    $('hint-btn').textContent = hintsUsed < anchors.length ? 'Another hint?' : 'All hints shown';
    $('hint-btn').disabled = hintsUsed >= anchors.length;
  });
  $('clear-btn').addEventListener('click', () => { placements = {}; chosenGuest = null; renderSeats(); renderGuests(); setStatus('The table is clear.'); });
  $('help-btn').addEventListener('click', () => openModal('HOW TO PLAY', 'One false line.',
    'Seat 0 is fixed at the top. Seats 1–5 continue clockwise. Select a guest card, then a seat. Selecting an occupied seat with no guest selected removes that guest.\n\n“Beside” means the seats touch, even across seat 0. “Opposite” is three seats away. “Immediately clockwise” means the next seat. “Somewhere clockwise” means a higher seat number. Exactly one printed line is false. Mark it before checking.',
    'Return to table →', closeModal));
  $('modal-action').addEventListener('click', () => { if (modalAction) modalAction(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && roundIndex < rounds.length && $('modal').classList.contains('is-open')) closeModal(); });
  restore();
  renderRound();
  if (roundIndex === 0) $('help-btn').click();
})();
