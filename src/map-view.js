const NS = 'http://www.w3.org/2000/svg';
export function svgNode(tag, attrs = {}, text) {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

/** A geographic view of the graph. Camera state never modifies investigation state. */
export class MapView {
  constructor(svg, geometry, {onInspect, onHelp, onSpeak, onHover, onDismiss}) {
    this.svg = svg;
    this.onInspect = onInspect;
    this.onHelp = onHelp;
    this.onSpeak = onSpeak;
    this.onHover = onHover; this.onDismiss = onDismiss; this.suppressClickUntil = 0;
    this.view = [0, 0, 900, 650];
    this.lens = [334, 316];
    this.hitNodes = [];
    this.animation = 0;
    this.version = 0;
    this.start = null;
    this.touchPoints = new Map();
    this.pinching = false;
    this.pinchDistance = 0;
    for (const country of geometry.countries) document.getElementById('countries').append(svgNode('path', {d: country.path, class: 'country'}));
    for (const label of geometry.labels) document.getElementById('labels').append(svgNode('text', {x: label.point[0], y: label.point[1], class: 'map-label' + (label.sea ? ' sea-label' : ''), 'text-anchor': 'middle'}, label.text));
    this.bindEvents();
    this.setLens(...this.lens);
  }
  coordinates(event) {
    const box = this.svg.getBoundingClientRect();
    const [x, y, w, h] = this.view;
    const scale = Math.min(box.width / w, box.height / h);
    return [x + (event.clientX - box.left - (box.width - w * scale) / 2) / scale, y + (event.clientY - box.top - (box.height - h * scale) / 2) / scale];
  }
  setLens(x, y) {
    const [vx, vy, w, h] = this.view, scale = w / 900;
    this.lens = [Math.max(vx + 20 * scale, Math.min(vx + w - 20 * scale, x)), Math.max(vy + 20 * scale, Math.min(vy + h - 20 * scale, y))];
    const [a, b] = this.lens;
    document.getElementById('glass').setAttribute('transform', `translate(${a} ${b}) scale(${scale})`);
    for (const id of ['clip-circle', 'glass-tint']) {
      const circle = document.getElementById(id);
      circle.setAttribute('cx', a); circle.setAttribute('cy', b); circle.setAttribute('r', 57 * scale);
    }
    document.getElementById('magnified').setAttribute('transform', `translate(${a} ${b}) scale(1.45) translate(${-a} ${-b})`);
    this.onHover?.(this.hit()?.id || null);
  }
  applyView(view) {
    this.view = view;
    this.svg.setAttribute('viewBox', view.join(' '));
    document.getElementById('zoom-reset').hidden = view[2] >= 899.9;
    this.setLens(...this.lens);
  }
  zoom(factor, anchor = this.lens, smooth = false) {
    const from = [...this.view], [x, y, w, h] = from, width = Math.max(225, Math.min(900, w * factor)), height = width * 650 / 900;
    const to = [Math.max(0, Math.min(900 - width, anchor[0] - (anchor[0] - x) * width / w)), Math.max(0, Math.min(650 - height, anchor[1] - (anchor[1] - y) * height / h)), width, height];
    this.cancelAnimation(); const version = this.version;
    if (!smooth || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || typeof requestAnimationFrame !== 'function') { this.applyView(to); return; }
    let start;
    const frame = time => {
      if (version !== this.version) return;
      start ??= time;
      const t = Math.min(1, (time - start) / 450), eased = t * t * (3 - 2 * t);
      this.applyView(from.map((v, i) => v + (to[i] - v) * eased));
      this.animation = t < 1 ? requestAnimationFrame(frame) : 0;
    };
    this.animation = requestAnimationFrame(frame);
  }
  cancelAnimation() { this.version++; if (this.animation && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.animation); this.animation = 0; }
  reset() { this.cancelAnimation(); this.applyView([0, 0, 900, 650]); }
  focus(point, smooth = true) { this.setLens(...point); this.zoom(.7, point, smooth); }
  hit(point = this.lens) {
    // The objects the child can see are exactly the objects that can be inspected.
    const radius = Math.max(17, 24 * this.view[2] / 900);
    return this.hitNodes.map(node => ({...node, distance: Math.hypot(point[0] - node.point[0], point[1] - node.point[1])})).filter(node => node.distance < radius).sort((a, b) => a.distance - b.distance)[0] || null;
  }
  activate() {
    const hit = this.hit();
    if (hit) this.onInspect(hit.id);
    else { this.zoom(.72, this.lens, true); this.onHelp(false); }
  }
  render(engine, catalog, eraId) {
    this.engine = engine;
    const edges = document.getElementById('trails'), nodes = document.getElementById('pins');
    edges.replaceChildren(); nodes.replaceChildren();
    const pointFor = node => { const place = catalog.places[node.placeId]; return [place.x + node.offset[0], place.y + node.offset[1]]; };
    const available = new Set(engine.availableIds());
    this.hitNodes = [];
    for (const edge of engine.visibleEdges()) {
      if (!engine.reviewed.has(edge.id)) continue;
      const relation = catalog.relations[edge.type], a = pointFor(engine.node(edge.source)), b = pointFor(engine.node(edge.target));
      const reviewed = engine.reviewed.has(edge.id);
      const bend = edge.source < edge.target ? 25 : -25;
      const path = `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2 + bend},${(a[1] + b[1]) / 2} ${b[0]},${b[1]}`;
      edges.append(svgNode('path', {d: path, class: `graph-edge ${relation.line} ${relation.category} ${reviewed ? 'reviewed' : 'lead'} ${relation.outcome === 'excluded' ? 'excluded-edge' : ''}`}));
      if (edge.timeLabel) {
        const label = `◷ ${edge.timeLabel}`, width = label.length * 4.6 + 16;
        const stamp = svgNode('g', {class: 'trail-time', transform: `translate(${(a[0] + b[0]) / 2 + bend / 2} ${(a[1] + b[1]) / 2})`, 'aria-label': `Travel through time: ${edge.timeLabel}`});
        stamp.append(svgNode('rect', {x: -width / 2, y: -10, width, height: 20, rx: 10}), svgNode('text', {y: 3, 'text-anchor': 'middle'}, label));
        edges.append(stamp);
      }
    }
    for (const id of available) {
      const node = engine.node(id), point = pointFor(node), visited = engine.visited.has(id), current = id === engine.currentId, inEra = node.eraId === eraId;
      const artifact = catalog.artifacts[node.evidence.kind], era = catalog.eras[node.eraId], status = engine.nodeStatus(id);
      const group = svgNode('g', {transform: `translate(${point[0]} ${point[1]})`, class: `evidence-node ${current ? 'current' : ''} ${visited ? 'visited' : 'candidate'} ${status} ${inEra ? '' : 'other-era'}`, role: 'button', tabindex: 0, 'data-node-id': id, 'aria-label': `${visited ? node.form : catalog.languages[node.languageId].name}. ${catalog.places[node.placeId].name}, ${era.name}. ${status === 'excluded' ? 'Not our trail.' : visited ? 'Connected.' : 'An unsolved clue.'} Inspect evidence.`});
      group.append(svgNode('circle', {r: 19, class: 'artifact-disc'}), svgNode('text', {y: 6, 'text-anchor': 'middle', class: 'artifact-icon'}, artifact.icon));
      const badge = svgNode('g', {transform: 'translate(14 -14)', class: 'decision-badge', 'aria-hidden': 'true'});
      badge.append(svgNode('circle', {r: 9, class: 'decision-disc'}), svgNode('text', {y: 4, 'text-anchor': 'middle', class: 'decision-mark'}, status === 'excluded' ? '✕' : visited ? '✓' : '?'));
      group.append(badge);
      const labelLeft = node.mapLabelSide === 'left' || (!node.mapLabelSide && point[0] > 740);
      const labelPosition = labelLeft ? {x: -26, 'text-anchor': 'end'} : {x: 26};
      group.append(svgNode('text', {...labelPosition, y: -4, class: 'artifact-title'}, visited ? node.form : node.mapTitle || catalog.languages[node.languageId].name));
      group.append(svgNode('text', {...labelPosition, y: 11, class: 'artifact-era'}, status === 'excluded' ? '✕ Not our trail' : `${era.icon} ${visited && node.mapCaption ? node.mapCaption : era.name}`));
      group.addEventListener('pointerdown', event => { if (event.pointerType !== 'touch') event.stopPropagation(); });
      group.addEventListener('pointerup', event => { if (event.pointerType !== 'touch') event.stopPropagation(); });
      group.addEventListener('click', event => { event.stopPropagation(); if (Date.now() >= this.suppressClickUntil) this.onInspect(id); });
      group.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); this.onInspect(id); } });
      nodes.append(group); this.hitNodes.push({id, point});
    }
    this.onHover?.(this.hit()?.id || null);
  }
  bindEvents() {
    const svg = this.svg;
    svg.addEventListener('pointerdown', event => {
      this.onDismiss?.();
      this.start = [event.clientX, event.clientY];
      svg.setPointerCapture?.(event.pointerId);
      if (event.pointerType === 'touch') this.suppressClickUntil = Date.now() + 700;
      if (event.pointerType === 'touch') this.touchPoints.set(event.pointerId, [event.clientX, event.clientY]);
      if (this.touchPoints.size === 2) { const [a, b] = [...this.touchPoints.values()]; this.pinchDistance = Math.hypot(a[0] - b[0], a[1] - b[1]); this.pinching = true; this.start = null; return; }
      this.setLens(...this.coordinates(event));
    });
    svg.addEventListener('pointermove', event => {
      if (this.touchPoints.has(event.pointerId)) this.touchPoints.set(event.pointerId, [event.clientX, event.clientY]);
      if (this.touchPoints.size === 2) { const [a, b] = [...this.touchPoints.values()], distance = Math.hypot(a[0] - b[0], a[1] - b[1]); if (distance && this.pinchDistance) this.zoom(this.pinchDistance / distance, this.coordinates({clientX: (a[0] + b[0]) / 2, clientY: (a[1] + b[1]) / 2})); this.pinchDistance = distance; return; }
      if (!this.pinching && (event.pointerType !== 'touch' || this.start)) this.setLens(...this.coordinates(event));
    });
    svg.addEventListener('pointerup', event => {
      if (event.pointerType === 'touch') this.suppressClickUntil = Date.now() + 700;
      this.touchPoints.delete(event.pointerId);
      if (!this.pinching && this.start && Math.hypot(event.clientX - this.start[0], event.clientY - this.start[1]) < 10) this.activate();
      if (!this.touchPoints.size) { this.pinching = false; this.pinchDistance = 0; } this.start = null;
    });
    svg.addEventListener('pointercancel', event => { this.touchPoints.delete(event.pointerId); this.start = null; if (!this.touchPoints.size) this.pinching = false; });
    svg.addEventListener('pointerleave', () => { if (!this.start) this.onHover?.(null); });
    svg.addEventListener('wheel', event => { event.preventDefault(); const point = this.coordinates(event); this.setLens(...point); this.zoom(Math.exp(Math.max(-100, Math.min(100, event.deltaY * (event.deltaMode === 1 ? 16 : 1))) * .002), point); }, {passive: false});
    svg.addEventListener('keydown', event => {
      if (event.target !== svg) return;
      if (['Enter', ' '].includes(event.key)) { event.preventDefault(); this.activate(); }
      else if (event.key.toLowerCase() === 'h') { event.preventDefault(); this.onHelp(true); }
      else if (event.key.toLowerCase() === 'p') { event.preventDefault(); this.onSpeak(this.hit()?.id); }
      else if (event.key === 'Escape') this.reset();
      else if (['+', '=', '-', '_'].includes(event.key)) { event.preventDefault(); this.zoom(['+', '='].includes(event.key) ? .8 : 1.25, this.lens, true); }
      else if (event.key.startsWith('Arrow')) { const directions = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}, move = directions[event.key]; if (move) { event.preventDefault(); const step = (event.shiftKey ? 35 : 12) * this.view[2] / 900; this.setLens(this.lens[0] + move[0] * step, this.lens[1] + move[1] * step); } }
    });
  }
}
