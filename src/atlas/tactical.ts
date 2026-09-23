// Close-up detail for Epsom, Goodwood, Cobra and the hedgerow fighting:
// formations drawn as simplified military map symbols, start lines, ridges,
// roads, bombing zones and village names. Positions are approximate.
import { select, type Selection } from 'd3-selection';
import 'd3-transition';
import type { LonLat, Scene, TacLabel, TacLine, Unit, Zone } from '../data/types';
import { NAT } from '../data/nations';
import type { Pt, View } from './view';

type G = Selection<SVGGElement, unknown, HTMLElement, unknown>;

const LIGHT = '#f3efe2';
/** Symbol frame size in px */
const FW = 26, FH = 17;

const ECHELON: Record<NonNullable<Unit['size']>, string> = { corps: 'XXX', div: 'XX', bde: 'X', kg: '' };

/** Does this scene have close-up detail to draw? */
export const isTactical = (sc: Scene | null): boolean =>
  !!sc && !!((sc.units && sc.units.length) || (sc.lines && sc.lines.length) || (sc.zones && sc.zones.length));

/** Draw one formation symbol centred on (0,0). */
function drawUnit(g: G, u: Unit): void {
  const c = NAT[u.n];
  const x = -FW / 2, y = -FH / 2;
  g.append('rect').attr('class', 'u-frame').attr('x', x).attr('y', y).attr('width', FW).attr('height', FH)
    .attr('fill', LIGHT).attr('stroke', c).attr('stroke-width', 2);
  const ink = { stroke: c, 'stroke-width': 1.6, fill: 'none' };
  const line = (d: string) => { const p = g.append('path').attr('d', d); for (const [k, v] of Object.entries(ink)) p.attr(k, v); };
  if (u.k === 'inf' || u.k === 'mech' || u.k === 'para') line(`M${x},${y}L${-x},${-y}M${x},${-y}L${-x},${y}`);
  if (u.k === 'arm' || u.k === 'mech') {
    const e = g.append('ellipse').attr('rx', FW / 2 - 4).attr('ry', FH / 2 - 3.5);
    for (const [k, v] of Object.entries(ink)) e.attr(k, v);
  }
  if (u.k === 'para') line(`M-5,${-y - 2}Q-2.5,${-y - 6} 0,${-y - 2}Q2.5,${-y - 6} 5,${-y - 2}`);
  if (u.k === 'kg') g.append('text').attr('class', 'u-kg').attr('text-anchor', 'middle').attr('dy', 4).attr('fill', c).text('KG');
  const ech = u.size ? ECHELON[u.size] : '';
  if (ech) g.append('text').attr('class', 'u-ech').attr('text-anchor', 'middle').attr('y', y - 3).attr('fill', c).text(ech);
}

export class TacticalLayer {
  private readonly under = select<SVGGElement, unknown>('#tac-under');
  private readonly over = select<SVGGElement, unknown>('#tac-units');

  constructor(private readonly view: View, private readonly reduceMotion: boolean) {}

  clear(): void {
    this.under.selectAll('*').remove();
    this.over.selectAll('*').remove();
    document.body.classList.remove('tac');
  }

  /** Add a scene's close-up detail, fading it in. */
  build(sc: Scene): void {
    this.clear();
    if (!isTactical(sc) && !(sc.labels && sc.labels.length)) return;
    // close-up mode (faded areas, unit key in the legend) only when formations are shown
    if (sc.units && sc.units.length) document.body.classList.add('tac');
    const fade = (g: G, i: number) => {
      g.attr('opacity', 0).transition().delay(this.reduceMotion ? 0 : 150 + i * 90).duration(this.reduceMotion ? 0 : 450).attr('opacity', 1);
    };
    (sc.zones || []).forEach((z, i) => {
      const g = this.under.append('g').attr('class', `tz tz-${z.kind}`).datum(z) as unknown as G;
      g.append('path').attr('fill', z.kind === 'bomb' ? 'url(#hatch)' : z.n ? NAT[z.n] : 'rgba(38,36,31,.15)');
      if (z.label) g.append('text').attr('class', 'tz-label').attr('text-anchor', 'middle').text(z.label);
      fade(g, i);
    });
    (sc.lines || []).forEach((l, i) => {
      const g = this.under.append('g').attr('class', `tl-${l.kind}`).datum(l) as unknown as G;
      g.append('path').attr('class', 'tl-path').attr('stroke', l.n ? NAT[l.n] : null);
      if (l.label) g.append('text').attr('class', 'tl-label').attr('dy', -6).text(l.label);
      fade(g, i);
    });
    (sc.labels || []).forEach(t => {
      const g = this.under.append('g').attr('class', 'tlab').datum(t);
      g.append('circle').attr('class', 'place-dot').attr('r', 2.2);
      g.append('text').attr('class', 'place').attr('x', 6).attr('y', 4).text(t.n);
    });
    (sc.units || []).forEach((u, i) => {
      const g = this.over.append('g').attr('class', 'unit').datum(u)
        .attr('role', 'img').attr('aria-label', `${u.label} (approximate position)`) as unknown as G;
      drawUnit(g.append('g') as unknown as G, u);
      g.append('text').attr('class', 'u-label').text(u.label);
      fade(g, i + (sc.zones?.length || 0));
    });
    this.render();
  }

  /** Reposition for the current camera. */
  render(): void {
    const view = this.view;
    const P = (p: LonLat) => view.P(p);
    const pathOf = (pts: LonLat[], close: boolean) => {
      const xy = pts.map(P);
      if (xy.some(p => !p)) return '';
      return 'M' + (xy as Pt[]).map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + (close ? 'Z' : '');
    };
    this.under.selectAll<SVGGElement, Zone>('.tz').each(function (z) {
      const g = select(this);
      g.select('path').attr('d', pathOf(z.pts, true));
      // label just above the top edge of the zone, so symbols inside don't cover it
      const xy = z.pts.map(P).filter((p): p is Pt => !!p);
      const c = centroid(xy);
      if (c) g.select('text').attr('x', c[0]).attr('y', Math.min(...xy.map(p => p[1])) - 6);
    });
    this.under.selectAll<SVGGElement, TacLine>('[class^="tl-"]').each(function (l) {
      const g = select(this);
      g.select('path').attr('d', pathOf(l.pts, false));
      // label at the midpoint of the line
      const mid = P(l.pts[Math.floor((l.pts.length - 1) / 2)]);
      const nxt = P(l.pts[Math.min(l.pts.length - 1, Math.floor((l.pts.length - 1) / 2) + 1)]);
      if (mid && nxt) g.select('text').attr('x', (mid[0] + nxt[0]) / 2).attr('y', (mid[1] + nxt[1]) / 2).attr('text-anchor', 'middle');
    });
    // Village names give way to formations and to the UI panels
    const unitPts = (this.over.selectAll<SVGGElement, Unit>('.unit').data() as Unit[])
      .map(u => ({ p: P(u.p), u })).filter((x): x is { p: Pt; u: Unit } => !!x.p);
    const clashes = (p: Pt) => unitPts.some(({ p: q, u }) => {
      // the symbol plus its label, roughly
      const w = u.label.length * 7 + FW;
      const lp = u.lp || 'r';
      const x0 = lp === 'l' ? q[0] - w : lp === 'r' ? q[0] - FW / 2 : q[0] - w / 2;
      const x1 = lp === 'l' ? q[0] + FW / 2 : lp === 'r' ? q[0] + w : q[0] + w / 2;
      const y0 = q[1] - FH / 2 - (lp === 't' ? 30 : 12), y1 = q[1] + FH / 2 + (lp === 'b' ? 22 : 6);
      return p[0] + 60 > x0 && p[0] - 4 < x1 && p[1] + 6 > y0 && p[1] - 12 < y1;
    });
    // and to each other: first come, first placed
    const placed: [number, number, number, number][] = [];
    const overlaps = (p: Pt, n: string) => {
      const b: [number, number, number, number] = [p[0] - 4, p[1] - 11, p[0] + 8 + n.length * 6.6, p[1] + 5];
      if (placed.some(q => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1])) return true;
      placed.push(b);
      return false;
    };
    this.under.selectAll<SVGGElement, TacLabel>('.tlab').each(function (t) {
      const p = P(t.p);
      const show = !!p && view.inView(p) && !view.isBlocked(p) && !clashes(p) && !overlaps(p, t.n);
      this.style.display = show ? '' : 'none';
      if (p) this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
    });
    this.over.selectAll<SVGGElement, Unit>('.unit').each(function (u) {
      const p = P(u.p);
      this.style.display = p && view.inView(p, 0) ? '' : 'none';
      if (!p) return;
      this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
      const lp = u.lp || 'r';
      const t = this.querySelector('.u-label') as SVGTextElement;
      const at = { r: [FW / 2 + 5, 4, 'start'], l: [-FW / 2 - 5, 4, 'end'], t: [0, -FH / 2 - (u.size ? 16 : 6), 'middle'], b: [0, FH / 2 + 14, 'middle'] }[lp];
      t.setAttribute('x', String(at[0])); t.setAttribute('y', String(at[1])); t.setAttribute('text-anchor', String(at[2]));
    });
  }

  /** Screen positions of units and labels, so town labels can step aside. */
  points(): Pt[] {
    const pts: Pt[] = [];
    this.over.selectAll<SVGGElement, Unit>('.unit').each(u => { const p = this.view.P(u.p); if (p) pts.push(p); });
    this.under.selectAll<SVGGElement, TacLabel>('.tlab').each(t => { const p = this.view.P(t.p); if (p) pts.push(p); });
    return pts;
  }
}

function centroid(pts: Pt[]): Pt | null {
  if (!pts.length) return null;
  const s = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
  return [s[0] / pts.length, s[1] / pts.length];
}
