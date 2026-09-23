// Builds public/data/geo.topo.json from the GeoJSON source in data-src/geo.json.
//
//   npm run geo
//
// The source coordinates have at most 4 decimal places, so we snap them to an
// integer grid of 1e-4 degrees and store that grid in TopoJSON with a matching
// transform. Shared borders become shared arcs and every arc is delta-encoded,
// which shrinks the file a lot while decoding back to the original coordinates
// (to floating-point rounding). Nothing is simplified.
import fs from 'node:fs';
import { topology } from 'topojson-server';

const SRC = new URL('../data-src/geo.json', import.meta.url);
const OUT = new URL('../public/data/geo.topo.json', import.meta.url);
const GRID = 1e4;

const geo = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const snap = c => (typeof c[0] === 'number'
  ? [Math.round(c[0] * GRID), Math.round(c[1] * GRID)]
  : c.map(snap));

// Beaches are five separate lines; keep them as one collection with ids.
const objects = {};
for (const [k, v] of Object.entries(geo)) {
  if (k === 'beaches') {
    objects.beaches = {
      type: 'FeatureCollection',
      features: Object.entries(v).map(([id, line]) => ({
        type: 'Feature', id, properties: {}, geometry: { type: 'LineString', coordinates: snap(line) }
      }))
    };
  } else {
    objects[k] = { type: v.type, coordinates: snap(v.coordinates) };
  }
}

// No quantization here: coordinates are already integers on our grid.
const topo = topology(objects);

// Delta-encode arcs and add a transform that maps the grid back to degrees.
topo.arcs = topo.arcs.map(arc => {
  let x0 = 0, y0 = 0;
  return arc.map(([x, y]) => { const d = [x - x0, y - y0]; x0 = x; y0 = y; return d; });
});
topo.transform = { scale: [1 / GRID, 1 / GRID], translate: [0, 0] };
delete topo.bbox;

fs.mkdirSync(new URL('.', OUT), { recursive: true });
const json = JSON.stringify(topo);
fs.writeFileSync(OUT, json);
console.log(`wrote ${OUT.pathname} (${(json.length / 1024).toFixed(0)} KB, ${topo.arcs.length} arcs)`);
