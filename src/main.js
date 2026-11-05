import content from 'word-chaser-content';
import {Investigation} from './investigation.js';
import {MapView} from './map-view.js';
import {createSpeech} from './speech.js';
import {createFireworks, FIREWORK_DURATION, FIREWORK_SHELLS} from './fireworks.js';
import {createFireworkSound} from './firework-sound.js';
import {createDetectiveMusic} from './detective-music.js';
import musicScore from '../data/detective-music.json';
import {evidencePoint} from './geography.js';
import {renderWordParts} from './word-parts.js';
import {createCasePicker} from './case-picker.js';
import {renderTextEvidence} from './text-evidence.js';
import {renderEvidenceTimeline} from './evidence-timeline.js';

const {catalog, cases} = content;
const $ = id => document.getElementById(id);
const music = createDetectiveMusic(musicScore);
const speech = createSpeech({onSpeakingChange: speaking => music.setDucked(speaking)});
const fireworks = createFireworks(), fireworkSound = createFireworkSound();
const storageKey = 'word-chaser-current-v1';
let searchTimer = null, searchSeconds = 0;
let saved = {}, engine, selectedEra, evidenceId = null, cueTimer = null, evidenceFeedback = null, fireworksTimer = null;
try { localStorage.removeItem('word-chaser-graph-v2'); const stored = JSON.parse(localStorage.getItem(storageKey)); saved = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}; } catch { /* Storage is optional. */ }
const modeParam = new URLSearchParams(window.location?.search || '').get('mode');
const normalizeMode = value => value?.trim().toLowerCase().replace(/[\s_-]/g, '');
const requestedMode = Object.keys(catalog.modes).find(id => modeParam && [id, catalog.modes[id].label].some(name => normalizeMode(name) === normalizeMode(modeParam)));
let modeId = requestedMode || (Object.hasOwn(catalog.modes, saved.modeId) ? saved.modeId : 'chaser');
const currentMode = () => catalog.modes[modeId];
const map = new MapView($('map'), window.EUROPE_MAP, {onInspect: inspect, onHelp: showHint, onSpeak: speakNode, onHover: showPeek, onDismiss: closeEvidence});
function showPeek(id) {
  const peek = $('word-peek');
  if (!engine || !currentMode().showPeeks || !id || evidenceId || !engine.availableIds().includes(id)) { peek.hidden = true; return; }
  const node = engine.node(id), language = catalog.languages[node.languageId];
  $('peek-meaning').hidden = !currentMode().showPeekDetails;
  $('peek-language').hidden = !currentMode().showPeekDetails;
  $('peek-word').textContent = node.form; $('peek-meaning').textContent = node.meaning;
  $('peek-language').textContent = engine.nodeStatus(id) === 'excluded' ? '✕ Not our trail · '+language.name : engine.visited.has(id) ? language.name : language.name;
  const [vx, vy, w, h] = map.view;
  const left = (map.lens[0] - vx) / w * 100;
  peek.style.left = Math.max(3, Math.min(67, left + (left > 60 ? -25 : 8))) + '%';
  peek.style.top = Math.max(3, Math.min(77, (map.lens[1] - vy) / h * 100 - 7)) + '%';
  peek.hidden = false;
}
function textElement(tag, text, className = '') { const element = document.createElement(tag); element.textContent = text; if (className) element.className = className; return element; }
function button(label, action, className = '') { const element = textElement('button', label, className); element.type = 'button'; element.addEventListener('click', action); return element; }
function point(node) { return evidencePoint(node, catalog, map.markerScale()); }
function audioData(nodeOrPuzzle) {
  const pronunciation = nodeOrPuzzle.pronunciation, language = catalog.languages[pronunciation.languageId];
  return {word: nodeOrPuzzle.form || nodeOrPuzzle.title, text: pronunciation.text, lang: language.voiceTag, language: language.voiceLabel, historical: language.approximate, fallback: language.fallback};
}
function speakNode(id) {
  if (!currentMode().showPeeks && id && !engine.inspected.has(id) && !engine.visited.has(id)) return;
  if (!id) { $('speech-status').textContent = 'Move the glass over a visible word or object to hear it.'; return; }
  speech.speak(audioData(engine.node(id)));
}
function stopSearchTimer() {
  if (searchTimer !== null) clearTimeout(searchTimer);
  searchTimer = null; $('search-timer').hidden = true;
  $('search-assist').hidden = true;
  $('search-location-hint').hidden = true; $('search-location-hint').textContent = '';
}
function startSearchTimer() {
  stopSearchTimer();
  if (!engine || engine.complete || evidenceId || !currentMode().searchHintSeconds) return;
  searchSeconds = currentMode().searchHintSeconds;
  const label = $('search-timer');
  function paint() {
    label.textContent = `Hint in ${Math.floor(searchSeconds / 60)}:${String(searchSeconds % 60).padStart(2, '0')}`;
    label.hidden = false; $('search-assist').hidden = false;
  }
  function tick() {
    searchTimer = null;
    // Reading the mission, answering a theory or leaving the tab is not searching.
    if (!document.hidden && !$('story-dialog').hasAttribute('open')) {
      searchSeconds--;
      if (searchSeconds <= 0) {
        const leads = engine.leads();
        const lead = leads.find(edge => catalog.relations[edge.type].outcome === 'connected') || leads[0];
        if (lead) {
          const hint = $('search-location-hint');
          hint.textContent = 'A little nudge: ' + catalog.places[engine.node(lead.target).placeId].searchHint;
          hint.hidden = false;
        }
        searchSeconds = currentMode().searchHintSeconds;
      }
    }
    paint(); searchTimer = setTimeout(tick, 1000);
  }
  paint(); searchTimer = setTimeout(tick, 1000);
}
function persist() {
  saved = {caseId: engine.case.id, modeId, snapshot: engine.snapshot()};
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* The investigation still works. */ }
}
function selectCase(id, restore = false) {
  const wordCase = cases.find(c => c.id === id); if (!wordCase) return;
  speech.stop(); closeEvidence(); hideCue(); clearFireworks();
  const snapshot = restore && saved.caseId === id ? saved.snapshot : undefined;
  engine?.destroy();
  engine = new Investigation(catalog, wordCase, snapshot); selectedEra = engine.node().eraId;
  casePicker.setCurrent(id);
  map.startCase(wordCase); map.setLens(...point(engine.node())); render(); map.frameDiscovered(engine, catalog); persist(); startSearchTimer();
}
function render() {
  const c = engine.case, mode = currentMode();
  for (const choice of $('mode-options').querySelectorAll('[data-mode-id]')) choice.setAttribute('aria-pressed', String(choice.dataset.modeId === modeId));
  $('map-instructions').textContent = mode.instructions;
  $('help').hidden = !mode.allowHints; $('help').disabled = !mode.allowHints;
  for (const selector of ['.next-leads', '.time-machine', '.partner']) document.querySelector(selector).hidden = !mode.allowHints;
  $('case-summary').hidden = !mode.allowHints; $('case-question').hidden = !mode.allowHints;
  $('sources-open').hidden = !mode.allowHints && !engine.complete;
  $('word-title').textContent = c.title; $('case-summary').textContent = c.summary; $('case-question').textContent = c.question; $('partner').textContent = c.partner;
  $('map-era').textContent = mode.showMarkerDetails ? `${catalog.eras[selectedEra].icon} ${catalog.eras[selectedEra].name.toUpperCase()}` : mode.label.toUpperCase();
  $('case-progress').textContent = `${engine.visited.size} objects connected · ${engine.remainingGoals.length ? 'case open' : 'case solved'}`;
  $('back-clue').disabled = !engine.history.length;
  $('zoom-local').hidden = !c.camera;
  speech.bind($('hear-start'), audioData(engine.node(c.startNodeId)));
  renderWordParts($('word-title'), engine.node(c.startNodeId), c.edges.find(edge => edge.source === c.startNodeId && edge.sourceSegmentId)?.sourceSegmentId);
  $('hear-start').textContent = '🔊';
  map.render(engine, catalog, selectedEra, mode);
  renderEvidenceTimeline($('evidence-timeline'), engine, mode, inspect);
  $('text-trail-key').hidden = !c.nodes.some(node => node.kind === 'attestation');
  renderNotebook(); renderEras(); renderPuzzles(); renderProgress();
  $('complete').hidden = !engine.complete; $('complete-text').textContent = c.completion;
  $('map-solved-stamp').hidden = !engine.complete;
}
function renderProgress() {
  $('detective-points').textContent = `⭐ ${engine.points} ${engine.points === 1 ? 'point' : 'points'}`;
  $('clues-solved').textContent = `${engine.tested.size} theories tested`;
  const total = engine.case.milestones.length, found = engine.case.milestones.filter(m => engine.visited.has(m.nodeId)).length;
  $('progress-label').textContent = `${found} of ${total} main clues connected`;
  $('progress-track').setAttribute('aria-valuenow', String(Math.round(found / total * 100)));
  $('progress-fill').style.width = (found / total * 100) + '%';
}
function renderNotebook() {
  $('visited-list').replaceChildren(...[...engine.visited].map(id => {
    const node = engine.node(id), status = engine.nodeStatus(id), card = document.createElement('div'); card.className = 'notebook-entry '+status + (id === engine.currentId ? ' focused' : '');
    const open = button(node.form, () => inspect(id), 'word-link');
    if (id === engine.currentId) open.setAttribute('aria-current', 'location');
    const meta = textElement('small', `${status === 'excluded' ? '✕ Not our trail · ' : ''}${catalog.languages[node.languageId].name} · ${node.period}`);
    const story = document.createElement('details'); story.className = 'notebook-story'; story.append(textElement('summary', 'Read the story'), textElement('p', node.evidence.text), textElement('p', node.evidence.notice));
    if (node.evidence.textSource) {
      const passage = document.createElement('div'); passage.className = 'book-evidence';
      renderTextEvidence(passage, node); story.append(passage);
    }
    story.hidden = !currentMode().allowHints && !engine.complete;
    const hear = document.createElement('button'); speech.bind(hear, audioData(node));
    hear.classList.add('notebook-audio'); hear.textContent = catalog.languages[node.pronunciation.languageId].approximate ? '🔊 ≈' : '🔊';
    const badge = textElement('span', status === 'excluded' ? '✕' : '✓', 'notebook-result');
    badge.setAttribute('aria-label', status === 'excluded' ? 'Not our trail' : 'Connected');
    const heading = document.createElement('div'); heading.className = 'notebook-entry-heading'; heading.append(badge, open, hear);
    card.append(heading, meta, story); return card;
  }));
  const leads = engine.leads();
  $('lead-list').replaceChildren(...leads.map(edge => {
    const node = engine.node(edge.target), relation = catalog.relations[edge.type];
    const el = button(`${catalog.artifacts[node.evidence.kind].icon} ${engine.visited.has(node.id) ? node.form : catalog.languages[node.languageId].name}`, () => inspect(node.id), 'lead-link');
    el.append(textElement('small', catalog.places[node.placeId].name)); return el;
  }));
  if (!leads.length) $('lead-list').append(textElement('p', 'This lead ends here. Return to a previous clue to compare another trail.'));
}
function renderEras() {
  const eraIds = [...new Set(engine.case.nodes.map(node => node.eraId))].sort((a, b) => catalog.eras[b].startYear - catalog.eras[a].startYear);
  $('era-buttons').replaceChildren(...eraIds.map(id => {
    const era = catalog.eras[id];
    const el = button('', () => { selectedEra = id; closeEvidence(); hideCue(); render(); }, 'era-button');
    el.setAttribute('aria-pressed', String(id === selectedEra));
    el.append(textElement('span', era.icon, 'era-icon'), textElement('b', era.name), textElement('small', era.label));
    const found = [...engine.visited].map(nodeId => engine.node(nodeId)).filter(node => node.eraId === id);
    if (found.length) el.append(textElement('span', found.map(node => '✓ ' + node.form).join(' · '), 'era-found'));
    return el;
  }));
}
function renderPuzzles() {
  $('puzzles').hidden = !engine.case.puzzles.length || (!currentMode().allowHints && !engine.complete);
  $('puzzle-list').replaceChildren(...engine.case.puzzles.map(puzzle => {
    const detail = document.createElement('details'); detail.append(textElement('summary', puzzle.title), textElement('p', puzzle.parts + ' → ' + puzzle.meaning), textElement('p', puzzle.text));
    const hear = document.createElement('button'); speech.bind(hear, audioData(puzzle)); detail.append(hear); return detail;
  }));
}
function inspect(id) {
  if (engine.visited.has(id)) {
    engine.returnTo(id); persist();
    if (engine.node(id).kind !== 'attestation') { closeEvidence(); hideCue(); selectedEra = engine.node().eraId; render(); map.setLens(...point(engine.node())); return; }
  }
  stopSearchTimer();
  const {node} = engine.inspect(id);
  hideCue(); evidenceId = id; evidenceFeedback = null; selectedEra = node.eraId; render();
  const place = catalog.places[node.placeId], era = catalog.eras[node.eraId], language = catalog.languages[node.languageId];
  $('evidence-meta').textContent = `${era.icon} ${era.name} · ${place.name}`;
  $('evidence-meta').hidden = !currentMode().allowHints;
  $('evidence-icon').hidden = !currentMode().allowHints;
  $('evidence-icon').textContent = catalog.artifacts[node.evidence.kind].icon;
  $('evidence-title').textContent = currentMode().allowHints ? node.evidence.title : 'Test this word';
  $('evidence-form').textContent = node.form;
  $('evidence-meaning').textContent = node.meaning;
  $('evidence-meaning').hidden = !currentMode().allowHints;
  $('evidence-text').textContent = node.evidence.text;
  $('evidence-notice').textContent = node.evidence.notice;
  $('full-evidence').open = false;
  speech.bind($('hear-evidence'), audioData(node));
  const edge = engine.linkTo(id);
  $('evidence-relation').textContent = edge ? edge.evidence.text : '';
  $('evidence-sources').replaceChildren(...node.evidence.sourceIds.map(sourceId => {
    const source = engine.case.sources.find(item => item.id === sourceId), link = textElement('a', source.title + ' ↗');
    link.href = source.url; link.target = '_blank'; link.rel = 'noopener'; return link;
  }));
  renderEvidence(); $('evidence-panel').hidden = false;
  $('evidence-content').scrollTop = 0;
  $('evidence-panel').scrollTop = 0;
  map.focus(point(node));
  ($('challenge-answers').querySelector('button') || $('close-evidence')).focus({preventScroll: true});
}
function renderEvidence() {
  if (!evidenceId) return;
  const node = engine.node(evidenceId), edge = engine.linkTo(evidenceId), solved = !edge || engine.tested.has(edge.id);
  const count = engine.revealed.get(evidenceId) || 0;
  renderTextEvidence($('book-evidence'), node, currentMode().allowHints || engine.visited.has(evidenceId));
  $('reveal-page').hidden = !currentMode().allowHints || count === 0;
  if (count) {
    const page = node.evidence.pages[Math.min(count - 1, node.evidence.pages.length - 1)];
    $('reveal-count').textContent = `CLUE ${count} OF ${node.evidence.pages.length}`;
    $('reveal-title').textContent = page.title; $('reveal-text').textContent = page.text;
  }
  $('theory-question').hidden = solved;
  $('challenge-prompt').textContent = edge?.challenge.prompt || '';
  $('part-context').hidden = !edge?.sourceSegmentId;
  if (edge?.sourceSegmentId) renderWordParts($('part-context-word'), engine.node(edge.source), edge.sourceSegmentId);
  const assisted = count > 0 || (edge && (engine.attempts.get(edge.id) || 0) > 0);
  $('clue-value').textContent = `YOUR THEORY · ⭐ ${assisted ? catalog.rules.assistedPoints : catalog.rules.correctPoints} ${assisted ? 'with help' : 'on your own'}`;
  $('challenge-answers').replaceChildren(...(!solved ? edge.challenge.choices.map(choice => button(choice.label, () => answerTheory(choice.id), 'theory-answer')) : []));
  $('reveal-clue').hidden = !currentMode().allowHints || solved || count >= node.evidence.pages.length;
  $('reveal-clue').disabled = !currentMode().allowHints;
  $('reveal-clue').textContent = count ? '⌕ One more little clue' : '⌕ Give me a little clue';
  $('full-evidence').hidden = currentMode().allowHints ? !solved && count < node.evidence.pages.length : !engine.complete;
  const feedback = $('answer-feedback');feedback.hidden = !evidenceFeedback;
  feedback.className = 'answer-feedback ' + (evidenceFeedback?.correct ? 'reward' : 'try-again');
  if (evidenceFeedback) {
    feedback.replaceChildren(textElement('strong', evidenceFeedback.correct ? `⭐ +${evidenceFeedback.earned} · Clue cracked!` : 'A theory to rethink…'), textElement('span', evidenceFeedback.feedback));
    if (!evidenceFeedback.correct) feedback.append(textElement('small', `${evidenceFeedback.deducted ? '−'+evidenceFeedback.deducted+' point. ' : ''}You can try again. Solving this clue now earns ${evidenceFeedback.potentialReward} point.`));
  }
}
function answerTheory(choiceId) {
  if (!evidenceId) return;
  const wasComplete = engine.complete;
  evidenceFeedback = engine.answer(evidenceId, choiceId);
  if (evidenceFeedback.correct) {
    const reward = evidenceFeedback.earned, edge = engine.linkTo(evidenceId);
    const ruledOut = edge && catalog.relations[edge.type].outcome === 'excluded';
    followEvidence();
    if (!wasComplete && engine.complete) celebrateCase();
    cue(`⭐ +${reward} · ${ruledOut ? 'Good catch!' : engine.complete ? 'Case solved!' : 'Clue cracked!'}`, ruledOut ? 2000 : 4000);
    return;
  }
  if (currentMode().restartOnWrong) {
    selectCase(engine.case.id);
    cue('That theory didn’t fit. Case restarted. Try again!');
    return;
  }
  persist();renderProgress();renderEvidence();
}

function clearFireworks() {
  if (fireworksTimer !== null) clearTimeout(fireworksTimer);
  fireworksTimer = null; fireworks.stop(); fireworkSound.stop();
  $('map-fireworks').hidden = true; $('map-fireworks').replaceChildren();
}
function celebrateCase() {
  clearFireworks();
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const container = $('map-fireworks'); container.hidden = false;
  if (!fireworks.start(container)) { clearFireworks(); return; }
  fireworkSound.play(FIREWORK_SHELLS);
  fireworksTimer = setTimeout(clearFireworks, FIREWORK_DURATION);
}

function closeEvidence() { const wasOpen = !!evidenceId; evidenceId = null; evidenceFeedback = null; $('evidence-panel').hidden = true; if ($('word-peek')) $('word-peek').hidden = true; if (wasOpen) startSearchTimer(); }
function followEvidence() {
  if (!evidenceId) return;
  const id = evidenceId, sameStop = id === engine.currentId;
  if (!sameStop) engine.follow(id);
  closeEvidence(); hideCue(); selectedEra = engine.node().eraId; persist();
  if (engine.case.camera) map.frameDiscovered(engine, catalog); else map.reset();
  map.setLens(...point(engine.node())); render();
  startSearchTimer();
  if (!sameStop && engine.complete) cue('Case solved! You connected the evidence.');
  $('map').focus({preventScroll: true});
}

function hideCue() { if (cueTimer !== null) clearTimeout(cueTimer); cueTimer = null; $('map-cue').hidden = true; }
function cue(message, duration = 4000) {
  hideCue(); const panel = $('map-cue'); panel.textContent = message; panel.hidden = false;
  // A brief prompt near the lens, never a permanent instruction layer.
  const [vx, vy, w, h] = map.view;
  panel.style.left = Math.max(2, Math.min(65, (map.lens[0] - vx) / w * 100 + 7)) + '%';
  panel.style.top = Math.max(4, Math.min(75, (map.lens[1] - vy) / h * 100 - 6)) + '%';
  cueTimer = setTimeout(hideCue, duration);
}
function showHint(explicit = true) {
  if (!explicit || !currentMode().allowHints) return;
  const lead = engine.leads()[0];
  if (lead) { const node = engine.node(lead.target); cue(`Inspect the ${node.evidence.title.toLowerCase()} in ${catalog.places[node.placeId].name}. Its date is ${catalog.eras[node.eraId].name}.`); }
  else if (engine.complete) cue('You solved this case. You can revisit the evidence or choose another word.');
  else cue('This comparison has no earlier clue here. Use Previous clue to explore another lead.');
}
const casePicker = createCasePicker({catalog, cases, document, onSelect: id => selectCase(id)});
$('mode-options').replaceChildren(...Object.entries(catalog.modes).map(([id, mode]) => {
  const choice = button('', () => {
    if (id === modeId) return;
    modeId = id;
    try { const url = new URL(window.location.href); url.searchParams.set('mode', id); window.history.replaceState(null, '', url); } catch { /* URL updates are optional for local files. */ }
    selectCase(engine.case.id);
  }, 'mode-choice');
  choice.dataset.modeId = id;
  choice.setAttribute('aria-pressed', String(id === modeId));
  choice.setAttribute('aria-describedby', `mode-tip-${id}`);
  const tip = textElement('span', `${mode.label} — ${mode.description}`, 'mode-tooltip');
  tip.id = `mode-tip-${id}`; tip.setAttribute('role', 'tooltip');
  choice.append(textElement('span', mode.label), tip);
  return choice;
}));
$('reveal-clue').addEventListener('click', () => { if (!evidenceId || !currentMode().allowHints) return; engine.reveal(evidenceId); persist(); renderEvidence(); });
$('close-evidence').addEventListener('click', closeEvidence);
$('map').addEventListener('keydown', event => { if (event.key === 'Escape') closeEvidence(); });
$('back-clue').addEventListener('click', () => { closeEvidence(); hideCue(); engine.back(); selectedEra = engine.node().eraId; persist(); if (engine.case.camera) map.frameDiscovered(engine, catalog); else map.reset(); map.setLens(...point(engine.node())); render(); });
$('zoom-reset').addEventListener('click', () => map.reset());
$('zoom-in').addEventListener('click', () => map.zoom(.7, map.lens, true));
$('zoom-out').addEventListener('click', () => map.zoom(1 / .7, map.lens, true));
$('zoom-local').addEventListener('click', () => { map.startCase(engine.case); map.setLens(...point(engine.node(engine.case.startNodeId))); render(); });
$('help').addEventListener('click', () => showHint(true));
$('restart').addEventListener('click', () => selectCase(engine.case.id));
$('sources-open').addEventListener('click', () => {
  if (!currentMode().allowHints && !engine.complete) return;
  $('sources-list').replaceChildren(...engine.case.sources.map(source => { const link = textElement('a', source.title + ' ↗'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener'; return link; }));
  $('sources-dialog').showModal();
});
$('sources-close').addEventListener('click', () => $('sources-dialog').close());
const fireworkSoundKey = 'word-chaser-firework-sound-v1';
try { $('firework-sound').checked = localStorage.getItem(fireworkSoundKey) !== 'off'; } catch { $('firework-sound').checked = true; }
$('firework-sound').disabled = !fireworkSound.supported;
if (!fireworkSound.supported) { $('firework-sound').checked = false; $('firework-sound').parentElement.title = 'Firework audio is unavailable in this browser'; }
fireworkSound.setEnabled($('firework-sound').checked);
$('firework-sound').addEventListener('change', event => {
  fireworkSound.setEnabled(event.target.checked);
  try { localStorage.setItem(fireworkSoundKey, event.target.checked ? 'on' : 'off'); } catch { /* The control still works without storage. */ }
});
const storyKey = 'word-chaser-story-v1';
const musicKey = 'word-chaser-music-v1';
let musicActivated = false;
try { $('background-music').checked = localStorage.getItem(musicKey) !== 'off'; } catch { $('background-music').checked = true; }
$('background-music').disabled = !music.supported;
if (!music.supported) { $('background-music').checked = false; $('background-music').parentElement.title = 'Music is unavailable in this browser'; }
music.setEnabled($('background-music').checked);
function wakeMusic() { musicActivated = true; music.start(); }
$('background-music').addEventListener('change', event => {
  music.setEnabled(event.target.checked);
  try { localStorage.setItem(musicKey, event.target.checked ? 'on' : 'off'); } catch { /* Music preferences are optional. */ }
  if (event.target.checked) wakeMusic();
});
document.addEventListener('pointerdown', wakeMusic, {capture: true});
document.addEventListener('click', wakeMusic, {capture: true});
document.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) wakeMusic(); }, {capture: true});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.stop();
  else if (musicActivated) music.start();
});
function rememberStory() { try { localStorage.setItem(storyKey, 'seen'); } catch { /* The story still works without storage. */ } }
$('story-start').addEventListener('click', () => {
  rememberStory(); $('story-dialog').close(); $('map').focus({preventScroll: true});
});
$('story-dialog').addEventListener('cancel', rememberStory);
$('story-open').addEventListener('click', event => {
  event.preventDefault(); speech.stop(); closeEvidence(); hideCue(); $('story-dialog').showModal();
});
window.addEventListener('pageshow', () => { if (searchTimer === null) startSearchTimer(); });
window.addEventListener('pagehide', () => { stopSearchTimer(); speech.stop(); clearFireworks(); music.stop(); });
selectCase(cases.some(c => c.id === saved.caseId) ? saved.caseId : cases[0].id, !requestedMode || requestedMode === saved.modeId);
let storySeen = false;
try { storySeen = localStorage.getItem(storyKey) === 'seen'; } catch { /* Show the opening if storage is unavailable. */ }
if (!storySeen) $('story-dialog').showModal();
if (!speech.supported) $('speech-status').textContent = 'Spoken words are unavailable in this browser.';
