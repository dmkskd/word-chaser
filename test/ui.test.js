import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

async function page(storage = new Map(), showOpening = false, reducedMotion = true, search = '') {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const {window, document} = parseHTML(html);
  window.location = {search, href: 'https://example.test/' + search};
  // The DOM test does not simulate pixels, sound, or native focus/camera animation.
  window.matchMedia = () => ({matches: reducedMotion});
  for (const element of document.querySelectorAll('*')) element.focus = () => {};
  const create = document.createElement.bind(document);
  document.createElement = (...args) => {
    const element = create(...args); element.focus = () => {};
    if (args[0] === 'canvas') element.getContext = () => ({setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillRect() {}, createRadialGradient() { return {addColorStop() {}}; }});
    return element;
  };
  for (const dialog of document.querySelectorAll('dialog')) { dialog.showModal = () => dialog.setAttribute('open', ''); dialog.close = () => dialog.removeAttribute('open'); }
  let timerId = 0; const timers = new Map(), timerDelays = new Map();
  const context = vm.createContext({window, document, console, URL, URLSearchParams, setTimeout: (fn, delay) => { timers.set(++timerId, fn); timerDelays.set(timerId, delay); return timerId; }, clearTimeout: id => timers.delete(id), localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)}});
  vm.runInContext(await readFile(new URL('../assets/europe-map.js', import.meta.url), 'utf8'), context);
  vm.runInContext(await readFile(new URL('../assets/app.js', import.meta.url), 'utf8'), context);
  const click = selector => { const element = document.querySelector(selector); assert(element, `Missing ${selector}`); if (typeof element.click === 'function') element.click(); else element.dispatchEvent(new window.Event('click', {bubbles: true})); };
  if (!showOpening && document.getElementById('story-dialog').hasAttribute('open')) click('#story-start');
  function searchTicks(count) {
    for (let i = 0; i < count; i++) {
      const scheduled = [...timers].find(([id]) => timerDelays.get(id) === 1000);
      if (!scheduled) return;
      timers.delete(scheduled[0]); scheduled[1]();
    }
  }
  return {document, click, timers, context, searchTicks, event: type => new window.Event(type, {bubbles: true})};
}

function chooseWord(document, id) {
  const browser = document.getElementById('case-browser');
  if (!browser.hidden) document.getElementById('close-browser').click();
  document.getElementById('browse-cases').click();
  const word = document.querySelector(`[data-case-id="${id}"]`);
  assert(word, `Missing word ${id}`); word.click();
}

test('built page runs the treasure investigation via evidence objects and graph leads', async () => {
  const {document, click} = await page();
  assert.equal(document.querySelectorAll('[data-case-id]').length, 36);
  assert.equal(document.getElementById('map-cue').hidden, true);
  assert(document.querySelector('[data-node-id="treasure-1"]'));
  click('[data-node-id="treasure-1"]');
  assert.equal(document.getElementById('evidence-form').textContent, 'tresour');
  assert.equal(document.getElementById('evidence-panel').hidden, false);
  assert.equal(document.querySelectorAll('.notebook-entry').length, 1, 'Inspection alone does not advance.');
  click('#challenge-answers button');assert(document.getElementById('evidence-panel').hidden);
  assert.equal(document.querySelectorAll('.notebook-entry').length, 2);
  for (const id of ['treasure-2', 'treasure-italian', 'treasure-german']) assert(document.querySelector(`[data-node-id="${id}"]`));
  click('[data-node-id="treasure-german"]');
  assert.equal(document.getElementById('evidence-form').textContent, 'Schatz');
  assert(!document.getElementById('theory-question').hidden);
  click('#challenge-answers button:nth-child(2)');assert(document.getElementById('evidence-panel').hidden);
  click('[data-node-id="treasure-italian"]');click('#challenge-answers button');assert(document.getElementById('evidence-panel').hidden);
  click('[data-node-id="treasure-3"]');click('#challenge-answers button');assert(document.getElementById('evidence-panel').hidden);
  assert.equal(document.getElementById('complete').hidden, true, 'French evidence is still outstanding.');
  assert(document.getElementById('map-solved-stamp').hidden);
  click('[data-node-id="treasure-1"]');
  click('[data-node-id="treasure-2"]');click('#challenge-answers button');assert(document.getElementById('evidence-panel').hidden);
  assert.equal(document.getElementById('complete').hidden, false);
  assert(!document.getElementById('map-solved-stamp').hidden);
  assert(document.querySelector('.graph-edge.dotted.reviewed'));
  assert(document.querySelector('.graph-edge.dashed.reviewed'));
  click('#restart');
  assert(document.getElementById('map-solved-stamp').hidden, 'Restart removes the solved stamp.');
});

test('hints are explicit and temporary, and the catalog is searchable', async () => {
  const {document, click, timers, event} = await page();
  assert(document.getElementById('map-cue').hidden);
  click('#help'); assert(!document.getElementById('map-cue').hidden);
  assert(document.getElementById('map-cue').textContent.includes('manuscript'));
  for (const fn of [...timers.values()]) fn();
  assert(document.getElementById('map-cue').hidden);
  const search = document.getElementById('case-search'); search.value = 'Greek'; search.dispatchEvent(event('input'));
  assert.equal(document.querySelectorAll('[data-case-id]').length, 5);
  search.value = 'does-not-exist'; search.dispatchEvent(event('input'));
  assert.equal(document.querySelectorAll('[data-case-id]').length, 0);
  assert(document.getElementById('case-search-status').textContent.includes('No mysteries'));
});

test('one answer records a clue and rewards progress; wrong theories can be revised', async () => {
  const {document, click} = await page();
  assert.equal(document.querySelectorAll('.graph-edge').length, 0, 'No line points to the correct answer before a theory is tested.');
  click('[data-node-id="treasure-1"]');
  assert(document.getElementById('full-evidence').hidden);
  assert(document.getElementById('reveal-page').hidden);
  click('#challenge-answers button');
  assert(document.getElementById('evidence-panel').hidden, 'No Continue click is needed.');
  assert(document.getElementById('detective-points').textContent.includes('3'));
  assert.equal(document.getElementById('progress-label').textContent, '2 of 4 main clues connected');
  click('[data-node-id="treasure-german"]');
  click('#challenge-answers button');
  assert(!document.getElementById('evidence-panel').hidden);
  assert(document.getElementById('answer-feedback').textContent.includes('try again'));
  assert(document.getElementById('detective-points').textContent.includes('2'));
  click('#challenge-answers button:nth-child(2)');
  assert(document.getElementById('evidence-panel').hidden);
  assert(document.getElementById('map-cue').textContent.includes('Good catch'));
  assert(document.getElementById('detective-points').textContent.includes('3'));
  assert(document.querySelector('[data-node-id="treasure-2"]'), 'The other leads stay available after a false lead.');
});

test('the glass reveals a word without opening a card, and moving away dismisses the peek', async () => {
  const {document, event} = await page();
  const svg = document.getElementById('map');
  svg.getBoundingClientRect = () => ({left: 0, top: 0, width: 900, height: 650});
  const move = (x, y) => { const e = event('pointermove'); e.clientX = x; e.clientY = y; e.pointerType = 'mouse'; svg.dispatchEvent(e); };
  move(322, 246);
  assert(!document.getElementById('word-peek').hidden);
  assert.equal(document.getElementById('peek-word').textContent, 'tresour');
  assert(document.getElementById('evidence-panel').hidden);
  assert.equal(document.querySelectorAll('.notebook-entry').length, 1);
  move(800, 100);
  assert(document.getElementById('word-peek').hidden);
});

test('clue reveals are short authored pages and switching cases does not leave a stale peek', async () => {
  const {document, click, event} = await page();
  click('[data-node-id="treasure-1"]');click('#reveal-clue');
  assert(!document.getElementById('reveal-page').hidden);
  assert.equal(document.getElementById('reveal-count').textContent, 'CLUE 1 OF 2');
  assert(document.getElementById('full-evidence').hidden);
  click('#challenge-answers button');
  assert(document.getElementById('detective-points').textContent.includes('1'));
  chooseWord(document, 'window');
  assert.equal(document.getElementById('word-title').textContent, 'window');
  assert(document.querySelector('[data-node-id="window-french"]'));
  assert(document.querySelector('[data-node-id="window-italian"]'));
  assert(document.querySelector('[data-node-id="window-1"]'));
});

test('iPad-style touch dragging peeks, and a single answer completes the decision', async () => {
  const {document, click, event} = await page();
  const svg = document.getElementById('map');
  svg.getBoundingClientRect = () => ({left: 0, top: 0, width: 900, height: 650});
  function touch(type, x, y) { const e = event(type); e.pointerType = 'touch'; e.pointerId = 1; e.clientX = x; e.clientY = y; svg.dispatchEvent(e); }
  touch('pointerdown', 310, 430);touch('pointermove', 322, 246);
  assert.equal(document.getElementById('peek-word').textContent, 'tresour');
  assert(!document.getElementById('word-peek').hidden);
  touch('pointerup', 322, 246);
  assert(document.getElementById('evidence-panel').hidden, 'Lifting a drag does not open an unwanted card.');
  touch('pointerdown', 322, 246);touch('pointerup', 322, 246);
  assert(!document.getElementById('evidence-panel').hidden);
  click('#challenge-answers button');
  assert(document.getElementById('evidence-panel').hidden);
  assert.equal(document.querySelectorAll('.notebook-entry').length, 2);
  assert.equal(document.getElementById('detective-points').textContent, '⭐ 3 points');
  assert.equal(document.querySelector('#follow-evidence'), null, 'There is no second Continue control.');
});

test('clue pictures keep their decision badges, and Greek remains visible after a detour', async () => {
  const {document, click, event} = await page();
  let clue = document.querySelector('[data-node-id="treasure-1"]');
  assert.equal(clue.querySelector('.artifact-icon').textContent, '📜');
  assert.equal(clue.querySelector('.decision-mark').textContent, '?');
  assert(!document.body.textContent.includes('Decision needed'));
  click('[data-node-id="treasure-1"]');click('#challenge-answers button');
  click('[data-node-id="treasure-german"]');click('#challenge-answers button:nth-child(2)');
  clue = document.querySelector('[data-node-id="treasure-german"]');
  assert.equal(clue.querySelector('.artifact-icon').textContent, '📖');
  assert.equal(clue.querySelector('.decision-mark').textContent, '✕');
  assert(clue.textContent.includes('Not our trail'));
  chooseWord(document, 'dinosaur');
  click('[data-node-id="dinosaur-1"]');click('#challenge-answers button');
  click('[data-node-id="dinosaur-french"]');click('#challenge-answers button');
  assert(document.querySelector('[data-node-id="dinosaur-2"]'));
  assert(!document.body.textContent.includes('Ruled out'));
});

test('the Arabic source at the map edge is reachable with the magnifying glass', async () => {
  const {document, click, event} = await page();
  chooseWord(document, 'algebra');
  click('[data-node-id="algebra-latin"]'); click('#challenge-answers button');
  const svg = document.getElementById('map');
  svg.getBoundingClientRect = () => ({left: 0, top: 0, width: 900, height: 650});
  const move = event('pointermove'); move.clientX = 849; move.clientY = 610; move.pointerType = 'mouse'; svg.dispatchEvent(move);
  assert.equal(document.getElementById('peek-word').textContent, 'al-jabr · الجبر');
  assert(!document.getElementById('word-peek').hidden);
  assert.equal(document.querySelector('[data-node-id="algebra-arabic"] .artifact-title').getAttribute('text-anchor'), 'end');
  click('[data-node-id="algebra-arabic"]'); click('#challenge-answers button');
  assert(!document.getElementById('complete').hidden);
});

test('only the active word survives reload; switching words discards the previous attempt', async () => {
  const storage = new Map([['word-chaser-graph-v2', '{"treasure":{}}']]);
  let ui = await page(storage);
  ui.click('[data-node-id="treasure-1"]'); ui.click('#challenge-answers button');
  ui = await page(storage);
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 2, 'Reload keeps the current case.');
  assert(ui.document.getElementById('detective-points').textContent.includes('3'));
  chooseWord(ui.document, 'maths');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1);
  assert.equal(JSON.parse(storage.get('word-chaser-current-v1')).caseId, 'maths');
  ui = await page(storage);
  assert.equal(ui.document.getElementById('word-title').textContent, 'maths');
  chooseWord(ui.document, 'treasure');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1, 'Returning to a different word starts fresh.');
  assert(ui.document.getElementById('detective-points').textContent.includes('0'));
  assert(!storage.has('word-chaser-graph-v2'));
});

test('confirmed algebra trails show both the spatial route and the jump in time', async () => {
  const {document, click, event} = await page();
  chooseWord(document, 'algebra');
  assert.equal(document.querySelectorAll('.trail-time').length, 0, 'Unsolved routes remain hidden.');
  click('[data-node-id="algebra-latin"]'); click('#challenge-answers button');
  assert(document.querySelector('#trails').textContent.includes('Today → 1100s'));
  click('[data-node-id="algebra-arabic"]'); click('#challenge-answers button');
  assert(document.querySelector('#trails').textContent.includes('1100s → around 820'));
});

test('the opening mission appears once and can be replayed without resetting a case', async () => {
  const storage = new Map();
  let ui = await page(storage, true);
  assert(ui.document.getElementById('story-dialog').hasAttribute('open'));
  assert(ui.document.getElementById('story-title').textContent.includes('Everyone has lost'));
  ui.click('#story-start');
  assert(!ui.document.getElementById('story-dialog').hasAttribute('open'));
  ui.click('[data-node-id="treasure-1"]'); ui.click('#challenge-answers button');
  ui.click('#story-open');
  assert(ui.document.getElementById('story-dialog').hasAttribute('open'));
  ui.click('#story-start');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 2);
  ui = await page(storage, true);
  assert(!ui.document.getElementById('story-dialog').hasAttribute('open'), 'Reload resumes play without repeating the opening.');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 2);
});

test('solving a case celebrates briefly; reload and case switching do not replay fireworks', async () => {
  const storage = new Map();
  const ui = await page(storage, false, false);
  chooseWord(ui.document, 'house');
  ui.click('[data-node-id="house-italian"]'); ui.click('#challenge-answers button:nth-child(2)');
  assert(ui.document.getElementById('map-fireworks').hidden, 'A single rejected lead is not case completion.');
  ui.click('[data-node-id="house-old"]'); ui.click('#challenge-answers button');
  assert(!ui.document.getElementById('map-fireworks').hidden);
  assert(ui.document.querySelector('#map-fireworks canvas'), 'The particle renderer is mounted.');
  const reload = await page(storage, false, false);
  assert(!reload.document.getElementById('map-solved-stamp').hidden);
  assert(reload.document.getElementById('map-fireworks').hidden, 'Restoring a solved case does not replay fireworks.');
  for (const fn of [...ui.timers.values()]) fn();
  assert(ui.document.getElementById('map-fireworks').hidden);
  assert(!ui.document.getElementById('map-solved-stamp').hidden, 'The stamp remains after the sparks fade.');
  ui.click('#restart');
  ui.click('[data-node-id="house-old"]'); ui.click('#challenge-answers button');
  assert(!ui.document.getElementById('map-fireworks').hidden);
  chooseWord(ui.document, 'monday');
  assert(ui.document.getElementById('map-fireworks').hidden);
  assert.equal(ui.document.querySelectorAll('#map-fireworks canvas').length, 0);
});

test('reduced motion keeps the solved stamp without fireworks', async () => {
  const {document, click, event} = await page();
  chooseWord(document, 'house');
  click('[data-node-id="house-old"]'); click('#challenge-answers button');
  assert(!document.getElementById('map-solved-stamp').hidden);
  assert(document.getElementById('map-fireworks').hidden);
});

function inspectHidden(ui, x, y) {
  ui.click('#zoom-reset');
  const svg = ui.document.getElementById('map');
  svg.getBoundingClientRect = () => ({left: 0, top: 0, width: 900, height: 650});
  const move = ui.event('pointermove');
  Object.assign(move, {pointerType: 'mouse', clientX: x, clientY: y});
  svg.dispatchEvent(move);
  const enter = ui.event('keydown'); enter.key = 'Enter'; svg.dispatchEvent(enter);
}

test('Investigator shows the starting word and reveals hidden words only under the glass', async () => {
  const ui = await page();
  inspectHidden(ui, 322, 246); ui.click('#challenge-answers button');
  ui.click('[data-mode-id="investigator"]');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1, 'Changing mode starts a fresh attempt.');
  assert.equal(ui.document.querySelectorAll('#pins [data-node-id]').length, 1);
  assert.equal(ui.document.querySelector('#pins .artifact-title').textContent, 'treasure');
  assert(ui.document.querySelector('[data-node-id="treasure-0"] .artifact-icon'));
  assert.equal(ui.document.querySelector('[data-node-id="treasure-0"] .decision-mark').textContent, '✓');
  assert.equal(ui.document.querySelector('[data-node-id="treasure-1"]'), null);
  assert.equal(ui.document.querySelector('[data-hover-node-id="treasure-1"]'), null);
  assert(ui.document.getElementById('help').hidden);
  assert(ui.document.querySelector('.next-leads').hidden);
  assert(ui.document.querySelector('.time-machine').hidden);
  const svg = ui.document.getElementById('map'); svg.getBoundingClientRect = () => ({left: 0, top: 0, width: 900, height: 650});
  const move = ui.event('pointermove'); move.pointerType = 'mouse'; move.clientX = 322; move.clientY = 246; svg.dispatchEvent(move);
  assert(!ui.document.getElementById('word-peek').hidden);
  assert.equal(ui.document.getElementById('peek-word').textContent, 'tresour');
  const revealed = ui.document.querySelector('[data-hover-node-id="treasure-1"]');
  assert(revealed.querySelector('.artifact-disc'));
  assert.equal(revealed.querySelector('.artifact-icon').textContent, '📜');
  assert.equal(revealed.querySelector('.decision-mark').textContent, '?');
  assert.equal(revealed.querySelector('.artifact-era'), null);
  assert(ui.document.getElementById('peek-language').hidden);
  assert(ui.document.getElementById('peek-meaning').hidden);
  const away = ui.event('pointermove'); away.pointerType = 'mouse'; away.clientX = 100; away.clientY = 100; svg.dispatchEvent(away);
  assert(ui.document.getElementById('word-peek').hidden);
  assert.equal(ui.document.querySelector('[data-hover-node-id]'), null);
  const hint = ui.event('keydown'); hint.key = 'h'; svg.dispatchEvent(hint);
  assert(ui.document.getElementById('map-cue').hidden, 'H cannot reveal a hint.');
  inspectHidden(ui, 322, 246);
  assert.equal(ui.document.getElementById('evidence-form').textContent, 'tresour');
  for (const id of ['evidence-meta', 'evidence-meaning', 'reveal-clue', 'reveal-page', 'full-evidence']) assert(ui.document.getElementById(id).hidden, id);
  ui.click('#reveal-clue'); assert(ui.document.getElementById('reveal-page').hidden);
  ui.click('#challenge-answers button');
  assert(ui.document.getElementById('detective-points').textContent.includes('3'));
  assert([...ui.document.querySelectorAll('.notebook-story')].every(story => story.hidden));
});

test('Investigator saves current progress but one wrong answer restarts the whole case', async () => {
  const storage = new Map(); let ui = await page(storage);
  ui.click('[data-mode-id="investigator"]');
  inspectHidden(ui, 322, 246); ui.click('#challenge-answers button');
  inspectHidden(ui, 450, 325); ui.click('#challenge-answers button:nth-child(2)');
  ui = await page(storage);
  assert.equal(ui.document.querySelector('[data-mode-id="investigator"]').getAttribute('aria-pressed'), 'true');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 3);
  assert(ui.document.getElementById('detective-points').textContent.includes('6'));
  assert(ui.document.querySelector('[data-node-id="treasure-1"] .artifact-icon'));
  assert(ui.document.querySelector('[data-node-id="treasure-german"] .artifact-icon'));
  assert.equal(ui.document.querySelector('[data-node-id="treasure-german"] .decision-mark').textContent, '✕');
  inspectHidden(ui, 362, 363); ui.click('#challenge-answers button:nth-child(2)');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1);
  assert(ui.document.getElementById('detective-points').textContent.includes('0'));
  assert(ui.document.getElementById('evidence-panel').hidden);
  assert.equal(ui.document.querySelectorAll('.graph-edge').length, 0);
  assert(ui.document.getElementById('map-solved-stamp').hidden);
  assert(ui.document.getElementById('map-cue').textContent.includes('Case restarted'));
  ui = await page(storage);
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1, 'The failed attempt is not restored.');
  assert.equal(JSON.parse(storage.get('word-chaser-current-v1')).modeId, 'investigator');
  ui.click('[data-mode-id="chaser"]');
  assert(!ui.document.getElementById('help').hidden);
  assert(ui.document.querySelector('#pins .artifact-icon'));
  inspectHidden(ui, 322, 246); ui.click('#challenge-answers button:nth-child(2)');
  assert(!ui.document.getElementById('evidence-panel').hidden, 'The normal mode still permits retrying a mistake.');
});

 test('Investigator still completes a case and unlocks the earned story', async () => {
  const ui = await page();
  ui.click('[data-mode-id="investigator"]');
  chooseWord(ui.document, 'house');
  assert.equal(ui.document.querySelector('[data-mode-id="investigator"]').getAttribute('aria-pressed'), 'true');
  inspectHidden(ui, 322, 246); ui.click('#challenge-answers button');
  assert(!ui.document.getElementById('map-solved-stamp').hidden);
  assert([...ui.document.querySelectorAll('.notebook-story')].every(story => !story.hidden));
  assert(!ui.document.getElementById('sources-open').hidden);
});


test('Investigator gives a location riddle only after 30 seconds of searching', async () => {
  const ui = await page();
  assert(ui.document.getElementById('search-timer').hidden);
  ui.click('[data-mode-id="investigator"]');
  const clock = ui.document.getElementById('search-timer');
  assert.equal(clock.textContent, 'Hint in 0:30');
  assert(!ui.document.getElementById('search-assist').hidden);
  assert(ui.document.querySelector('.map-tools #search-timer'));
  ui.searchTicks(29);
  assert.equal(clock.textContent, 'Hint in 0:01');
  assert(ui.document.getElementById('search-location-hint').hidden);
  ui.searchTicks(1);
  assert(ui.document.getElementById('search-location-hint').textContent.includes('Big Ben'));
  assert(!ui.document.getElementById('search-location-hint').hidden);
  assert.equal(clock.textContent, 'Hint in 0:30');
  ui.searchTicks(15);
  assert(!ui.document.getElementById('search-location-hint').hidden, 'The hint stays visible instead of expiring.');
  assert.equal(ui.document.querySelector('[data-node-id="treasure-1"]'), null, 'The nudge does not reveal a pin.');
  assert(ui.document.getElementById('detective-points').textContent.includes('0'));
  inspectHidden(ui, 322, 246);
  assert(clock.hidden, 'Answering a theory is not searching.');
  ui.searchTicks(90);
  assert(ui.document.getElementById('search-location-hint').hidden);
  ui.click('#challenge-answers button');
  assert.equal(clock.textContent, 'Hint in 0:30');
  assert(!clock.hidden);
  ui.searchTicks(30);
  ui.click('#restart');
  assert.equal(clock.textContent, 'Hint in 0:30');
  ui.click('[data-mode-id="chaser"]');
  ui.searchTicks(90);
  assert(clock.hidden);
  assert(ui.document.getElementById('search-location-hint').hidden);
});

test('search nudges pause for the story and stop on completion', async () => {
  const ui = await page();
  ui.click('[data-mode-id="investigator"]');
  ui.click('#story-open'); ui.searchTicks(60);
  assert.equal(ui.document.getElementById('search-timer').textContent, 'Hint in 0:30');
  assert(ui.document.getElementById('search-location-hint').hidden);
  ui.click('#story-start'); ui.searchTicks(1);
  assert.equal(ui.document.getElementById('search-timer').textContent, 'Hint in 0:29');
  chooseWord(ui.document, 'house');
  assert.equal(ui.document.getElementById('search-timer').textContent, 'Hint in 0:30');
  inspectHidden(ui, 322, 246); ui.click('#challenge-answers button');
  assert(ui.document.getElementById('search-timer').hidden);
  ui.searchTicks(90);
  assert(!ui.document.getElementById('map-solved-stamp').hidden);
  assert(!ui.document.getElementById('search-location-hint').textContent.includes('A little nudge'));
});


test('returning to a cached Investigator page resumes the search timer', async () => {
  const ui = await page();
  ui.click('[data-mode-id="investigator"]');
  ui.searchTicks(20);
  ui.context.window.dispatchEvent(ui.event('pagehide'));
  assert(ui.document.getElementById('search-timer').hidden);
  ui.context.window.dispatchEvent(ui.event('pageshow'));
  assert(!ui.document.getElementById('search-timer').hidden);
  ui.searchTicks(60);
  assert(!ui.document.getElementById('search-location-hint').hidden);
  assert(ui.document.getElementById('search-location-hint').textContent.includes('Big Ben'));
});


test('the compact toolbar keeps the word count by the chooser and explains mode choices', async () => {
  const ui = await page();
  assert(ui.document.querySelector('.word-choice #browse-cases'));
  assert(ui.document.querySelector('.word-choice #catalog-count'));
  assert.equal(ui.document.querySelector('label[for="case-select"]'), null);
  const choices = ui.document.querySelectorAll('#mode-options .mode-choice');
  assert.equal(choices.length, 2);
  for (const choice of choices) {
    assert(ui.document.getElementById(choice.getAttribute('aria-describedby')).textContent.length > 10);
  }
  assert.equal(choices[0].getAttribute('aria-pressed'), 'true');
  ui.click('[data-mode-id="investigator"]');
  assert.equal(choices[0].getAttribute('aria-pressed'), 'false');
  assert.equal(choices[1].getAttribute('aria-pressed'), 'true');
});


test('URL mode selection overrides saved mode safely and accepts the Word Chaser label', async () => {
  const storage = new Map(); let ui = await page(storage);
  ui.click('[data-node-id="treasure-1"]'); ui.click('#challenge-answers button');
  ui = await page(storage, false, true, '?mode=investigator');
  assert.equal(ui.document.querySelector('[data-mode-id="investigator"]').getAttribute('aria-pressed'), 'true');
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1, 'Guided progress cannot carry into advanced mode.');
  assert(!ui.document.getElementById('search-timer').hidden);
  ui = await page(storage, false, true, '?mode=word-chaser');
  assert.equal(ui.document.querySelector('[data-mode-id="chaser"]').getAttribute('aria-pressed'), 'true');
  ui = await page(storage, false, true, '?mode=unknown');
  assert.equal(ui.document.querySelector('[data-mode-id="chaser"]').getAttribute('aria-pressed'), 'true');
  chooseWord(ui.document, 'house');
  assert(ui.document.getElementById('browse-cases').title.startsWith('house — '));
});


test('evidence decisions stay outside the scrolling content and new cards reset their scroll', async () => {
  const {document, click} = await page();
  const content = document.getElementById('evidence-content');
  const panel = document.getElementById('evidence-panel');
  click('[data-node-id="treasure-1"]');
  const answers = document.getElementById('challenge-answers');
  assert.equal(answers.parentElement, panel, 'Decisions have their own non-scrolling area.');
  assert(!content.contains(answers));
  assert.equal(answers.getAttribute('aria-labelledby'), 'challenge-prompt');
  click('#reveal-clue');
  assert(!document.getElementById('reveal-page').hidden);
  assert.equal(answers.querySelectorAll('button').length, 2, 'Revealing help retains both decisions.');
  content.scrollTop = 180; panel.scrollTop = 90;
  click('#close-evidence');
  click('[data-node-id="treasure-german"]');
  assert.equal(content.scrollTop, 0);
  assert.equal(panel.scrollTop, 0);
  click('#challenge-answers button:nth-child(2)');
  assert(panel.hidden, 'A correct No still records the clue in one tap.');
});

test('town cases open locally, zoom deeper with readable markers and return to Europe without losing progress', async () => {
  const {document,click,event} = await page();
  chooseWord(document, 'manchester');
  const svg=document.getElementById('map');
  const view=()=>svg.getAttribute('viewBox').split(' ').map(Number);
  assert.equal(view()[2],170);
  assert.equal(document.querySelector('#word-title .active-segment').textContent,'chester');
  assert(!document.getElementById('zoom-local').hidden);
  const old=document.querySelector('[data-node-id="manchester-old"]');
  assert(old.getAttribute('transform').includes('scale('));
  assert(document.querySelector('.location-leader'),'Offset evidence is attached to its geographic anchor.');
  for(let i=0;i<8;i++) click('#zoom-in');
  assert.equal(view()[2],35,'Town zoom goes beyond the old 225-unit limit.');
  const move=event('keydown');move.key='ArrowRight';move.shiftKey=true;
  const before=view()[0];svg.dispatchEvent(move);assert(view()[0]>before,'Shift + arrows pan the close map.');
  click('#zoom-local');assert.equal(view()[2],170);
  click('[data-node-id="manchester-chest"]');
  assert.equal(document.querySelector('#part-context .active-segment').textContent,'chester');
  click('#challenge-answers button:nth-child(2)');
  assert.equal(document.querySelectorAll('.notebook-entry').length,2);
  click('#zoom-reset');assert.equal(view()[2],900);
  assert.equal(document.querySelectorAll('.notebook-entry').length,2);
  click('#zoom-local');click('[data-node-id="manchester-old"]');click('#challenge-answers button');
  click('[data-node-id="manchester-element"]');
  assert.equal(document.querySelector('#part-context .active-segment').textContent,'ceaster');
  click('#challenge-answers button');
  click('[data-node-id="manchester-latin"]');click('#challenge-answers button');
  assert(!document.getElementById('complete').hidden);
  assert(view()[2]>170,'Only the earned international connection expands the camera.');
});

test('Investigator town views keep hidden clues and leaders out of the map until discovered', async () => {
  const {document,click,event}=await page();click('[data-mode-id="investigator"]');
  chooseWord(document, 'grimsby');
  assert.equal(document.querySelectorAll('[data-node-id]').length,1);
  assert.equal(document.querySelectorAll('.location-leader').length,0);
  const svg=document.getElementById('map');const before=svg.getAttribute('viewBox');
  click('#zoom-reset');click('#zoom-local');assert.equal(svg.getAttribute('viewBox'),before);
  assert.equal(document.querySelectorAll('[data-node-id]').length,1);
  assert(document.getElementById('search-timer').textContent.includes('0:30'));
});

test('two-finger panning moves the close map without answering or revealing a hidden location', async () => {
  const {document,click,event}=await page();
  chooseWord(document, 'grimsby');
  const svg=document.getElementById('map');svg.getBoundingClientRect=()=>({left:0,top:0,width:900,height:650});
  const view=()=>svg.getAttribute('viewBox').split(' ').map(Number), before=view();
  const touch=(type,id,x,y)=>{const e=event(type);Object.assign(e,{pointerType:'touch',pointerId:id,clientX:x,clientY:y});svg.dispatchEvent(e);};
  touch('pointerdown',1,400,300);touch('pointerdown',2,600,300);
  touch('pointermove',1,430,300);touch('pointermove',2,630,300);
  touch('pointerup',1,430,300);touch('pointerup',2,630,300);
  assert(view()[0]<before[0]);
  assert(Math.abs(view()[2]-before[2])<1e-6,'A parallel two-finger drag pans without changing the final zoom.');
  assert(document.getElementById('evidence-panel').hidden);
  assert.equal(document.querySelectorAll('.notebook-entry').length,1);
});

test('autocomplete opens after two letters and selects a word directly without a second control', async () => {
  const {document,event,click}=await page();
  const search=document.getElementById('case-search'), panel=document.getElementById('case-browser');
  assert.equal(document.querySelector('select#case-select'),null,'The native long dropdown is removed.');
  search.value='g';search.dispatchEvent(event('input'));assert(panel.hidden);
  search.value='ge';search.dispatchEvent(event('input'));assert(!panel.hidden);
  assert.deepEqual([...document.querySelectorAll('[data-case-id]')].map(el=>el.dataset.caseId),['geometry','geography']);
  assert.equal(search.getAttribute('aria-expanded'),'true');
  search.value='geo';search.dispatchEvent(event('input'));
  click('[data-case-id="geography"]');
  assert(panel.hidden);assert.equal(search.value,'');
  assert.equal(document.getElementById('word-title').textContent,'geography');
  assert(document.getElementById('current-word').textContent.includes('geography'));
  assert.equal(document.querySelectorAll('.notebook-entry').length,1);
});

test('browse all groups weekdays and place names without changing the active investigation', async () => {
  const {document,click,event}=await page();
  click('[data-node-id="treasure-1"]');click('#challenge-answers button');
  const points=document.getElementById('detective-points').textContent;
  click('#browse-cases');
  const week=document.querySelector('[data-collection-id="weekdays"]');
  assert.deepEqual([...week.querySelectorAll('.case-name')].map(el=>el.textContent),['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']);
  const towns=document.querySelector('[data-collection-id="places"]');
  assert.deepEqual([...towns.querySelectorAll('.case-name')].map(el=>el.textContent),['Grimsby','Manchester']);
  assert.equal(document.querySelectorAll('[data-case-id]').length,36);
  assert.equal(document.querySelector('[data-case-id="treasure"]').getAttribute('aria-current'),'true');
  const escape=event('keydown');escape.key='Escape';document.getElementById('browse-cases').dispatchEvent(escape);
  assert(document.getElementById('case-browser').hidden);
  assert.equal(document.getElementById('detective-points').textContent,points);
  assert.equal(document.querySelectorAll('.notebook-entry').length,2);
});

test('search handles no matches, keyboard selection and dismissal before switching cases', async () => {
  const {document,click,event}=await page();
  const search=document.getElementById('case-search'),panel=document.getElementById('case-browser');
  search.value='zzzz';search.dispatchEvent(event('input'));
  assert(!panel.hidden);assert.equal(document.querySelectorAll('[data-case-id]').length,0);
  assert(document.getElementById('case-search-status').textContent.includes('No mysteries'));
  click('#browse-cases');assert.equal(document.querySelectorAll('[data-case-id]').length,36);
  search.value='geo';search.dispatchEvent(event('input'));
  const enter=event('keydown');enter.key='Enter';search.dispatchEvent(enter);
  assert.equal(document.getElementById('word-title').textContent,'geometry');assert(panel.hidden);
  search.value='ma';search.dispatchEvent(event('input'));assert(!panel.hidden);
  document.getElementById('map').dispatchEvent(event('pointerdown'));assert(panel.hidden);
});

test('typing uses a compact flat list while Browse all opens the grouped library', async () => {
  const {document,click,event}=await page();
  const search=document.getElementById('case-search'),panel=document.getElementById('case-browser');
  search.value='geo';search.dispatchEvent(event('input'));
  assert.equal(panel.dataset.view,'search');
  assert(panel.querySelector('.case-browser-header').hidden);
  assert.equal(panel.querySelectorAll('.case-collection').length,0);
  assert.equal(panel.querySelectorAll('[data-case-id]').length,2);
  assert(document.getElementById('case-search-status').hidden);
  click('#browse-cases');
  assert.equal(panel.dataset.view,'browse');
  assert(!panel.querySelector('.case-browser-header').hidden);
  assert.equal(panel.querySelectorAll('.case-collection').length,9);
  assert.equal(panel.querySelectorAll('[data-case-id]').length,36);
  search.value='geo';search.dispatchEvent(event('input'));
  assert.equal(panel.dataset.view,'search');
  click('[data-case-id="geography"]');
  assert(panel.hidden);assert.equal(document.getElementById('word-title').textContent,'geography');
});

test('new food, colour and regional cases are searchable and grouped, with one-answer progression', async () => {
  const {document,click,event}=await page();
  const search=document.getElementById('case-search');search.value='he';search.dispatchEvent(event('input'));
  assert.equal(document.querySelectorAll('[data-case-id]').length,1);click('[data-case-id="herring"]');
  assert.equal(document.getElementById('word-title').textContent,'herring');
  click('[data-node-id="herring-danish"]');click('#challenge-answers button:nth-child(2)');
  assert(document.getElementById('evidence-panel').hidden);
  for(const id of ['herring-old','herring-dutch','herring-german']) {click(`[data-node-id="${id}"]`);click('#challenge-answers button');}
  assert(!document.getElementById('complete').hidden);
  click('#browse-cases');
  assert.equal(document.querySelector('[data-collection-id="food"]').querySelectorAll('[data-case-id]').length,4);
  assert.equal(document.querySelector('[data-collection-id="colours"]').querySelectorAll('[data-case-id]').length,3);
  assert.equal(document.querySelector('[data-collection-id="regional"]').querySelectorAll('[data-case-id]').length,3);
  click('[data-case-id="pixie"]');
  assert.equal(document.querySelectorAll('.notebook-entry').length,1);
  click('[data-node-id="pixie-west"]');click('#challenge-answers button');
  assert(!document.getElementById('complete').hidden);
  assert(document.querySelector('[data-node-id="pixie-west"]').textContent.includes('Devon & Cornwall'));
});

test('map and timeline open the same book and reviewing it cannot award points twice', async () => {
  const storage=new Map();let ui=await page(storage);
  chooseWord(ui.document,'chortle');
  const timeline=ui.document.getElementById('evidence-timeline');
  assert.deepEqual([...timeline.querySelectorAll('[data-timeline-id]')].map(el=>el.dataset.timelineId),['chortle-short','chortle-book','chortle-now']);
  ui.click('[data-timeline-id="chortle-book"]');
  assert.equal(ui.document.getElementById('evidence-form').textContent,'chortled');
  const book=ui.document.getElementById('book-evidence');
  assert.equal(book.querySelector('mark').textContent,'chortled');
  assert(book.textContent.includes('Lewis Carroll'));assert(book.textContent.includes('1871'));
  assert(book.textContent.includes('1872'));assert(book.textContent.includes('association'));
  assert(!book.querySelector('details').open,'Extra provenance stays collapsed so the first card remains short.');
  ui.click('#challenge-answers button');
  assert(ui.document.getElementById('complete').hidden, 'The book is only the first hop.');
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 3 points');
  ui.click('[data-node-id="chortle-book"]');
  assert(!ui.document.getElementById('evidence-panel').hidden,'Discovered book can be reopened on the map.');
  assert.equal(ui.document.querySelectorAll('#challenge-answers button').length,0);
  ui.click('#close-evidence');ui.click('[data-timeline-id="chortle-book"]');
  assert(!ui.document.getElementById('evidence-panel').hidden);
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 3 points');
  ui=await page(storage);ui.click('[data-timeline-id="chortle-book"]');
  assert(!ui.document.getElementById('book-evidence').hidden);
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 3 points');
  ui.click('#close-evidence');ui.click('[data-timeline-id="chortle-chuckle"]');
  ui.click('#challenge-answers button');
  assert(ui.document.getElementById('complete').hidden,'Two hops still do not complete the case.');
  ui.click('[data-timeline-id="chortle-chukken"]');ui.click('#challenge-answers button');
  assert(!ui.document.getElementById('complete').hidden,'The third required connection completes the case.');
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 9 points');
  ui=await page(storage);
  assert(!ui.document.getElementById('complete').hidden,'Completed three-hop trail restores on reload.');
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 9 points');
  chooseWord(ui.document,'house');
  assert(ui.document.getElementById('evidence-timeline').hidden,'Undated cases do not get a fabricated evidence timeline.');
});

test('Investigator timeline shows earned evidence without leaking hidden books, dates or locations', async () => {
  const ui=await page();chooseWord(ui.document,'chortle');ui.click('[data-mode-id="investigator"]');
  const timeline=ui.document.getElementById('evidence-timeline');
  assert.equal(timeline.querySelectorAll('[data-timeline-id]').length,1);
  assert(!timeline.textContent.includes('1871'));assert(!timeline.textContent.includes('Oxford'));
  // Oxford's geographic projection in the full-Europe coordinate system.
  inspectHidden(ui,320.36,311.75);
  assert.equal(ui.document.getElementById('evidence-form').textContent,'chortled');
  const book=ui.document.getElementById('book-evidence');
  assert.equal(book.querySelector('mark').textContent,'chortled');
  assert(!book.textContent.includes('1871'));assert(!book.textContent.includes('Lewis Carroll'));
  ui.click('#challenge-answers button');
  assert(ui.document.getElementById('complete').hidden, 'The book is only the first hop.');
  assert.equal(timeline.querySelectorAll('[data-timeline-id]').length,2);
  ui.click('[data-timeline-id="chortle-book"]');
  assert(ui.document.getElementById('book-evidence').textContent.includes('1871'));
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 3 points');
});

test('sandwich continues beyond the town and old two-hop saves cannot show Case solved', async () => {
  const storage=new Map();let ui=await page(storage);chooseWord(ui.document,'sandwich');
  for(const id of ['sandwich-earl','sandwich-town']) {
    ui.click(`[data-node-id="${id}"]`);ui.click('#challenge-answers button');
    assert(ui.document.getElementById('complete').hidden,'Finding the Earl and town is not enough.');
  }
  ui=await page(storage);
  assert(ui.document.getElementById('complete').hidden,'Previously completed two-hop progress is now incomplete.');
  assert(ui.document.querySelector('[data-node-id="sandwich-old"]'));
  ui.click('[data-node-id="sandwich-old"]');ui.click('#challenge-answers button');
  assert(ui.document.getElementById('complete').hidden,'The fourth hop is still required.');
  ui.click('[data-node-id="sandwich-witch"]');ui.click('#challenge-answers button:nth-child(2)');
  assert(ui.document.getElementById('complete').hidden,'Rejecting the sound-alike cannot replace the final connection.');
  ui.click('[data-node-id="sandwich-wic"]');ui.click('#challenge-answers button');
  assert(!ui.document.getElementById('complete').hidden);
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 15 points');
  ui=await page(storage);assert(!ui.document.getElementById('complete').hidden);
  assert.equal(ui.document.getElementById('detective-points').textContent,'⭐ 15 points');
});
