import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createValidator} from '../src/validation.js';
export const root = fileURLToPath(new URL('../', import.meta.url));
export async function loadContent() {
  const json = async path => JSON.parse(await readFile(new URL(path, new URL('../', import.meta.url)), 'utf8'));
  const catalog = await json('data/catalog.json');
  const cases = await Promise.all(catalog.cases.map(path => json('data/' + path)));
  const [catalogSchema, caseSchema] = await Promise.all([json('data/catalog.schema.json'), json('data/case.schema.json')]);
  const errors = createValidator(catalogSchema, caseSchema)(catalog, cases);
  if (errors.length) throw new Error('Content validation failed:\n' + errors.map(e => '• ' + e).join('\n'));
  return {catalog, cases};
}
