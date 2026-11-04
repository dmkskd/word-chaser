/** Grouping is catalog data; searching/browsing never changes game progress. */
export function createCasePicker({catalog, cases, document, onSelect}) {
  const $ = id => document.getElementById(id);
  const search = $('case-search'), browse = $('browse-cases'), panel = $('case-browser');
  const root = search.closest('.word-picker');
  let currentId, opener = browse;
  function element(tag, text, className) {
    const el = document.createElement(tag); el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function close(returnFocus = false) {
    panel.hidden = true;
    for (const control of [search, browse]) control.setAttribute('aria-expanded', 'false');
    if (returnFocus) opener.focus({preventScroll: true});
  }
  function results() { return [...$('case-groups').querySelectorAll('[data-case-id]')]; }
  function render() {
    const searching = panel.dataset.view === 'search';
    const query = search.value.trim().toLocaleLowerCase();
    const startsWith = cases.filter(c => c.title.toLocaleLowerCase().startsWith(query));
    const contains = cases.filter(c => c.title.toLocaleLowerCase().includes(query));
    const nameMatches = startsWith.length ? startsWith : contains;
    const matchingIds = nameMatches.length ? new Set(nameMatches.map(c => c.id)) : null;
    let count = 0;
    $('case-groups').replaceChildren();
    for (const collection of catalog.collections) {
      const matches = collection.caseIds.map(id => cases.find(c => c.id === id)).filter(c => matchingIds ? matchingIds.has(c.id) :
        [c.summary, collection.title, ...c.nodes.map(node => catalog.languages[node.languageId].name)].join(' ').toLocaleLowerCase().includes(query));
      if (!matches.length) continue;
      count += matches.length;
      const section = document.createElement(searching ? 'div' : 'section'); section.className = searching ? 'suggestion-group' : 'case-collection';
      section.dataset.collectionId = collection.id;
      const heading = element('h3', collection.title); heading.id = `collection-${collection.id}`;
      if (!searching) {
        section.setAttribute('aria-labelledby', heading.id);
        section.append(heading, element('p', collection.description));
      }
      const words = document.createElement('div'); words.className = 'case-tiles';
      for (const wordCase of matches) {
        const choice = element('button', '', 'case-tile'); choice.type = 'button';
        choice.dataset.caseId = wordCase.id; choice.title = wordCase.summary;
        choice.setAttribute('aria-current', String(wordCase.id === currentId));
        const icon = element('span', wordCase.icon); icon.setAttribute('aria-hidden', 'true');
        choice.append(icon, element('span', wordCase.title, 'case-name'));
        choice.addEventListener('click', () => {
          onSelect(wordCase.id); close(); search.value = ''; render(); browse.focus({preventScroll: true});
        });
        words.append(choice);
      }
      section.append(words); $('case-groups').append(section);
    }
    $('catalog-count').textContent = `${cases.length} word mysteries`;
    $('case-search-status').textContent = count ? query ? `${count} ${count === 1 ? 'mystery' : 'mysteries'} found` : '' : 'No mysteries found. Try another word or browse all.';
    $('case-search-status').hidden = searching && count > 0;
  }
  function open(from) {
    opener = from;
    const searching = from === search;
    panel.dataset.view = searching ? 'search' : 'browse';
    panel.querySelector('.case-browser-header').hidden = searching;
    if (searching) {
      panel.removeAttribute('aria-labelledby'); panel.setAttribute('aria-label', 'Matching words');
    } else {
      panel.removeAttribute('aria-label'); panel.setAttribute('aria-labelledby', 'case-browser-title');
    }
    render(); panel.hidden = false; panel.scrollTop = 0;
    for (const control of [search, browse]) control.setAttribute('aria-expanded', 'true');
  }
  browse.addEventListener('click', () => {
    if (!panel.hidden && !search.value) { close(); return; }
    search.value = ''; open(browse);
  });
  search.addEventListener('input', () => {
    if (search.value.trim().length < 2) { close(); return; }
    open(search);
  });
  search.addEventListener('click', () => { if (search.value.trim().length >= 2) open(search); });
  search.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); open(search);
      const choices = results(); (event.key === 'ArrowDown' ? choices[0] : choices.at(-1))?.focus();
    } else if (event.key === 'Enter' && !panel.hidden) { event.preventDefault(); results()[0]?.click(); }
  });
  browse.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); search.value = ''; open(browse); results()[0]?.focus(); }
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); close(true); }
    if (event.target.matches?.('[data-case-id]') && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault(); const choices = results(), index = choices.indexOf(event.target);
      choices[(index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : choices.length - 1)) % choices.length]?.focus();
    }
  });
  root.addEventListener('focusout', event => { if (event.relatedTarget && !root.contains(event.relatedTarget)) close(); });
  document.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); });
  $('close-browser').addEventListener('click', () => close(true));
  render();
  return {setCurrent(id) {
    currentId = id; const wordCase = cases.find(c => c.id === id);
    $('current-word').textContent = `${wordCase.icon} ${wordCase.title}`;
    browse.title = `${wordCase.title} — ${wordCase.summary}`;
    render();
  }};
}
