/** Read-only explanations on earned edges; traversal and historical direction differ. */
export function renderWordDevelopments(container, engine, nodeId, mode, {expanded = false} = {}) {
  container.replaceChildren();
  const edges = engine.case.edges.filter(edge => edge.target === nodeId && edge.development && engine.reviewed.has(edge.id));
  container.hidden = !edges.length || (!mode.allowHints && !engine.complete);
  // Do not place locked answers or citations in the DOM.
  if (container.hidden) return;
  const doc = container.ownerDocument;
  const element = (tag, text, className) => {
    const el = doc.createElement(tag); el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const labels = {sound: 'Sound', spelling: 'Spelling', meaning: 'Meaning', shortening: 'Shortening', formation: 'Formation', borrowing: 'Borrowing'};
  const basisLabels = {documented: 'Dictionary or written evidence', reconstructed: 'Reconstructed sound history', uncertain: 'Uncertain explanation'};
  for (const edge of edges) {
    const development = edge.development;
    const from = engine.node(development.fromNodeId), to = engine.node(development.toNodeId);
    const details = doc.createElement(expanded ? 'section' : 'details'); details.className = 'word-development'; details.dataset.developmentEdge = edge.id;
    const summary = element(expanded ? 'h4' : 'summary', 'How it changed');
    details.append(summary, element('p', `${from.form} → ${to.form}`, 'development-forms'));
    details.append(element('p', `${engine.catalog.languages[from.languageId].name} · ${from.period} → ${engine.catalog.languages[to.languageId].name} · ${to.period}`, 'development-period'));
    details.append(element('p', development.summary, 'development-summary'));
    const list = doc.createElement('ol'); list.className = 'development-changes';
    for (const change of development.changes) {
      const item = doc.createElement('li');
      item.append(element('strong', labels[change.aspect]), element('p', change.text));
      const sources = doc.createElement('details'); sources.className = 'development-sources';
      sources.append(element('summary', 'Sources · ' + basisLabels[change.basis]));
      for (const id of change.sourceIds) {
        const source = engine.case.sources.find(value => value.id === id);
        const link = element('a', source.title + ' ↗'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener';
        sources.append(link);
      }
      item.append(sources); list.append(item);
    }
    details.append(list, element('p', development.note, 'development-note'));
    container.append(details);
  }
}
