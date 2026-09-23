// Areas of control are drawn as rings of a fixed number of points, so any two
// states can be morphed into each other point by point.
import type { AreaState, LonLat, RingKey } from '../data/types';
import { RING_KEYS } from '../data/nations';

export const RAD = Math.PI / 180;
/** Planar approximation (cos of Normandy's latitude) for distances and camera paths */
export const COS = Math.cos(47 * RAD);
export const NPTS = 240;

/** Resample a ring to NPTS evenly spaced points, counter-clockwise. */
export function resample(ring: LonLat[]): LonLat[] {
  if (ring.length === 1) return Array.from({ length: NPTS }, () => ring[0].slice() as LonLat);
  let a = 0;
  for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p[0] * q[1] - q[0] * p[1]; }
  let r = ring.slice();
  if (a < 0) r = [r[0]].concat(r.slice(1).reverse());
  const pts = r.concat([r[0]]);
  const seg: number[] = [], cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i][0] - pts[i - 1][0]) * COS, dy = pts[i][1] - pts[i - 1][1];
    seg.push(Math.hypot(dx, dy)); cum.push(cum[i - 1] + seg[i - 1]);
  }
  const total = cum[cum.length - 1], out: LonLat[] = [];
  let j = 0;
  for (let k = 0; k < NPTS; k++) {
    const d = total * k / NPTS;
    while (j < seg.length - 1 && cum[j + 1] < d) j++;
    const t = seg[j] ? (d - cum[j]) / seg[j] : 0;
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t]);
  }
  return out;
}

/** Resample every state up front. */
export function resampleStates(states: Record<string, AreaState>): Record<string, AreaState> {
  const out: Record<string, AreaState> = {};
  for (const s in states) {
    out[s] = {} as AreaState;
    for (const k of RING_KEYS) out[s][k] = resample(states[s][k]);
  }
  return out;
}

export function cloneState(s: AreaState): AreaState {
  const out = {} as AreaState;
  for (const k of RING_KEYS) out[k as RingKey] = s[k].map(p => [p[0], p[1]] as LonLat);
  return out;
}
