// The renderer and sound share one clock: each shell rises before it bursts.
export const FIREWORK_DURATION = 5200;
export const FIREWORK_SHELLS = [
  {launch: 0, burst: .8, x: .25, y: .32, hue: 38},
  {launch: .7, burst: 1.5, x: .72, y: .28, hue: 190},
  {launch: 1.4, burst: 2.2, x: .49, y: .21, hue: 330}
];

export function sparkPosition(particle, age) {
  const distance = (1 - Math.exp(-1.15 * age)) / 1.15;
  return {x: particle.x + particle.vx * distance, y: particle.y + particle.vy * distance + 48 * age * age};
}

export function createFireworks(host = window) {
  let frame = null, active = false;
  function stop() {
    active = false;
    if (frame !== null) host.cancelAnimationFrame?.(frame);
    frame = null;
  }
  function start(container) {
    stop();
    const canvas = container.ownerDocument.createElement('canvas');
    canvas.className = 'fireworks-canvas'; container.replaceChildren(canvas);
    const ctx = canvas.getContext?.('2d');
    if (!ctx) return false;
    const box = container.getBoundingClientRect?.() || {}, ratio = Math.min(2, host.devicePixelRatio || 1);
    canvas.width = Math.round((box.width || 900) * ratio);
    canvas.height = Math.round((box.height || 650) * ratio);
    ctx.setTransform(canvas.width / 900, 0, 0, canvas.height / 650, 0, 0);
    const shells = FIREWORK_SHELLS.map((shell, index) => {
      const x = shell.x * 900, y = shell.y * 650;
      const sparks = Array.from({length: 98}, (_, i) => {
        const angle = i * Math.PI * 2 / 98 + Math.random() * .045;
        const speed = i < 76 ? 200 + Math.random() * 90 : 75 + Math.random() * 80;
        // Compress depth slightly, giving the burst a spherical spread.
        const depth = .65 + Math.random() * .35;
        return {x, y, vx: Math.cos(angle) * speed * depth, vy: Math.sin(angle) * speed,
          life: 1.85 + Math.random() * .85, color: `hsl(${i % 5 === 0 ? 43 : shell.hue}, 100%, ${62 + i % 3 * 10}%)`, seed: i + index};
      });
      return {...shell, x, y, startX: x + (index % 2 ? 65 : -65), sparks};
    });
    let began;
    active = true;
    function line(points, color, width, glow = 0) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.shadowBlur = glow; ctx.shadowColor = color;
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    }
    function draw(now) {
      if (!active) return;
      began ??= now;
      const time = (now - began) / 1000;
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, 900, 650); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const shell of shells) {
        if (time >= shell.launch && time < shell.burst) {
          const rocket = t => {
            const p = Math.max(0, Math.min(1, (t - shell.launch) / (shell.burst - shell.launch)));
            const rise = 1 - (1 - p) ** 2;
            return {x: shell.startX + (shell.x - shell.startX) * rise, y: 650 + (shell.y - 650) * rise};
          };
          ctx.globalAlpha = .9;
          line([rocket(Math.max(shell.launch, time - .1)), rocket(time)], '#ffcf78', 2.3, 9);
          const head = rocket(time); ctx.fillStyle = '#fff9db'; ctx.fillRect(head.x - 1.6, head.y - 1.6, 3.2, 3.2);
        }
        const age = time - shell.burst;
        if (age < 0) continue;
        if (age < .3) {
          ctx.shadowBlur = 0;
          const glow = ctx.createRadialGradient(shell.x, shell.y, 0, shell.x, shell.y, 48);
          glow.addColorStop(0, 'rgba(255,247,205,.65)'); glow.addColorStop(1, 'rgba(255,220,140,0)');
          ctx.globalAlpha = 1 - age / .3; ctx.fillStyle = glow; ctx.fillRect(shell.x - 48, shell.y - 48, 96, 96);
        }
        for (const spark of shell.sparks) {
          if (age >= spark.life) continue;
          ctx.globalAlpha = (1 - age / spark.life) ** 1.15 * (.83 + .17 * Math.sin(age * 19 + spark.seed));
          const head = sparkPosition(spark, age);
          const tail = Array.from({length: 5}, (_, i) => sparkPosition(spark, Math.max(0, age - (4 - i) * .035)));
          line(tail, spark.color, age < .6 ? 1.7 : 1.1);
          ctx.shadowBlur = age < 1.2 ? 6 : 2; ctx.shadowColor = spark.color;
          ctx.fillStyle = age < .18 ? '#fff9da' : spark.color;
          const size = age < .6 ? 2.5 : 1.5; ctx.fillRect(head.x - size / 2, head.y - size / 2, size, size);
        }
      }
      if (time < FIREWORK_DURATION / 1000 && host.requestAnimationFrame) frame = host.requestAnimationFrame(draw);
      else frame = null;
    }
    if (host.requestAnimationFrame) frame = host.requestAnimationFrame(draw);
    else draw(0);
    return true;
  }
  return {start, stop};
}
