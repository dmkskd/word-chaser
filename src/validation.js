import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import cytoscape from 'cytoscape';

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
      }
      for (const edge of wordCase.edges) {
        if (graph.getElementById(edge.id).nonempty()) { errors.push(`${prefix}duplicate edge ${edge.id}`); continue; }
        if (!hasNode(edge.source) || !hasNode(edge.target)) { errors.push(`${prefix}${edge.id}: dangling edge`); continue; }
        if (edge.source === edge.target) { errors.push(`${prefix}${edge.id}: self link`); continue; }
        graph.add({group: 'edges', data: {id: edge.id, source: edge.source, target: edge.target}});
        if (!Object.hasOwn(catalog.relations, edge.type)) errors.push(`${prefix}${edge.id}: unknown relation ${edge.type}`);
        refs(edge.evidence.sourceIds, edge.id);
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
      graph.destroy();
    }
    for (const [id, era] of Object.entries(catalog.eras)) if (era.startYear > era.endYear) errors.push(`catalog era ${id}: reversed date range`);
    return errors;
  };
}
