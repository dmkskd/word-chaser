import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadContent} from '../scripts/content.mjs';
import {createValidator, minimumRequiredHops} from '../src/validation.js';
import {Investigation} from '../src/investigation.js';

const {catalog, cases} = await loadContent();
const treasure = cases.find(wordCase => wordCase.title === 'treasure');
const go = (engine, id) => { engine.inspect(id); const edge = engine.linkTo(id); if (edge) engine.answer(id, edge.challenge.choices.find(c => c.correct).id); engine.follow(id); };

test('inspection and camera-independent progress are separate actions', () => {
  const engine = new Investigation(catalog, treasure);
  assert.throws(() => engine.follow('treasure-1'), /Inspect/);
  const evidence = engine.inspect('treasure-1');
  assert.equal(evidence.node.form, 'tresour');
  assert.equal(engine.currentId, 'treasure-0');
  assert.equal(engine.visited.size, 1);
  assert.throws(() => engine.follow('treasure-1'), /Test your theory/);
  assert.throws(() => engine.inspect('treasure-3'), /available lead/);
  engine.destroy();
});

test('German comparison remains distinct from a borrowing route', () => {
  const engine = new Investigation(catalog, treasure);
  go(engine, 'treasure-1');
  assert.equal(engine.outgoing().length, 3);
  const edge = engine.linkTo('treasure-german');
  assert.equal(catalog.relations[edge.type].category, 'comparison');
  go(engine, 'treasure-german');
  assert.equal(engine.complete, false);
  assert.equal(engine.currentId, 'treasure-1', 'Ruling out a comparison keeps the other leads in view.');
  assert(engine.visited.has('treasure-german'));
  assert(engine.visibleEdges().some(e => e.id === edge.id));
  engine.destroy();
});

test('Italian and French branches converge on Latin without requiring a fixed order', () => {
  const engine = new Investigation(catalog, treasure);
  go(engine, 'treasure-1'); go(engine, 'treasure-italian'); go(engine, 'treasure-3');
  assert.equal(engine.node().form, 'thesaurus');
  assert.equal(engine.complete, false, 'The English-through-French evidence is still required by the case data.');
  go(engine, 'treasure-1'); go(engine, 'treasure-2'); go(engine, 'treasure-3');
  assert(engine.complete);
  assert(engine.reviewed.has('treasure-italian-root'));
  assert(engine.reviewed.has('treasure-edge-2'));
  const endpoints = engine.visibleEdges().map(e => [e.id, e.source, e.target]);
  engine.back();
  for (const [id, source, target] of endpoints) assert.deepEqual([engine.edge(id).source, engine.edge(id).target], [source, target]);
  engine.destroy();
});

test('save restoration preserves explored branches after returning to earlier clues', () => {
  const engine = new Investigation(catalog, treasure);
  go(engine, 'treasure-1'); go(engine, 'treasure-german'); go(engine, 'treasure-2');
  const restored = new Investigation(catalog, treasure, engine.snapshot());
  assert.equal(restored.currentId, engine.currentId);
  assert.deepEqual([...restored.visited].sort(), [...engine.visited].sort());
  assert.deepEqual([...restored.reviewed].sort(), [...engine.reviewed].sort());
  engine.destroy(); restored.destroy();
});

test('every existing case can be completed using the same generic graph rules', () => {
  for (const wordCase of cases) {
    const engine = new Investigation(catalog, wordCase);
    function explore() {
      for (const edge of engine.outgoing()) {
        if (engine.reviewed.has(edge.id)) continue;
        const before = engine.currentId; go(engine, edge.target);
        if (engine.currentId !== before) { explore(); engine.back(); }
      }
    }
    explore();
    assert(engine.complete, wordCase.id);
    engine.destroy();
  }
});

test('a newly authored case needs no word-name conditions or engine changes', () => {
  const extra = structuredClone(treasure);
  extra.id = 'new-author-case'; extra.title = 'A new JSON word';
  const engine = new Investigation(catalog, extra);
  go(engine, extra.edges[0].target);
  go(engine, extra.edges[1].target);
  go(engine, extra.edges[2].target);
  assert(engine.complete);
  engine.destroy();
});

const [catalogSchema, caseSchema] = await Promise.all(['catalog', 'case'].map(async name => JSON.parse(await readFile(new URL(`../data/${name}.schema.json`, import.meta.url), 'utf8'))));
const validate = createValidator(catalogSchema, caseSchema);

test('content validation rejects missing evidence sources, dangling links and unreachable goals', () => {
  const missingSource = structuredClone(treasure); missingSource.nodes[0].evidence.sourceIds = ['missing-source'];
  assert(validate(catalog, [missingSource]).some(e => e.includes('unknown source')));
  const dangling = structuredClone(treasure); dangling.edges[0].target = 'missing-word';
  assert(validate(catalog, [dangling]).some(e => e.includes('dangling')));
  const unreachable = structuredClone(treasure); unreachable.edges = unreachable.edges.filter(e => e.target !== 'treasure-3');
  assert(validate(catalog, [unreachable]).some(e => e.includes('unreachable goal')));
  const malformed = structuredClone(treasure); malformed.nodes[0].onclick = 'arbitrary code';
  assert(validate(catalog, [malformed]).some(e => e.includes('additional properties')));
});

test('a 500-case catalog validates as data without instantiating 500 active sessions', () => {
  const many = Array.from({length: 500}, (_, i) => ({...structuredClone(treasure), id: `case-${i}`}));
  assert.deepEqual(validate({...catalog, rules: {...catalog.rules, shortCaseHopExceptions: {}}, collections: [{id: 'many', title: 'Many words', description: 'Scale test', caseIds: many.map(c => c.id)}]}, many), []);
});

test('theories have rewards, consequences, and no repeat-point farming', () => {
  const engine = new Investigation(catalog, treasure);
  engine.inspect('treasure-1');
  const first = engine.answer('treasure-1', 'yes');
  assert.equal(first.earned, catalog.rules.correctPoints);
  engine.follow('treasure-1');
  engine.inspect('treasure-german');
  const mistaken = engine.answer('treasure-german', 'yes');
  assert.equal(mistaken.correct, false);
  assert.equal(mistaken.deducted, catalog.rules.wrongPenalty);
  assert(!engine.tested.has('treasure-german-lead'));
  assert.equal(engine.currentId, 'treasure-1');
  const corrected = engine.answer('treasure-german', 'no');
  assert.equal(corrected.earned, catalog.rules.assistedPoints);
  engine.follow('treasure-german');
  const score = engine.points;
  assert.equal(engine.answer('treasure-german', 'no').earned, 0);
  assert.equal(engine.points, score);
  const restored = new Investigation(catalog, treasure, engine.snapshot());
  assert.equal(restored.points, engine.points);
  assert.deepEqual([...restored.tested], [...engine.tested]);
  assert.equal(restored.currentId, 'treasure-1');
  engine.destroy(); restored.destroy();
});

test('optional authored clues reduce the reward without revealing all details at once', () => {
  const engine = new Investigation(catalog, treasure);
  engine.inspect('treasure-1');
  assert.deepEqual(engine.reveal('treasure-1'), engine.node('treasure-1').evidence.pages[0]);
  assert.equal(engine.revealed.get('treasure-1'), 1);
  assert.equal(engine.answer('treasure-1', 'yes').earned, catalog.rules.assistedPoints);
  engine.follow('treasure-1');
  const restored = new Investigation(catalog, treasure, engine.snapshot());
  assert.equal(restored.revealed.get('treasure-1'), 1);
  assert.equal(restored.points, catalog.rules.assistedPoints);
  engine.destroy(); restored.destroy();
});

test('every case begins with at least three plausible leads and rewards are declared in data', () => {
  for (const wordCase of cases) {
    const engine = new Investigation(catalog, wordCase);
    assert(engine.outgoing().length >= 3, wordCase.id);
    for (const edge of wordCase.edges) assert.equal(edge.challenge.choices.filter(choice => choice.correct).length, 1);
    engine.destroy();
  }
});

test('Greek evidence stays available after a dinosaur detour through French', () => {
  const wordCase = cases.find(c => c.id === 'dinosaur');
  const engine = new Investigation(catalog, wordCase);
  go(engine, 'dinosaur-1');go(engine, 'dinosaur-french');
  assert.equal(engine.currentId, 'dinosaur-french');
  assert(engine.availableIds().includes('dinosaur-2'));
  assert.equal(engine.linkTo('dinosaur-2').source, 'dinosaur-1');
  go(engine, 'dinosaur-lizard');assert.equal(engine.nodeStatus('dinosaur-lizard'), 'excluded');
  assert(engine.availableIds().includes('dinosaur-2'));
  const restored = new Investigation(catalog, wordCase, engine.snapshot());
  assert(restored.availableIds().includes('dinosaur-2'));
  assert.equal(restored.nodeStatus('dinosaur-lizard'), 'excluded');
  go(restored, 'dinosaur-2');assert(restored.complete);
  engine.destroy();restored.destroy();
});

test('each case offers two distinct false trails, including a No decision from the start', () => {
  for (const wordCase of cases) {
    const engine = new Investigation(catalog, wordCase);
    const falseTrails = wordCase.edges.filter(e => catalog.relations[e.type].outcome === 'excluded');
    assert.equal(new Set(falseTrails.map(e => e.target)).size, 2, wordCase.id);
    assert(engine.outgoing().some(e => e.challenge.choices.some(c => c.id === 'no' && c.correct)), wordCase.id);
    engine.destroy();
  }
});

test('house comparisons reward rejecting a shared meaning while retaining genuine family connections', () => {
  const engine = new Investigation(catalog, cases.find(c => c.id === 'house'));
  engine.inspect('house-italian');
  assert.equal(engine.answer('house-italian', 'no').correct, true);
  engine.follow('house-italian');
  assert.equal(engine.nodeStatus('house-italian'), 'excluded');
  assert.equal(engine.currentId, 'house-now');
  assert(!engine.complete);
  go(engine, 'house-german');
  assert.equal(engine.nodeStatus('house-german'), 'connected');
  go(engine, 'house-old');
  assert(engine.complete);
  engine.destroy();
});

test('the whole week is available, with English forms and translated Roman naming ideas', () => {
  const week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const registeredWeek = cases.filter(c => week.includes(c.id));
  assert.deepEqual(registeredWeek.map(c => c.id), week);
  for (const wordCase of registeredWeek) {
    const engine = new Investigation(catalog, wordCase);
    const old = wordCase.nodes.find(n => n.id === wordCase.id + '-old');
    const latin = wordCase.nodes.find(n => n.id === wordCase.id + '-latin');
    assert.equal(old.languageId, 'old-english');
    assert.equal(latin.languageId, 'latin');
    assert(wordCase.edges.some(e => e.source === old.id && e.target === latin.id && e.type === 'translation'));
    go(engine, old.id);
    assert(!engine.complete, wordCase.id + ' still needs the older naming idea.');
    go(engine, latin.id);
    assert(engine.complete, wordCase.id);
    engine.destroy();
  }
});

test('place-name cases investigate scoped endings using the existing graph and scoring', () => {
  for (const id of ['grimsby','manchester']) {
    const wordCase = cases.find(c => c.id === id), engine = new Investigation(catalog,wordCase);
    const start = engine.node();
    assert.equal(start.segments.map(s => s.text).join(''),start.form);
    assert(wordCase.edges.some(e => e.sourceSegmentId));
    assert(wordCase.edges.some(e => e.type === 'formation'));
    const falseTrail = engine.outgoing().find(e => catalog.relations[e.type].outcome === 'excluded');
    go(engine,falseTrail.target);
    assert.equal(engine.nodeStatus(falseTrail.target),'excluded');
    assert.equal(engine.currentId,wordCase.startNodeId);
    while (!engine.complete) {
      const lead = engine.leads().find(e => catalog.relations[e.type].outcome === 'connected');
      assert(lead,`Missing next lead for ${id}`); go(engine,lead.target);
    }
    assert.equal(engine.points,3 * engine.tested.size);
    const restored = new Investigation(catalog,wordCase,engine.snapshot());
    assert(restored.complete); assert.equal(restored.points,engine.points);
    engine.destroy(); restored.destroy();
  }
});

test('segment validation rejects mismatched forms, duplicate IDs and dangling relationship scope', () => {
  const original = cases.find(c => c.id === 'grimsby');
  const mismatch = structuredClone(original); mismatch.nodes[0].segments[0].text='Wrong';
  assert(validate(catalog,[mismatch]).some(e => e.includes('segments must reproduce')));
  const duplicate = structuredClone(original); duplicate.nodes[0].segments[0].id='ending';
  assert(validate(catalog,[duplicate]).some(e => e.includes('duplicate segment')));
  const dangling = structuredClone(original); dangling.edges[0].sourceSegmentId='missing';
  assert(validate(catalog,[dangling]).some(e => e.includes('unknown source segment')));
});

test('collections reject missing, duplicate and ungrouped cases', () => {
  const unknown=structuredClone(catalog);unknown.collections[0].caseIds[0]='missing';
  assert(validate(unknown,cases).some(e=>e.includes('unknown case missing')));
  const duplicate=structuredClone(catalog);duplicate.collections[1].caseIds.push(duplicate.collections[0].caseIds[0]);
  assert(validate(duplicate,cases).some(e=>e.includes('duplicate grouped case')));
  const absent=structuredClone(catalog);absent.collections.find(c=>c.id==='weekdays').caseIds.pop();
  assert(validate(absent,cases).some(e=>e.includes('ungrouped case sunday')));
});

test('herring rewards true cousins and rejects the same-fish Scandinavian source theory', () => {
  const wordCase=cases.find(c=>c.id==='herring'),engine=new Investigation(catalog,wordCase);
  engine.inspect('herring-danish');assert.equal(engine.answer('herring-danish','no').correct,true);engine.follow('herring-danish');
  assert.equal(engine.nodeStatus('herring-danish'),'excluded');assert.equal(engine.currentId,'herring-now');
  for(const id of ['herring-dutch','herring-german','herring-old'])go(engine,id);
  assert(engine.complete);assert.equal(engine.points,12);
  assert.equal(engine.linkTo('herring-german').type,'related');
  assert(wordCase.completion.includes('uncertain'));
  engine.destroy();
});

test('colour and time cases keep shared ancestry distinct from direct borrowing', () => {
  for(const [id,relatives] of [['red',['red-french','red-italian']],['white',['white-german']],['night',['night-latin']]]) {
    const engine=new Investigation(catalog,cases.find(c=>c.id===id));
    for(const target of relatives) {assert.equal(engine.linkTo(target).type,'related');go(engine,target);assert.equal(engine.nodeStatus(target),'connected');}
    engine.destroy();
  }
  const day=new Investigation(catalog,cases.find(c=>c.id==='day'));day.inspect('day-latin');assert.equal(day.answer('day-latin','no').correct,true);day.destroy();
});

test('familiar regional words preserve place links and do not invent exact pixie origins', () => {
  const sandwich=new Investigation(catalog,cases.find(c=>c.id==='sandwich'));
  go(sandwich,'sandwich-earl');assert(!sandwich.complete);
  go(sandwich,'sandwich-town');assert(sandwich.complete);
  assert.equal(sandwich.node().placeId,'sandwich-kent');sandwich.destroy();
  const coat=new Investigation(catalog,cases.find(c=>c.id==='mackintosh'));
  go(coat,'mackintosh-computer');assert.equal(coat.nodeStatus('mackintosh-computer'),'excluded');
  go(coat,'mackintosh-architect');assert.equal(coat.nodeStatus('mackintosh-architect'),'excluded');
  go(coat,'mackintosh-chemist');assert(coat.complete);assert.equal(coat.node().placeId,'glasgow');coat.destroy();
  const pixie=cases.find(c=>c.id==='pixie');assert(pixie.completion.includes('uncertain'));
  assert.equal(pixie.nodes.find(n=>n.id==='pixie-west').placeId,'west-country');
  assert(catalog.collections.find(c=>c.id==='regional').caseIds.includes('pixie'));
  assert(!cases.some(c=>c.id==='bal-maiden'),'Specialist local vocabulary is not the requested regional theme.');
});

test('book attestations use normal scoring and keep textual evidence separate from ancestry', () => {
  const wordCase=cases.find(c=>c.id==='chortle'),engine=new Investigation(catalog,wordCase);
  const book=engine.node('chortle-book');
  assert.equal(book.kind,'attestation');assert.equal(book.evidence.textSource.claim,'attested-use');
  assert.equal(book.date.startYear,1871);assert.equal(book.evidence.textSource.editionDate,'1872');
  assert.equal(catalog.relations[engine.linkTo(book.id).type].category,'evidence');
  go(engine,'chortle-short');assert.equal(engine.nodeStatus('chortle-short'),'excluded');
  go(engine,book.id);assert(!engine.complete, 'A single book clue must not solve the case.');
  go(engine,'chortle-chuckle');assert(!engine.complete);
  go(engine,'chortle-chukken');assert(engine.complete);assert.equal(engine.points,12);
  assert.equal(engine.answer(book.id,'yes').earned,0);
  const restored=new Investigation(catalog,wordCase,engine.snapshot());
  assert(restored.complete);assert.equal(restored.points,12);
  restored.destroy();engine.destroy();
});

test('text evidence validation checks dates, references, excerpts and relationship targets', () => {
  const original=cases.find(c=>c.id==='chortle');
  const checks=[
    [d=>{d.nodes[1].evidence.textSource.focusText='missing word';},'highlighted text'],
    [d=>{d.nodes[1].evidence.textSource.sourceIds=['missing'];},'unknown source'],
    [d=>{d.nodes[1].date.endYear=1800;},'reversed evidence date'],
    [d=>{d.nodes[1].evidence.textSource.publicationYear=1900;},'outside evidence date'],
    [d=>{delete d.nodes[1].evidence.textSource;},'attestation needs'],
    [d=>{delete d.nodes[2].date.endYear;},'both range endpoints'],
    [d=>{d.edges[0].target='chortle-short';},'must target an attestation']
  ];
  for(const [change,message] of checks) {
    const modified=structuredClone(original);change(modified);
    assert(validate(catalog,cases.map(c=>c.id===original.id?modified:c)).some(e=>e.includes(message)),message);
  }
});

test('new cases need three required connected hops, with no credit for false trails or optional loops', () => {
  const original=cases.find(c=>c.id==='chortle');
  assert.equal(minimumRequiredHops(catalog, original),3);
  const check=(wordCase,cat=catalog)=>validate(cat,cases.map(c=>c.id===original.id?wordCase:c));
  const short=structuredClone(original);short.goalNodeIds=['chortle-book'];
  assert.equal(minimumRequiredHops(catalog,short),1,'Optional ingredients cannot disguise a one-hop goal.');
  assert(check(short).some(e=>e.includes('can finish in 1')));
  short.edges.push({...short.edges[0],id:'book-back',source:'chortle-book',target:'chortle-now',type:'spelling'});
  assert.equal(minimumRequiredHops(catalog,short),1,'Revisits and cycles do not lengthen the shortest solution.');
  const engine=new Investigation(catalog,original);
  go(engine,'chortle-short');go(engine,'chortle-french');go(engine,'chortle-book');
  assert(!engine.complete,'Two correct No answers cannot replace real forward hops.');
  go(engine,'chortle-snort');assert(!engine.complete,'A side branch cannot replace the required older evidence.');
  go(engine,'chortle-chuckle');assert(!engine.complete);
  go(engine,'chortle-chukken');assert(engine.complete);engine.destroy();
  const stricter=structuredClone(catalog);delete stricter.rules.shortCaseHopExceptions.window;
  assert(validate(stricter,cases).some(e=>e.startsWith('window ')&&e.includes('at least 3')));
  const regression=structuredClone(catalog);regression.rules.shortCaseHopExceptions.dinosaur=2;
  const shortened=structuredClone(cases.find(c=>c.id==='dinosaur'));shortened.goalNodeIds=['dinosaur-1'];
  assert(validate(regression,cases.map(c=>c.id==='dinosaur'?shortened:c)).some(e=>e.includes('short case regressed')));
});
