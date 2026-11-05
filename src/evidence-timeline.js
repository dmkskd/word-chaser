/** Map and timeline call the same inspection action, with the same graph state. */
export function renderEvidenceTimeline(container, engine, mode, onInspect) {
  container.replaceChildren();
  const doc = container.ownerDocument;
  const dated = engine.availableIds().map(id => engine.node(id)).filter(node => node.date && (mode.showMarkerDetails || engine.visited.has(node.id)));
  container.hidden = !dated.length;
  if (!dated.length) return;
  const heading = doc.createElement('h3'); heading.textContent = 'Follow the word through time';
  const note = doc.createElement('p'); note.textContent = mode.showMarkerDetails ? 'Open a dated clue here or find it on the map.' : 'Your discovered clues. Keep searching the map for the next one.';
  const list = doc.createElement('ol'); list.className = 'timeline-stops';
  dated.sort((a, b) => (a.date.startYear ?? Infinity) - (b.date.startYear ?? Infinity));
  for (const node of dated) {
    const visited = engine.visited.has(node.id), status = engine.nodeStatus(node.id);
    const item = doc.createElement('li'), button = doc.createElement('button'); button.type = 'button';
    button.className = `timeline-stop ${status}`; button.dataset.timelineId = node.id;
    button.setAttribute('aria-current', String(node.id === engine.currentId));
    const date = doc.createElement('strong'); date.textContent = node.date.label;
    const title = doc.createElement('span'); title.textContent = `${visited ? status === 'excluded' ? '✕ ' : '✓ ' : ''}${visited ? node.form : node.evidence.title}`;
    button.append(date, title); button.addEventListener('click', () => onInspect(node.id));
    item.append(button); list.append(item);
  }
  container.append(heading, note, list);
}
