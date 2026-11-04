// Offline, synthesized launch, low boom and scattered crackles. No audio downloads.
export function createFireworkSound(host = window) {
  const Audio = host.AudioContext || host.webkitAudioContext;
  let context = null, enabled = true;
  const supported = !!Audio;
  function stop() {
    const previous = context; context = null;
    try { previous?.close()?.catch?.(() => {}); } catch { /* Already closed. */ }
  }
  function setEnabled(value) { enabled = value; if (!enabled) stop(); }
  function play(shells) {
    stop();
    if (!enabled || !supported) return false;
    try {
      context = new Audio();
      const ctx = context, start = ctx.currentTime + .025;
      ctx.resume()?.catch?.(() => {});
      const master = ctx.createGain(); master.gain.value = .22; master.connect(ctx.destination);
      const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1.2), ctx.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      function hiss(time, duration, frequency, volume, type = 'bandpass', endingFrequency = frequency) {
        const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
        source.buffer = noise; filter.type = type; filter.Q.value = .7;
        filter.frequency.setValueAtTime(frequency, time);
        filter.frequency.exponentialRampToValueAtTime(endingFrequency, time + duration);
        gain.gain.setValueAtTime(.001, time);
        gain.gain.exponentialRampToValueAtTime(volume, time + Math.min(.025, duration / 4));
        gain.gain.exponentialRampToValueAtTime(.001, time + duration);
        source.connect(filter); filter.connect(gain); gain.connect(master);
        source.start(time); source.stop(time + duration);
      }
      for (const shell of shells) {
        const launch = start + shell.launch, burst = start + shell.burst;
        hiss(launch, shell.burst - shell.launch, 650, .12, 'bandpass', 2400);
        const boom = ctx.createOscillator(), gain = ctx.createGain();
        boom.type = 'sine'; boom.frequency.setValueAtTime(105, burst); boom.frequency.exponentialRampToValueAtTime(38, burst + .5);
        gain.gain.setValueAtTime(.001, burst); gain.gain.exponentialRampToValueAtTime(.65, burst + .018);
        gain.gain.exponentialRampToValueAtTime(.001, burst + .8);
        boom.connect(gain); gain.connect(master); boom.start(burst); boom.stop(burst + .85);
        hiss(burst, .75, 850, .48, 'lowpass', 150);
        for (let i = 0; i < 19; i++) {
          hiss(burst + .14 + i * .075 + Math.random() * .04, .025 + Math.random() * .04, 1900 + Math.random() * 2800, .06 + Math.random() * .09, 'highpass');
        }
      }
      return true;
    } catch { stop(); return false; }
  }
  return {supported, play, stop, setEnabled};
}
