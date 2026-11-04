import content from 'word-chaser-content';
import {Investigation} from './investigation.js';
import {MapView} from './map-view.js';
import {createSpeech} from './speech.js';

const {catalog, cases} = content;
const $ = id => document.getElementById(id);
const speech = createSpeech();
const storageKey = 'word-chaser-current-v1';
let saved = {}, engine, selectedEra, evidenceId = null, cueTimer = null, evidenceFeedback = null;
try { localStorage.removeItem('word-chaser-graph-v2'); const stored = JSON.parse(localStorage.getItem(storageKey)); saved = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}; } catch { /* Storage is optional. */ }
const map = new MapView($('map'), window.EUROPE_MAP, {onInspect: inspect, onHelp: showHint, onSpeak: speakNode, onHover: showPeek, onDismiss: closeEvidence});
function showPeek(id) {
  const peek = $('word-peek');
  if (!engine || !id || evidenceId || !engine.availableIds().includes(id)) { peek.hidden = true; return; }
  const node = engine.node(id), language = catalog.languages[node.languageId];
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
function point(node) { const place = catalog.places[node.placeId]; return [place.x + node.offset[0], place.y + node.offset[1]]; }
function audioData(nodeOrPuzzle) {
  const pronunciation = nodeOrPuzzle.pronunciation, language = catalog.languages[pronunciation.languageId];
  return {word: nodeOrPuzzle.form || nodeOrPuzzle.title, text: pronunciation.text, lang: language.voiceTag, language: language.voiceLabel, historical: language.approximate, fallback: language.fallback};
}
function speakNode(id) {
  if (!id) { $('speech-status').textContent = 'Move the glass over a visible word or object to hear it.'; return; }
  speech.speak(audioData(engine.node(id)));
}
function persist() {
  saved = {caseId: engine.case.id, snapshot: engine.snapshot()};
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* The investigation still works. */ }
}
function selectCase(id, restore = false) {
  const wordCase = cases.find(c => c.id === id); if (!wordCase) return;
  speech.stop(); closeEvidence(); hideCue();
  const snapshot = restore && saved.caseId === id ? saved.snapshot : undefined;
  engine?.destroy();
  engine = new Investigation(catalog, wordCase, snapshot); selectedEra = engine.node().eraId;
  $('case-select').value = id;
  map.reset(); map.setLens(...point(engine.node())); render(); persist();
}
function render() {
  const c = engine.case;
  $('word-title').textContent = c.title; $('case-summary').textContent = c.summary; $('case-question').textContent = c.question; $('partner').textContent = c.partner;
  $('map-era').textContent = `${catalog.eras[selectedEra].icon} ${catalog.eras[selectedEra].name.toUpperCase()}`;
  $('case-progress').textContent = `${engine.visited.size} objects connected · ${engine.remainingGoals.length ? 'case open' : 'case solved'}`;
  $('back-clue').disabled = !engine.history.length;
  speech.bind($('hear-start'), audioData(engine.node(c.startNodeId)));
  $('hear-start').textContent = '🔊';
  map.render(engine, catalog, selectedEra);
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
  $('puzzles').hidden = !engine.case.puzzles.length;
  $('puzzle-list').replaceChildren(...engine.case.puzzles.map(puzzle => {
    const detail = document.createElement('details'); detail.append(textElement('summary', puzzle.title), textElement('p', puzzle.parts + ' → ' + puzzle.meaning), textElement('p', puzzle.text));
    const hear = document.createElement('button'); speech.bind(hear, audioData(puzzle)); detail.append(hear); return detail;
  }));
}
function inspect(id) {
  if (engine.visited.has(id)) { engine.returnTo(id); closeEvidence(); hideCue(); selectedEra = engine.node().eraId; persist(); render(); map.setLens(...point(engine.node())); return; }
  const {node} = engine.inspect(id);
  hideCue(); evidenceId = id; evidenceFeedback = null; selectedEra = node.eraId; render();
  const place = catalog.places[node.placeId], era = catalog.eras[node.eraId], language = catalog.languages[node.languageId];
  $('evidence-meta').textContent = `${era.icon} ${era.name} · ${place.name}`;
  $('evidence-icon').textContent = catalog.artifacts[node.evidence.kind].icon;
  $('evidence-title').textContent = node.evidence.title;
  $('evidence-form').textContent = node.form;
  $('evidence-meaning').textContent = node.meaning;
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
  map.focus(point(node));
  ($('challenge-answers').querySelector('button') || $('close-evidence')).focus({preventScroll: true});
}
function renderEvidence() {
  if (!evidenceId) return;
  const node = engine.node(evidenceId), edge = engine.linkTo(evidenceId), solved = !edge || engine.tested.has(edge.id);
  const count = engine.revealed.get(evidenceId) || 0;
  $('reveal-page').hidden = count === 0;
  if (count) {
    const page = node.evidence.pages[Math.min(count - 1, node.evidence.pages.length - 1)];
    $('reveal-count').textContent = `CLUE ${count} OF ${node.evidence.pages.length}`;
    $('reveal-title').textContent = page.title; $('reveal-text').textContent = page.text;
  }
  $('theory-question').hidden = solved;
  $('challenge-prompt').textContent = edge?.challenge.prompt || '';
  const assisted = count > 0 || (edge && (engine.attempts.get(edge.id) || 0) > 0);
  $('clue-value').textContent = `YOUR THEORY · ⭐ ${assisted ? catalog.rules.assistedPoints : catalog.rules.correctPoints} ${assisted ? 'with help' : 'on your own'}`;
  $('challenge-answers').replaceChildren(...(!solved ? edge.challenge.choices.map(choice => button(choice.label, () => answerTheory(choice.id), 'theory-answer')) : []));
  $('reveal-clue').hidden = solved || count >= node.evidence.pages.length;
  $('reveal-clue').textContent = count ? '⌕ One more little clue' : '⌕ Give me a little clue';
  $('full-evidence').hidden = !solved && count < node.evidence.pages.length;
  const feedback = $('answer-feedback');feedback.hidden = !evidenceFeedback;
  feedback.className = 'answer-feedback ' + (evidenceFeedback?.correct ? 'reward' : 'try-again');
  if (evidenceFeedback) {
    feedback.replaceChildren(textElement('strong', evidenceFeedback.correct ? `⭐ +${evidenceFeedback.earned} · Clue cracked!` : 'A theory to rethink…'), textElement('span', evidenceFeedback.feedback));
    if (!evidenceFeedback.correct) feedback.append(textElement('small', `${evidenceFeedback.deducted ? '−'+evidenceFeedback.deducted+' point. ' : ''}You can try again. Solving this clue now earns ${evidenceFeedback.potentialReward} point.`));
  }
}
function answerTheory(choiceId) {
  if (!evidenceId) return;
  evidenceFeedback = engine.answer(evidenceId, choiceId);
  if (evidenceFeedback.correct) {
    const reward = evidenceFeedback.earned, edge = engine.linkTo(evidenceId);
    const ruledOut = edge && catalog.relations[edge.type].outcome === 'excluded';
    followEvidence();
    cue(`⭐ +${reward} · ${ruledOut ? 'Good catch!' : engine.complete ? 'Case solved!' : 'Clue cracked!'}`, ruledOut ? 2000 : 4000);
    return;
  }
  persist();renderProgress();renderEvidence();
}

function closeEvidence() { evidenceId = null; evidenceFeedback = null; $('evidence-panel').hidden = true; if ($('word-peek')) $('word-peek').hidden = true; }
function followEvidence() {
  if (!evidenceId) return;
  const id = evidenceId, sameStop = id === engine.currentId;
  if (!sameStop) engine.follow(id);
  closeEvidence(); hideCue(); selectedEra = engine.node().eraId; persist(); map.reset(); map.setLens(...point(engine.node())); render();
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
  if (!explicit) return;
  const lead = engine.leads()[0];
  if (lead) { const node = engine.node(lead.target); cue(`Inspect the ${node.evidence.title.toLowerCase()} in ${catalog.places[node.placeId].name}. Its date is ${catalog.eras[node.eraId].name}.`); }
  else if (engine.complete) cue('You solved this case. You can revisit the evidence or choose another word.');
  else cue('This comparison has no earlier clue here. Use Previous clue to explore another lead.');
}
function renderCatalog() {
  const query = $('case-search').value.trim().toLocaleLowerCase();
  const matches = cases.filter(c => [c.title, c.summary, ...c.nodes.map(node => catalog.languages[node.languageId].name)].join(' ').toLocaleLowerCase().includes(query));
  $('case-select').replaceChildren(...matches.map(c => { const option = textElement('option', `${c.icon} ${c.title}`); option.value = c.id; return option; }));
  if (matches.some(c => c.id === engine?.case.id)) $('case-select').value = engine.case.id;
  $('case-select').disabled = !matches.length;
  $('catalog-count').textContent = `${matches.length} word ${matches.length === 1 ? 'mystery' : 'mysteries'}`;
}
$('case-search').addEventListener('input', renderCatalog);
$('case-select').addEventListener('change', event => selectCase(event.target.value));
$('reveal-clue').addEventListener('click', () => { if (!evidenceId) return; engine.reveal(evidenceId); persist(); renderEvidence(); });
$('close-evidence').addEventListener('click', closeEvidence);
$('map').addEventListener('keydown', event => { if (event.key === 'Escape') closeEvidence(); });
$('back-clue').addEventListener('click', () => { closeEvidence(); hideCue(); engine.back(); selectedEra = engine.node().eraId; persist(); map.reset(); map.setLens(...point(engine.node())); render(); });
$('zoom-reset').addEventListener('click', () => map.reset());
$('help').addEventListener('click', () => showHint(true));
$('restart').addEventListener('click', () => selectCase(engine.case.id));
$('sources-open').addEventListener('click', () => {
  $('sources-list').replaceChildren(...engine.case.sources.map(source => { const link = textElement('a', source.title + ' ↗'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener'; return link; }));
  $('sources-dialog').showModal();
});
$('sources-close').addEventListener('click', () => $('sources-dialog').close());
window.addEventListener('pagehide', () => speech.stop());
renderCatalog(); selectCase(cases.some(c => c.id === saved.caseId) ? saved.caseId : cases[0].id, true);
if (!speech.supported) $('speech-status').textContent = 'Spoken words are unavailable in this browser.';
