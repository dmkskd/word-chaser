import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeech} from '../src/speech.js';
import {loadContent} from '../scripts/content.mjs';

const {catalog, cases} = await loadContent();
function audio(node) {
  const lang = catalog.languages[node.pronunciation.languageId];
  return {word: node.form, text: node.pronunciation.text, language: lang.voiceLabel, lang: lang.voiceTag, historical: lang.approximate, fallback: lang.fallback};
}
function setup(initial) {
  let voices = initial; const played = [], listeners = new Set();
  const status = {textContent: ''};
  globalThis.document = {getElementById: id => id === 'speech-status' ? status : {checked: false}};
  globalThis.window = {SpeechSynthesisUtterance: class {constructor(text) {this.text = text;}}, speechSynthesis: {getVoices: () => voices, cancel() {}, speak: u => played.push(u), addEventListener: (name, fn) => listeners.add(fn), removeEventListener: (name, fn) => listeners.delete(fn)}};
  return {speech: createSpeech(), played, status, setVoices(next) {voices = next; for (const fn of [...listeners]) fn();}};
}
const english = {name: 'English', voiceURI: 'english', lang: 'en-GB'};
const greek = {name: 'Greek woman', voiceURI: 'greek', lang: 'el-GR'};
const italian = {name: 'Italian woman', voiceURI: 'italian', lang: 'it-IT'};

test('pronunciation and approximation policies are read from JSON data', () => {
  const app = setup([english, greek, italian]);
  const piano = cases.find(c => c.id === 'piano').nodes[1];
  const roots = cases.find(c => c.id === 'dinosaur').nodes[2];
  app.speech.speak(audio(piano)); assert.equal(app.played.at(-1).voice, italian);
  app.speech.speak(audio(roots)); assert.equal(app.played.at(-1).voice, greek);
  assert.equal(app.played.at(-1).text, 'δεινός. σαῦρος.');
  app.setVoices([{name: 'Other Greek', voiceURI: 'other', lang: 'el-GR'}, english, greek]);
  app.speech.speak(audio(roots)); assert.equal(app.played.at(-1).voice, greek);
  app.setVoices([english]); app.speech.speak(audio(roots)); assert.equal(app.played.at(-1).voice, greek);
  app.speech.stop();
});

test('a late-loading matching voice is awaited rather than substituting English', () => {
  const app = setup([english]);
  const roots = cases.find(c => c.id === 'dinosaur').nodes[2];
  app.speech.speak(audio(roots)); assert.equal(app.played.length, 0);
  app.setVoices([english, greek]); assert.equal(app.played.length, 1); assert.equal(app.played[0].voice, greek);
  app.speech.stop();
});

test('explicit Latin approximation comes from the language catalog', () => {
  const app = setup([english, italian]);
  const latin = cases.find(c => c.id === 'school').nodes.find(n => n.languageId === 'latin');
  app.speech.speak(audio(latin)); assert.equal(app.played[0].voice, italian);
  assert(app.status.textContent.includes(catalog.languages.latin.fallback.label));
  app.speech.stop();
});
