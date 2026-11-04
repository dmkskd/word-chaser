import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

async function page(storage = new Map()) {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const {window, document} = parseHTML(html);
  // The DOM test does not simulate pixels, sound, or native focus/camera animation.
  window.matchMedia = () => ({matches: true});
  for (const element of document.querySelectorAll('*')) element.focus = () => {};
  const create = document.createElement.bind(document);
  document.createElement = (...args) => { const element = create(...args); element.focus = () => {}; return element; };
  // Linkedom's select lacks the native setter; emulate the platform contract.
  Object.defineProperty(document.getElementById('case-select'), 'value', {get() { return this._value || this.querySelector('option')?.value || ''; }, set(value) { this._value = value; }});
  for (const dialog of document.querySelectorAll('dialog')) { dialog.showModal = () => dialog.setAttribute('open', ''); dialog.close = () => dialog.removeAttribute('open'); }
  let timerId = 0; const timers = new Map();
  const context = vm.createContext({window, document, console, setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id), localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)}});
  vm.runInContext(await readFile(new URL('../assets/europe-map.js', import.meta.url), 'utf8'), context);
  vm.runInContext(await readFile(new URL('../assets/app.js', import.meta.url), 'utf8'), context);
  const click = selector => { const element = document.querySelector(selector); assert(element, `Missing ${selector}`); if (typeof element.click === 'function') element.click(); else element.dispatchEvent(new window.Event('click', {bubbles: true})); };
  return {document, click, timers, context, event: type => new window.Event(type, {bubbles: true})};
}

test('built page runs the treasure investigation via evidence objects and graph leads', async () => {
  const {document, click} = await page();
  assert.equal(document.getElementById('case-select').querySelectorAll('option').length, 15);
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
  click('[data-node-id="treasure-1"]');
  click('[data-node-id="treasure-2"]');click('#challenge-answers button');assert(document.getElementById('evidence-panel').hidden);
  assert.equal(document.getElementById('complete').hidden, false);
  assert(document.querySelector('.graph-edge.dotted.reviewed'));
  assert(document.querySelector('.graph-edge.dashed.reviewed'));
});

test('hints are explicit and temporary, and the catalog is searchable', async () => {
  const {document, click, timers, event} = await page();
  assert(document.getElementById('map-cue').hidden);
  click('#help'); assert(!document.getElementById('map-cue').hidden);
  assert(document.getElementById('map-cue').textContent.includes('manuscript'));
  for (const fn of [...timers.values()]) fn();
  assert(document.getElementById('map-cue').hidden);
  const search = document.getElementById('case-search'); search.value = 'Greek'; search.dispatchEvent(event('input'));
  assert.equal(document.getElementById('case-select').querySelectorAll('option').length, 5);
  search.value = 'does-not-exist'; search.dispatchEvent(event('input'));
  assert.equal(document.getElementById('case-select').disabled, true);
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
  const select = document.getElementById('case-select'); select.value = 'window'; select.dispatchEvent(event('change'));
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
  const select = document.getElementById('case-select');select.value='dinosaur';select.dispatchEvent(event('change'));
  click('[data-node-id="dinosaur-1"]');click('#challenge-answers button');
  click('[data-node-id="dinosaur-french"]');click('#challenge-answers button');
  assert(document.querySelector('[data-node-id="dinosaur-2"]'));
  assert(!document.body.textContent.includes('Ruled out'));
});

test('the Arabic source at the map edge is reachable with the magnifying glass', async () => {
  const {document, click, event} = await page();
  const select = document.getElementById('case-select');
  select.value = 'algebra'; select.dispatchEvent(event('change'));
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
  let select = ui.document.getElementById('case-select');
  select.value = 'maths'; select.dispatchEvent(ui.event('change'));
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1);
  assert.equal(JSON.parse(storage.get('word-chaser-current-v1')).caseId, 'maths');
  ui = await page(storage);
  assert.equal(ui.document.getElementById('word-title').textContent, 'maths');
  select = ui.document.getElementById('case-select');
  select.value = 'treasure'; select.dispatchEvent(ui.event('change'));
  assert.equal(ui.document.querySelectorAll('.notebook-entry').length, 1, 'Returning to a different word starts fresh.');
  assert(ui.document.getElementById('detective-points').textContent.includes('0'));
  assert(!storage.has('word-chaser-graph-v2'));
});

test('confirmed algebra trails show both the spatial route and the jump in time', async () => {
  const {document, click, event} = await page();
  const select = document.getElementById('case-select');
  select.value = 'algebra'; select.dispatchEvent(event('change'));
  assert.equal(document.querySelectorAll('.trail-time').length, 0, 'Unsolved routes remain hidden.');
  click('[data-node-id="algebra-latin"]'); click('#challenge-answers button');
  assert(document.querySelector('#trails').textContent.includes('Today → 1100s'));
  click('[data-node-id="algebra-arabic"]'); click('#challenge-answers button');
  assert(document.querySelector('#trails').textContent.includes('1100s → around 820'));
});
