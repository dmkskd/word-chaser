/** A short readable transcription, rendered only as text. No remote assets. */
export function renderTextEvidence(container, node, showDetails = true) {
  container.replaceChildren();
  const text = node.evidence.textSource;
  container.hidden = !text;
  if (!text) return;
  const doc = container.ownerDocument;
  const add = (tag, value, className) => {
    const el = doc.createElement(tag); el.textContent = value;
    if (className) el.className = className;
    container.append(el); return el;
  };
  if (showDetails) {
    add('p', `${text.creator} · ${text.workTitle}`, 'book-credit');
    add('p', `${text.section} · Published ${text.publicationYear}`, 'book-date');
  } else add('p', 'A page to inspect', 'book-credit');
  const passage = add('blockquote', '', 'book-passage');
  const position = text.excerpt.indexOf(text.focusText);
  if (position < 0) passage.textContent = text.excerpt;
  else {
    passage.append(doc.createTextNode(text.excerpt.slice(0, position)));
    const mark = doc.createElement('mark'); mark.textContent = text.focusText;
    passage.append(mark, doc.createTextNode(text.excerpt.slice(position + text.focusText.length)));
  }
  if (showDetails) {
    const details = doc.createElement('details'); details.className = 'book-provenance';
    const summary = doc.createElement('summary'); summary.textContent = 'About this page'; details.append(summary);
    for (const value of [text.editionDate !== String(text.publicationYear) ? `First published in ${text.publicationYear}; the first edition is dated ${text.editionDate}.` : '', 'This passage records the word in use. A separate source is needed to establish who invented it.', text.locationNote].filter(Boolean)) {
      const note = doc.createElement('p'); note.className = 'book-note'; note.textContent = value; details.append(note);
    }
    container.append(details);
  }
}
