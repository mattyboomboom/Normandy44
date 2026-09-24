import type { MultiLineString, MultiPolygon } from 'geojson';

/**
 * The neighbouring countries were cut from a larger map along a box (lon 12,
 * lat 41 and 56). Stroking their outline would draw those straight cuts as
 * false coastlines, so drop any segment that runs along the box edge.
 */
export function coastline(mp: MultiPolygon, edges = { lon: [12], lat: [41, 56] }): MultiLineString {
  const onEdge = (a: number[], b: number[]) =>
    edges.lon.some(x => Math.abs(a[0] - x) < 1e-6 && Math.abs(b[0] - x) < 1e-6) ||
    edges.lat.some(y => Math.abs(a[1] - y) < 1e-6 && Math.abs(b[1] - y) < 1e-6);
  const lines: number[][][] = [];
  for (const poly of mp.coordinates) for (const ring of poly) {
    let cur: number[][] = [];
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1], b = ring[i];
      if (onEdge(a, b)) { if (cur.length > 1) lines.push(cur); cur = []; continue; }
      if (!cur.length) cur.push(a);
      cur.push(b);
    }
    if (cur.length > 1) lines.push(cur);
  }
  return { type: 'MultiLineString', coordinates: lines };
}

/**
 * The same straight cuts, drawn on a globe, bow away from their parallel
 * (a projection draws the shortest path between two points, which is not
 * along a line of latitude), leaving slivers of sea between the neighbours
 * and the world map around them. Adding points every quarter degree along
 * the cuts keeps them straight.
 */
export function densifyCuts(mp: MultiPolygon, edges = { lon: [12], lat: [41, 56] }, step = 0.25): MultiPolygon {
  const onEdge = (a: number[], b: number[]) =>
    edges.lon.some(x => Math.abs(a[0] - x) < 1e-6 && Math.abs(b[0] - x) < 1e-6) ||
    edges.lat.some(y => Math.abs(a[1] - y) < 1e-6 && Math.abs(b[1] - y) < 1e-6);
  return {
    type: 'MultiPolygon',
    coordinates: mp.coordinates.map(poly => poly.map(ring => {
      const out: number[][] = [ring[0]];
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1], b = ring[i];
        if (onEdge(a, b)) {
          const n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / step);
          for (let k = 1; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
        }
        out.push(b);
      }
      return out;
    }))
  };
}
