import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDetectiveMusic, renderMusicNote} from '../src/detective-music.js';

const score = JSON.parse(await readFile(new URL('../data/detective-music.json', import.meta.url), 'utf8'));
function setup() {
  const contexts = [], intervals = new Map(); let id = 0;
  const param = () => ({value: 0, targets: [], setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime(value) {this.targets.push(value);}});
  class AudioContext {
    constructor() {this.currentTime = 10; this.sampleRate = 8000; this.events = []; this.gains = []; this.buffers = []; contexts.push(this);}
    resume() {return Promise.resolve();}
    close() {this.closed = true; return Promise.resolve();}
    createGain() {const gain = {gain: param(), connect() {}, disconnect() {}}; this.gains.push(gain); return gain;}
    createBuffer(channels, size) {
      const data = Array.from({length: channels}, () => new Float32Array(size));
      this.buffers.push(data); return {getChannelData: channel => data[channel]};
    }
    createDynamicsCompressor() {return {connect() {}};}
    createConvolver() {return {connect() {}};}
    source() {return {frequency: param(), connect() {}, disconnect() {}, start: time => this.events.push(time), stop() {}};}
    createBufferSource() {return this.source();}
    createOscillator() {return this.source();}
  }
  const music = createDetectiveMusic(score, {AudioContext, setInterval(fn) {intervals.set(++id, fn); return id;}, clearInterval(key) {intervals.delete(key);}});
  return {music, contexts, intervals};
}

test('music starts only on request and repeated interactions do not stack loops', () => {
  const {music, contexts, intervals} = setup();
  assert.equal(contexts.length, 0, 'Constructing the app does not autoplay.');
  assert(music.start());
  const first = contexts[0].events.length;
  music.start(); music.start();
  assert.equal(contexts.length, 1);
  assert.equal(intervals.size, 1);
  assert.equal(contexts[0].events.length, first);
  music.stop();
  assert(contexts[0].closed); assert.equal(intervals.size, 0);
});

test('the scheduler continues across a loop boundary without backdating or piling up notes', () => {
  const {music, contexts, intervals} = setup(); music.start();
  const ctx = contexts[0], before = ctx.events.length;
  ctx.currentTime += score.bars.length * score.beatsPerBar * 60 / score.bpm + .3;
  [...intervals.values()][0]();
  const next = ctx.events.slice(before);
  assert(next.length > 0);
  assert(next.every(time => time >= ctx.currentTime && time < ctx.currentTime + .35));
  assert(next.length < 20, 'A delayed frame does not play a backlog of music.');
  music.stop();
});

test('speech lowers the music, and muting closes the audio and prevents further starts', () => {
  const {music, contexts, intervals} = setup(); music.start();
  const master = contexts[0].gains[0].gain;
  music.setDucked(true); const quiet = master.targets.at(-1);
  music.setDucked(false); assert(quiet < master.targets.at(-1));
  music.setEnabled(false);
  assert(contexts[0].closed); assert.equal(intervals.size, 0);
  assert.equal(music.start(), false); assert.equal(contexts.length, 1);
  music.setEnabled(true); assert(music.start()); music.stop();
});

test('missing browser audio support leaves music controls safe to disable', () => {
  const music = createDetectiveMusic(score, {});
  assert.equal(music.supported, false); assert.equal(music.start(), false);
  music.setDucked(true); music.setEnabled(false); music.stop();
});


test('instrument samples have audible decays and clean ends rather than sustained console tones', () => {
  for (const voice of ['bass', 'keys', 'piano', 'brush', 'kick', 'snare', 'hat']) {
    const data = renderMusicNote(voice === 'bass' ? 38 : 65, .8, voice, 22050);
    assert(data.every(Number.isFinite));
    const peak = data.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    assert(peak > .1 && peak <= .901, voice);
    assert(data[0] === 0);
    assert(Math.abs(data.at(-1)) < .001, 'Release avoids a click at the end.');
  }
  const {music, contexts} = setup(); music.start();
  assert.equal(contexts[0].gains[0].gain.value, score.mix.musicGain);
  assert(score.mix.musicGain >= .38, 'The normal mix is substantially louder.');
  assert(contexts[0].buffers.some(channels => channels[0].some(value => value !== 0)));
  music.setDucked(true);
  assert.equal(contexts[0].gains[0].gain.targets.at(-1), score.mix.speechGain);
  music.stop();
});
