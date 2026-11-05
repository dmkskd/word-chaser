import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import cytoscape from 'cytoscape';

/** Fewest distinct connected moves needed to earn every goal. No decisions,
 * optional detours, revisits and cycles cannot make a short case look longer.
 * Stop at the authoring minimum: larger investigations need no exhaustive search. */
export function minimumRequiredHops(catalog, wordCase, minimum = 3) {
  const links = wordCase.edges.filter(edge => catalog.relations[edge.type]?.outcome === 'connected');
  const queue = [new Set([wordCase.startNodeId])], seen = new Set();
  for (let i = 0; i < queue.length; i++) {
    const visited = queue[i], hops = visited.size - 1;
    if (wordCase.goalNodeIds.every(id => visited.has(id))) return hops;
    if (hops >= minimum) continue;
    for (const edge of links) if (visited.has(edge.source) && !visited.has(edge.target)) {
      const next = new Set([...visited, edge.target]), key = [...next].sort().join('|');
      if (!seen.has(key)) { seen.add(key); queue.push(next); }
    }
  }
  return minimum;
}

export function createValidator(catalogSchema, caseSchema) {
  const ajv = new Ajv({allErrors: true, strict: true});
  addFormats(ajv);
  const checkCatalog = ajv.compile(catalogSchema);
  const checkCase = ajv.compile(caseSchema);
  const format = (prefix, errors) => (errors || []).map(e => `${prefix}${e.instancePath || '/'}: ${e.message}`);
  return function validate(catalog, cases) {
    const errors = [];
    if (!checkCatalog(catalog)) return format('catalog ', checkCatalog.errors);
    const caseIds = new Set();
    for (const wordCase of cases) {
      const prefix = `${wordCase.id || 'case'} `;
      if (!checkCase(wordCase)) { errors.push(...format(prefix, checkCase.errors)); continue; }
      if (caseIds.has(wordCase.id)) errors.push(`${prefix}duplicate case ID`);
      caseIds.add(wordCase.id);
      const sources = new Set();
      for (const source of wordCase.sources) {
        if (sources.has(source.id)) errors.push(`${prefix}duplicate source ${source.id}`);
        sources.add(source.id);
      }
      const refs = (ids, context) => ids.forEach(id => { if (!sources.has(id)) errors.push(`${prefix}${context}: unknown source ${id}`); });
      const graph = cytoscape({headless: true, styleEnabled: false});
      const hasNode = id => graph.getElementById(id).isNode();
      for (const node of wordCase.nodes) {
        if (hasNode(node.id)) { errors.push(`${prefix}duplicate node ${node.id}`); continue; }
        graph.add({group: 'nodes', data: {id: node.id}});
        for (const [field, table] of [['languageId', 'languages'], ['eraId', 'eras'], ['placeId', 'places']]) {
          if (!Object.hasOwn(catalog[table], node[field])) errors.push(`${prefix}${node.id}: unknown ${field} ${node[field]}`);
        }
        if (!Object.hasOwn(catalog.languages, node.pronunciation.languageId)) errors.push(`${prefix}${node.id}: unknown pronunciation language`);
        if (!Object.hasOwn(catalog.artifacts, node.evidence.kind)) errors.push(`${prefix}${node.id}: unknown artifact ${node.evidence.kind}`);
        refs(node.evidence.sourceIds, node.id);
        if (node.date) {
          const {startYear, endYear} = node.date;
          if ((startYear === undefined) !== (endYear === undefined)) errors.push(`${prefix}${node.id}: date needs both range endpoints`);
          if (startYear > endYear) errors.push(`${prefix}${node.id}: reversed evidence date range`);
        }
        const text = node.evidence.textSource;
        if (node.kind === 'attestation' && (!text || !node.date)) errors.push(`${prefix}${node.id}: attestation needs text evidence and a date`);
        if (text) {
          refs(text.sourceIds, `${node.id} text`);
          if (node.kind !== 'attestation') errors.push(`${prefix}${node.id}: text evidence needs attestation kind`);
          if (!text.excerpt.includes(text.focusText)) errors.push(`${prefix}${node.id}: highlighted text is missing from excerpt`);
          if (node.date?.startYear !== undefined && (text.publicationYear < node.date.startYear || text.publicationYear > node.date.endYear)) errors.push(`${prefix}${node.id}: publication is outside evidence date range`);
        }
        if (node.segments) {
          if (node.segments.map(part => part.text).join('') !== node.form) errors.push(`${prefix}${node.id}: segments must reproduce the word form`);
          const ids = node.segments.filter(part => part.id).map(part => part.id);
          if (new Set(ids).size !== ids.length) errors.push(`${prefix}${node.id}: duplicate segment ID`);
        }
      }
      for (const edge of wordCase.edges) {
        if (graph.getElementById(edge.id).nonempty()) { errors.push(`${prefix}duplicate edge ${edge.id}`); continue; }
        if (!hasNode(edge.source) || !hasNode(edge.target)) { errors.push(`${prefix}${edge.id}: dangling edge`); continue; }
        if (edge.source === edge.target) { errors.push(`${prefix}${edge.id}: self link`); continue; }
        graph.add({group: 'edges', data: {id: edge.id, source: edge.source, target: edge.target}});
        if (!Object.hasOwn(catalog.relations, edge.type)) errors.push(`${prefix}${edge.id}: unknown relation ${edge.type}`);
        if (catalog.relations[edge.type]?.category === 'evidence' && wordCase.nodes.find(node => node.id === edge.target)?.kind !== 'attestation') errors.push(`${prefix}${edge.id}: text relationship must target an attestation`);
        refs(edge.evidence.sourceIds, edge.id);
        if (edge.sourceSegmentId && !wordCase.nodes.find(node => node.id === edge.source)?.segments?.some(part => part.id === edge.sourceSegmentId)) errors.push(`${prefix}${edge.id}: unknown source segment`);
        if (edge.challenge.choices.filter(choice => choice.correct).length !== 1) errors.push(`${prefix}${edge.id}: challenge must have one correct answer`);
        if (new Set(edge.challenge.choices.map(choice => choice.id)).size !== edge.challenge.choices.length) errors.push(`${prefix}${edge.id}: duplicate choice IDs`);
      }
      for (const puzzle of wordCase.puzzles) {
        refs(puzzle.sourceIds, puzzle.title);
        if (!Object.hasOwn(catalog.languages, puzzle.pronunciation.languageId)) errors.push(`${prefix}${puzzle.title}: unknown pronunciation language`);
      }
      for (const milestone of wordCase.milestones) if (!hasNode(milestone.nodeId)) errors.push(`${prefix}unknown milestone ${milestone.nodeId}`);
      if (!hasNode(wordCase.startNodeId)) { errors.push(`${prefix}missing start node`); graph.destroy(); continue; }
      const reachable = new Set();
      graph.elements().bfs({roots: graph.getElementById(wordCase.startNodeId), directed: true, visit(node) { reachable.add(node.id()); }});
      for (const node of graph.nodes()) if (!reachable.has(node.id())) errors.push(`${prefix}${node.id()}: unreachable from start`);
      for (const goal of wordCase.goalNodeIds) if (!reachable.has(goal)) errors.push(`${prefix}${goal}: unreachable goal`);
      const minimum = catalog.rules.minimumConnectedHops;
      const hops = minimumRequiredHops(catalog, wordCase, minimum);
      const legacy = catalog.rules.shortCaseHopExceptions[wordCase.id];
      if (hops < minimum && legacy === undefined) errors.push(`${prefix}needs at least ${minimum} required connected hops; can finish in ${hops}`);
      if (legacy !== undefined && hops < legacy) errors.push(`${prefix}short case regressed from ${legacy} to ${hops} required connected hops`);
      if (legacy !== undefined && hops >= minimum) errors.push(`${prefix}remove expanded case from shortCaseHopExceptions`);
      graph.destroy();
    }
    const collectionIds = new Set(), groupedCases = new Set();
    for (const collection of catalog.collections) {
      if (collectionIds.has(collection.id)) errors.push(`catalog duplicate collection ${collection.id}`);
      collectionIds.add(collection.id);
      for (const id of collection.caseIds) {
        if (!caseIds.has(id)) errors.push(`catalog collection ${collection.id}: unknown case ${id}`);
        if (groupedCases.has(id)) errors.push(`catalog duplicate grouped case ${id}`);
        groupedCases.add(id);
      }
    }
    for (const id of caseIds) if (!groupedCases.has(id)) errors.push(`catalog ungrouped case ${id}`);
    for (const id of Object.keys(catalog.rules.shortCaseHopExceptions)) if (!caseIds.has(id)) errors.push(`catalog unknown short-case exception ${id}`);
    for (const [id, era] of Object.entries(catalog.eras)) if (era.startYear > era.endYear) errors.push(`catalog era ${id}: reversed date range`);
    return errors;
  };
}
