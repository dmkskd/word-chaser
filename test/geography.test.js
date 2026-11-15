import test from 'node:test';
import assert from 'node:assert/strict';
import {project, placePoint, evidencePoint} from '../src/geography.js';
import {loadContent} from '../scripts/content.mjs';
const {catalog, cases} = await loadContent();

test('geographic places use the original map projection and preserve real town positions', () => {
  assert.deepEqual(project([10,51]), [450,325]);
  const manchester = placePoint(catalog.places.manchester), grimsby = placePoint(catalog.places.grimsby);
  assert(grimsby[0] > manchester[0]);
  assert(Math.abs(grimsby[1] - manchester[1]) < 3, 'Both towns are at nearly the same latitude.');
  assert.deepEqual(placePoint(catalog.places.england), [334,316], 'Existing broad anchors keep their locations.');
  const wordCase = cases.find(c => c.id === 'manchester');
  const now = wordCase.nodes[0], old = wordCase.nodes[1];
  assert.equal(now.placeId,old.placeId);
  const atTownScale = evidencePoint(old,catalog,.1);
  assert(Math.abs(atTownScale[0] - manchester[0] + 7.5) < 1e-9);
  assert.deepEqual(evidencePoint({...old,displayOffset:[0,0]},catalog,.1),manchester);
});

test('camera English comparison markers keep their map positions across viewport scales', () => {
  const wordCase = cases.find(c => c.id === 'camera');
  for (const id of ['camera-now', 'camera-obscura', 'camera-camel']) {
    const node = wordCase.nodes.find(n => n.id === id);
    assert.equal(node.placeId, 'england', 'Broad English vocabulary examples must not claim a London origin.');
    const point = evidencePoint(node, catalog);
    for (const scale of [.2, .7, 1, 2.5]) {
      assert.deepEqual(evidencePoint(node, catalog, scale), point, 'Viewport size and zoom must not move these markers across the Channel.');
    }
  }
});
