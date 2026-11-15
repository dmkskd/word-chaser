import {renderWordDevelopments} from './word-development.js';

/** A sourced genealogy projection of earned graph evidence, never inferred from spelling. */
export function renderFamilyTree(container, engine, mode, onInspect) {
  container.replaceChildren();
  const tree = engine.case.familyTree;
  if (!tree) return;
  const doc = container.ownerDocument;
  const el = (tag, text, className) => {
    const element = doc.createElement(tag); element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  container.append(el('h2', `The ${engine.case.title} family`), el('p', 'Read from older ancestors at the top to newer words below.', 'family-direction'));
  const earned = tree.nodes.filter(node => (!node.nodeId || engine.visited.has(node.nodeId)) &&
    (!node.revealEdgeIds || node.revealEdgeIds.every(id => engine.reviewed.has(id))));
  const visibleIds = new Set(earned.map(node => node.id));
  const list = doc.createElement('ul'); list.className = 'family-branches family-roots';
  function branch(node) {
    const item = doc.createElement('li'); item.dataset.familyId = node.id;
    if (node.nodeId && (mode.allowHints || engine.complete)) {
      for (const edge of engine.case.edges.filter(edge => edge.development?.toNodeId === node.nodeId && engine.reviewed.has(edge.id))) {
        const development = edge.development;
        const change = el('div', '', 'family-change');
        change.append(el('strong', `${engine.node(development.fromNodeId).form} → ${engine.node(development.toNodeId).form}`), el('span', development.summary));
        item.append(change);
      }
    }
    const card = el('div', '', 'family-person' + (!node.nodeId ? ' reconstructed' : ''));
    if (node.nodeId) {
      const word = engine.node(node.nodeId);
      const button = el('button', word.form, 'family-word'); button.type = 'button';
      button.dataset.familyNode = word.id; button.addEventListener('click', () => onInspect(word.id));
      card.append(button, el('span', engine.catalog.languages[word.languageId].name, 'family-language'), el('span', word.period, 'family-period'));
    } else card.append(el('strong', node.label), el('span', node.detail, 'family-period'));
    const sources = doc.createElement('details'); sources.className = 'family-sources';
    sources.append(el('summary', 'Sources'));
    for (const id of node.sourceIds) {
      const source = engine.case.sources.find(value => value.id === id);
      const link = el('a', source.title + ' ↗'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener'; sources.append(link);
    }
    card.append(sources); item.append(card);
    const children = earned.filter(child => child.parentId === node.id);
    if (children.length) {
      const descendants = doc.createElement('ul'); descendants.className = 'family-branches';
      descendants.append(...children.map(branch)); item.append(descendants);
    }
    return item;
  }
  const roots = earned.filter(node => !visibleIds.has(node.parentId));
  list.append(...roots.map(branch));
  container.append(list);
  if (roots.length > 1) container.append(el('p', 'Keep investigating to connect the separate parts of the tree.', 'family-gap'));
  container.append(el('p', tree.note, 'family-note'));
  const explanation = el('section', '', 'family-changes');
  const targets = new Set(engine.case.edges.filter(edge => edge.development && engine.reviewed.has(edge.id)).map(edge => edge.target));
  for (const target of targets) {
    const block = doc.createElement('div');
    renderWordDevelopments(block, engine, target, mode, {expanded: true});
    explanation.append(block);
  }
  if (explanation.textContent) {
    explanation.prepend(el('h3', 'How the word changed'));
    container.append(explanation);
  }
  const rejected = [...engine.visited].filter(id => engine.nodeStatus(id) === 'excluded');
  if (rejected.length) {
    const separate = el('section', '', 'family-rejected');
    separate.append(el('h3', 'Rejected connections'), el('p', rejected.map(id => engine.node(id).form).join(' · ')), el('p', 'These clues do not belong on this word’s ancestry line.'));
    container.append(separate);
  }
}
