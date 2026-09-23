// Areas of Allied control: one filled ring per landing force, plus the dark
// front-line outline drawn around them. Rings morph point by point between
// the snapshots in src/data/areas.ts.
import { select } from 'd3-selection';
import type { AreaState, LonLat, RingKey } from '../data/types';
import { RING_NATION } from '../data/areas';
import { NAT, RING_KEYS } from '../data/nations';
import { NPTS, cloneState, resampleStates } from './rings';
import type { View } from './view';

export class AreaLayer {
  private readonly states: Record<string, AreaState>;
  /** The outlines as currently drawn (mutated in place while morphing) */
  current: AreaState;
  private readonly gRings = select('#rings');
  private readonly gFront = select('#front');

  constructor(states: Record<string, AreaState>, initial = 's0') {
    this.states = resampleStates(states);
    this.current = cloneState(this.states[initial]);
    for (const k of RING_KEYS) {
      this.gRings.append('path').attr('class', 'ring').attr('data-k', k).attr('fill', NAT[RING_NATION[k]]).attr('stroke', NAT[RING_NATION[k]]).attr('stroke-width', 3).attr('stroke-linejoin', 'round');
      this.gFront.append('path').attr('class', 'ring').attr('data-k', k).attr('fill', '#000').attr('stroke', '#000').attr('stroke-width', 4).attr('stroke-linejoin', 'round');
    }
  }

  has(key: string): boolean { return key in this.states; }

  /** Jump straight to a state. */
  set(key: string): void { this.current = cloneState(this.states[key]); }

  /**
   * Start a morph from what is drawn now towards `key`.
   * Returns a function that sets the blend (0 = start, 1 = target).
   */
  morphTo(key: string): (m: number) => void {
    const from = cloneState(this.current), to = this.states[key], cur = this.current;
    return m => {
      for (const k of RING_KEYS) {
        const a = from[k], b = to[k], r = cur[k];
        for (let n = 0; n < NPTS; n++) { r[n][0] = a[n][0] + (b[n][0] - a[n][0]) * m; r[n][1] = a[n][1] + (b[n][1] - a[n][1]) * m; }
      }
    };
  }

  /** The front-line filter is the most expensive layer, so it sits out camera moves. */
  showFront(on: boolean): void { this.gFront.style('display', on ? '' : 'none'); }

  render(view: View): void {
    for (const k of RING_KEYS) {
      const d = ringPath(view, this.current[k as RingKey]);
      this.gRings.select(`[data-k="${k}"]`).attr('d', d);
      this.gFront.select(`[data-k="${k}"]`).attr('d', d);
    }
  }
}

function ringPath(view: View, pts: LonLat[]): string {
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const p = view.P(pts[i]);
    if (!p) continue;
    d += (d ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1);
  }
  return d ? d + 'Z' : '';
}
