import {build} from 'esbuild';
import {loadContent, root} from './content.mjs';
try {
  const content = await loadContent();
  await build({
    absWorkingDir: root, entryPoints: ['src/main.js'], outfile: 'assets/app.js', bundle: true,
    format: 'iife', target: ['es2022'], minify: false, sourcemap: true,
    plugins: [{name: 'json-case-content', setup(builder) {
      builder.onResolve({filter: /^word-chaser-content$/}, () => ({path: 'catalog', namespace: 'case-data'}));
      builder.onLoad({filter: /.*/, namespace: 'case-data'}, () => ({contents: `export default ${JSON.stringify(content)};`, loader: 'js'}));
    }}]
  });
  console.log(`Built ${content.catalog.title} with ${content.cases.length} validated JSON cases. No per-word JavaScript.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
