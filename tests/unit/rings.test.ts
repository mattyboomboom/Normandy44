import { describe, expect, it } from 'vitest';
import { resample, NPTS, COS } from '../../src/atlas/rings';
import type { LonLat } from '../../src/data/types';

const area = (r: LonLat[]) => r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const dist = (a: LonLat, b: LonLat) => Math.hypot((b[0] - a[0]) * COS, b[1] - a[1]);

// A 1° x 0.5° box near Caen, listed clockwise
const box: LonLat[] = [[-1, 49], [-1, 49.5], [0, 49.5], [0, 49]];

describe('resample', () => {
  it('always returns NPTS points', () => {
    expect(resample(box)).toHaveLength(NPTS);
    expect(resample([[0, 49], [1, 49], [0.5, 49.5]])).toHaveLength(NPTS);
  });

  it('turns a single point into NPTS copies of it (a ring collapsed offshore)', () => {
    const out = resample([[-1.12, 49.43]]);
    expect(out).toHaveLength(NPTS);
    expect(out.every(p => p[0] === -1.12 && p[1] === 49.43)).toBe(true);
    out[0][0] = 5; // copies, not shared references
    expect(out[1][0]).toBe(-1.12);
  });

  it('returns rings wound counter-clockwise, whatever the input order', () => {
    expect(area(box)).toBeLessThan(0);
    expect(area(resample(box))).toBeGreaterThan(0);
    expect(area(resample([...box].reverse()))).toBeGreaterThan(0);
  });

  it('keeps the shape: same area and every point on the original outline', () => {
    const out = resample(box);
    expect(Math.abs(area(out))).toBeCloseTo(Math.abs(area(box)), 2);
    for (const [x, y] of out) {
      const onEdge = Math.abs(x + 1) < 1e-9 || Math.abs(x) < 1e-9 || Math.abs(y - 49) < 1e-9 || Math.abs(y - 49.5) < 1e-9;
      expect(onEdge).toBe(true);
    }
  });

  it('spaces the points evenly along the outline (in local planar distance)', () => {
    const out = resample(box);
    const gaps = out.map((p, i) => dist(p, out[(i + 1) % out.length]));
    const step = 2 * (1 * COS + 0.5) / NPTS; // perimeter / number of points
    // straight runs are exactly one step apart; the four gaps that cut a corner are shorter
    for (const g of gaps) expect(g).toBeLessThanOrEqual(step * (1 + 1e-9));
    expect(gaps.filter(g => Math.abs(g - step) > step * 1e-6).length).toBeLessThanOrEqual(4);
  });
});
