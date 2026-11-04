import test from 'node:test';
import assert from 'node:assert/strict';
import {sparkPosition, createFireworks} from '../src/fireworks.js';
import {createFireworkSound} from '../src/firework-sound.js';

test('sparks spread, slow down and fall under gravity', () => {
  const spark = {x: 0, y: 200, vx: 160, vy: -170};
  const early = sparkPosition(spark, .5), middle = sparkPosition(spark, 1), late = sparkPosition(spark, 2);
  assert(early.x > 0 && early.y < spark.y, 'An upward spark initially rises and spreads.');
  assert(middle.x - early.x < early.x, 'Air resistance slows outward travel.');
  assert(late.y > middle.y, 'The spark falls after its initial upward movement.');
});

test('stopping the particle renderer cancels its animation frame', () => {
  let queued, cancelled, id = 0;
  const ctx = {setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillRect() {}, createRadialGradient() { return {addColorStop() {}}; }};
  const canvas = {getContext: () => ctx};
  const container = {ownerDocument: {createElement: () => canvas}, replaceChildren() {}, getBoundingClientRect: () => ({width: 900, height: 650})};
  const renderer = createFireworks({requestAnimationFrame(fn) {queued = fn; return ++id;}, cancelAnimationFrame(value) {cancelled = value;}});
  assert(renderer.start(container));
  queued(0); queued(1000);
  renderer.stop();
  assert.equal(cancelled, id);
  queued(1100);
  assert.equal(cancelled, id, 'A stale frame does not schedule more work.');
});

function audioHost() {
  const contexts = [];
  const param = () => ({value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}});
  class AudioContext {
    constructor() {this.currentTime = 10; this.sampleRate = 8000; this.events = []; contexts.push(this);}
    resume() {return Promise.resolve();}
    close() {this.closed = true; return Promise.resolve();}
    createGain() {return {gain: param(), connect() {}};}
    createBiquadFilter() {return {frequency: param(), Q: param(), connect() {}};}
    createBuffer(channels, size) {return {getChannelData: () => new Float32Array(size)};}
    source(kind) {return {frequency: param(), connect() {}, start: time => this.events.push({kind, time}), stop() {}};}
    createBufferSource() {return this.source('noise');}
    createOscillator() {return this.source('boom');}
  }
  return {host: {AudioContext}, contexts};
}

test('launch sound precedes the boom; muting cancels audio and future playback', () => {
  const {host, contexts} = audioHost(), sound = createFireworkSound(host);
  assert(sound.play([{launch: 0, burst: .8}]));
  const ctx = contexts[0], boom = ctx.events.find(e => e.kind === 'boom');
  assert(ctx.events.some(e => e.kind === 'noise' && e.time < boom.time), 'A rising whoosh precedes the burst.');
  assert(ctx.events.some(e => e.kind === 'noise' && e.time > boom.time), 'Crackles follow the burst.');
  assert(ctx.events.every(e => e.time >= ctx.currentTime));
  sound.setEnabled(false);
  assert(ctx.closed);
  assert.equal(sound.play([{launch: 0, burst: .8}]), false);
  assert.equal(contexts.length, 1);
  sound.setEnabled(true); sound.play([{launch: 0, burst: .8}]); sound.stop();
  assert(contexts[1].closed);
});

test('unsupported audio and unavailable canvas leave the game usable', () => {
  const sound = createFireworkSound({});
  assert.equal(sound.supported, false);
  assert.equal(sound.play([]), false); sound.stop();
  const renderer = createFireworks({});
  assert.equal(renderer.start({ownerDocument: {createElement: () => ({})}, replaceChildren() {}}), false);
  renderer.stop();
});
