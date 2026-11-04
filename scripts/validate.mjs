import {loadContent} from './content.mjs';
try {
  const content = await loadContent();
  console.log(`Valid: ${content.cases.length} cases, ${content.cases.reduce((n,c) => n+c.nodes.length,0)} word forms, ${content.cases.reduce((n,c) => n+c.edges.length,0)} relationships.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
