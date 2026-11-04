// Original detective jazz-fusion, rendered as decaying instrument samples rather than
// steady game-console waveforms. Keep the score and mix editable in JSON.
export function renderMusicNote(pitch, duration, voice, sampleRate) {
  const samples = new Float32Array(Math.ceil(sampleRate * duration));
  const frequency = 440 * 2 ** (((pitch || 60) - 69) / 12);
  let breath = 0, previousNoise = 0, peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate, remaining = duration - t;
    const noise = Math.random() * 2 - 1;
    let value = 0;
    if (voice === 'kick') {
      value = Math.sin(2 * Math.PI * (50 * t + 70 * .018 * (1 - Math.exp(-t / .018)))) * Math.exp(-t * 14);
    } else if (voice === 'snare') {
      breath = breath * .35 + noise * .65;
      value = breath * .6 * Math.exp(-t * 23) + Math.sin(2 * Math.PI * 185 * t) * .22 * Math.exp(-t * 36);
    } else if (voice === 'hat') {
      value = (noise - previousNoise) * .28 * Math.exp(-t * 48);
      previousNoise = noise;
    } else if (voice === 'keys') {
      const phase = 2 * Math.PI * frequency * t;
      value = (Math.sin(phase) + .2 * Math.sin(phase * 2) * Math.exp(-t * 4)
        + .055 * Math.sin(phase * 3) * Math.exp(-t * 7)) * .7 * Math.exp(-t * 1.6);
      value *= 1 - Math.exp(-t * 180);
    } else if (voice === 'brush') {
      value = (noise - previousNoise) * .4 * Math.exp(-t * 24);
      previousNoise = noise;
    } else if (voice === 'vibes') {
      // Tuned bar partials and a gentle motor tremolo: no buzzy sustained reed.
      value = .78 * Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 1.6)
        + .1 * Math.sin(2 * Math.PI * frequency * 4 * t) * Math.exp(-t * 4.5);
      value *= (1 - Math.exp(-t * 180)) * (.94 + .06 * Math.cos(2 * Math.PI * 5.2 * t));
    } else if (voice === 'reed') {
      const phase = 2 * Math.PI * frequency * t + .09 * (1 - Math.cos(2 * Math.PI * 5 * t)) * Math.min(1, t / .18);
      for (const [harmonic, strength] of [[1, .7], [2, .05], [3, .22], [5, .08], [7, .025]]) {
        if (frequency * harmonic < sampleRate * .45) value += strength * Math.sin(phase * harmonic);
      }
      breath = breath * .8 + noise * .2;
      value = (value + breath * .025) * (1 - Math.exp(-t * 65)) * Math.exp(-t / (duration * 2));
    } else {
      const bass = voice === 'bass';
      for (let harmonic = 1; harmonic <= (bass ? 6 : 12); harmonic++) {
        const partial = frequency * harmonic * Math.sqrt(1 + (bass ? .00002 : .00012) * harmonic ** 2);
        if (partial >= sampleRate * .45) continue;
        value += Math.sin(2 * Math.PI * partial * t) * harmonic ** (bass ? -2 : -1.7) * Math.exp(-t * (bass ? 3 + harmonic : 1.8 + harmonic * .8));
      }
      value *= (1 - Math.exp(-t * (bass ? 160 : 260))) * .75;
    }
    samples[i] = value * Math.min(1, remaining / .07, t / .003);
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  if (peak > .9) for (let i = 0; i < samples.length; i++) samples[i] *= .9 / peak;
  return samples;
}

export function createDetectiveMusic(score, host = window) {
  const Audio = host.AudioContext || host.webkitAudioContext;
  const beat = 60 / score.bpm, loopLength = score.bars.length * score.beatsPerBar * beat;
  const events = [];
  score.bars.forEach((bar, index) => {
    const base = index * score.beatsPerBar;
    const push = (offset, pitch, duration, voice, velocity = 1, delay = 0) => {
      events.push({beat: base + offset, pitch, duration, voice, velocity, delay});
    };
    bar.bass.forEach((note, i) => {
      const [offset, pitch, duration, velocity] = Array.isArray(note) ? note : [i, note, .88, i % 2 ? .86 : 1];
      push(offset, pitch, duration, 'bass', velocity, .004);
    });
    bar.melody.forEach(([offset, pitch, duration, velocity = 1], i) => push(offset, pitch, duration, score.leadVoice, velocity, .009 + (i % 3) * .003));
    // Comp behind the beat, rolling the voicing rather than hitting every key together.
    const comp = bar.comp || score.chordOffsets;
    for (const [hit, offset] of comp.entries()) for (const [i, pitch] of bar.chord.entries()) {
      push(offset, pitch, .95, 'piano', hit % 2 ? .72 : .9, .016 + i * .009);
    }
    for (const [offset, voice, velocity, duration] of score.drums) push(offset, undefined, duration, voice, velocity);
    if (index % 8 === 7) {
      push(3.25, undefined, .14, 'snare', .38); push(3.75, undefined, .14, 'snare', .48);
    }
  });
  events.sort((a, b) => (a.beat - b.beat) * beat + a.delay - b.delay);
  let context = null, master = null, timer = null, enabled = true, ducked = false;
  function stop() {
    if (timer !== null) host.clearInterval(timer);
    timer = null;
    const previous = context; context = null; master = null;
    try { previous?.close()?.catch?.(() => {}); } catch { /* Already closed. */ }
  }
  function setEnabled(value) { enabled = value; if (!enabled) stop(); }
  function setDucked(value) {
    ducked = value;
    if (master && context) master.gain.setTargetAtTime(ducked ? score.mix.speechGain : score.mix.musicGain, context.currentTime, .09);
  }
  function start() {
    if (!enabled || !Audio) return false;
    // Called by user interactions; resume again if Safari suspended the context.
    if (context) { try { context.resume()?.catch?.(() => {}); } catch {} return true; }
    try {
      context = new Audio(); const ctx = context;
      ctx.resume()?.catch?.(() => {});
      master = ctx.createGain(); master.gain.value = ducked ? score.mix.speechGain : score.mix.musicGain;
      // Gentle compression catches overlapping notes without making the mix harsh.
      const output = ctx.createDynamicsCompressor?.();
      if (output) { master.connect(output); output.connect(ctx.destination); }
      else master.connect(ctx.destination);
      let room = null, roomSend = null;
      if (ctx.createConvolver) {
        room = ctx.createConvolver(); roomSend = ctx.createGain(); roomSend.gain.value = .12;
        const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * .48), ctx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * .09));
        }
        room.buffer = impulse; roomSend.connect(room); room.connect(master);
      }
      const buffers = new Map(), sampleRate = Math.min(ctx.sampleRate, 22050);
      function note(event, time) {
        const duration = event.duration * beat;
        const key = `${event.voice}:${event.pitch}:${duration}`;
        if (!buffers.has(key)) {
          const samples = renderMusicNote(event.pitch, duration, event.voice, sampleRate);
          const buffer = ctx.createBuffer(1, samples.length, sampleRate);
          buffer.getChannelData(0).set(samples); buffers.set(key, buffer);
        }
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        source.buffer = buffers.get(key);
        gain.gain.value = {bass: .5, keys: .5, vibes: .46, reed: .3, piano: .15, brush: .075, kick: .36, snare: .18, hat: .09}[event.voice] * event.velocity;
        source.connect(gain);
        const pan = ctx.createStereoPanner?.();
        if (pan) {
          pan.pan.value = {bass: 0, keys: .12, vibes: .16, reed: .16, piano: -.24, brush: .28, kick: 0, snare: -.08, hat: .28}[event.voice];
          gain.connect(pan); pan.connect(master);
        } else gain.connect(master);
        if (roomSend && !['bass', 'kick', 'hat'].includes(event.voice)) gain.connect(roomSend);
        source.onended = () => { source.disconnect(); gain.disconnect(); pan?.disconnect(); };
        source.start(time); source.stop(time + duration + .01);
      }
      let cursor = 0, origin = ctx.currentTime + .05;
      function schedule() {
        if (context !== ctx) return;
        const now = ctx.currentTime;
        if (origin + loopLength < now) { origin += Math.floor((now - origin) / loopLength) * loopLength; cursor = 0; }
        while (origin + events[cursor].beat * beat + events[cursor].delay < now + .35) {
          const event = events[cursor], time = origin + event.beat * beat + event.delay;
          if (time >= now) note(event, time);
          if (++cursor === events.length) { cursor = 0; origin += loopLength; }
        }
      }
      schedule(); timer = host.setInterval(schedule, 100);
      return true;
    } catch { stop(); return false; }
  }
  return {supported: !!Audio, start, stop, setEnabled, setDucked};
}
