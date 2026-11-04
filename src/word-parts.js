/** Authored text only: never interpret a word segment as HTML. */
export function renderWordParts(element, node, activeSegmentId) {
  element.replaceChildren();
  if (!node.segments) { element.textContent = node.form; return; }
  for (const segment of node.segments) {
    const span = element.ownerDocument.createElement('span');
    span.textContent = segment.text;
    if (segment.id === activeSegmentId) span.className = 'word-segment active-segment';
    element.append(span);
  }
}
