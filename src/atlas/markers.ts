// Scene overlays: event markers with labels, movement arrows, bombing zones,
// and the small popover note shown when a marker is hovered or clicked.
import { select, type Selection } from 'd3-selection';
import 'd3-transition';
import { line, curveCatmullRom } from 'd3-shape';
import { easeCubicOut } from 'd3-ease';
import { range } from 'd3-array';
import type { Polygon } from 'geojson';
import type { Arrow, MapEvent, Scene } from '../data/types';
import { NAT } from '../data/nations';
import type { Pt, View } from './view';

type G = Selection<SVGGElement, unknown, null, undefined>;

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const LIGHT = '#f3efe2';
const curve = line().curve(curveCatmullRom.alpha(0.5));

/** Draw the map symbol for one kind of event. */
export function drawSymbol(g: G, e: MapEvent): void {
  const c = NAT[e.nat || 'all'];
  switch (e.k) {
    case 'star':
      g.append('circle').attr('class', 'pulse').attr('r', 7).attr('stroke', c);
      g.append('circle').attr('r', 6.5).attr('fill', c).attr('stroke', LIGHT).attr('stroke-width', 2);
      break;
    case 'clash': {
      const pts = range(16).map(i => { const r = i % 2 ? 4.2 : 10, a = i * Math.PI / 8; return [r * Math.cos(a), r * Math.sin(a)]; });
      g.append('circle').attr('class', 'pulse').attr('r', 8).attr('stroke', c);
      g.append('path').attr('d', 'M' + pts.join('L') + 'Z').attr('fill', c).attr('stroke', LIGHT).attr('stroke-width', 1.5);
      break;
    }
    case 'target':
      g.append('circle').attr('r', 9).attr('fill', 'none').attr('stroke', LIGHT).attr('stroke-width', 5);
      g.append('circle').attr('r', 9).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2.5);
      g.append('circle').attr('r', 2.5).attr('fill', c);
      break;
    case 'para':
      g.append('path').attr('d', 'M-9,0A9,8 0 0 1 9,0Z').attr('fill', c).attr('stroke', LIGHT).attr('stroke-width', 1.5);
      g.append('path').attr('d', 'M-8,0L0,10L8,0M0,0L0,10').attr('fill', 'none').attr('stroke', c).attr('stroke-width', 1.4);
      break;
    case 'fort':
      g.append('rect').attr('x', -6).attr('y', -6).attr('width', 12).attr('height', 12).attr('fill', NAT.de).attr('stroke', LIGHT).attr('stroke-width', 1.8);
      break;
    case 'gap':
      g.append('circle').attr('r', 26).attr('fill', 'rgba(38,36,31,.08)').attr('stroke', NAT.de).attr('stroke-width', 2).attr('stroke-dasharray', '5 4');
      break;
    case 'storm': {
      const wave = 'M-9,-2q3-5 6 0t6 0t6 0M-9,4q3-5 6 0t6 0t6 0';
      g.append('path').attr('d', wave).attr('fill', 'none').attr('stroke', LIGHT).attr('stroke-width', 4.5);
      g.append('path').attr('d', wave).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2);
      break;
    }
    case 'bomb':
      break; // drawn as a hatched zone instead
    default:
      g.append('rect').attr('x', -5).attr('y', -5).attr('width', 10).attr('height', 10).attr('transform', 'rotate(45)').attr('fill', c).attr('stroke', LIGHT).attr('stroke-width', 1.6);
  }
}

export class Markers {
  private readonly gEvents = select('#events');
  private readonly gArrows = select('#arrows');
  private readonly gBombs = select('#bombs');
  /** Places labelled by an event marker in the current scene */
  hiddenPlaces = new Set<string>();

  constructor(private readonly view: View, private readonly reduceMotion: boolean) {
    document.addEventListener('click', () => this.hidePop());
  }

  clear(): void {
    this.gEvents.selectAll('*').remove(); this.gArrows.selectAll('*').remove(); this.gBombs.selectAll('*').remove();
    this.hiddenPlaces = new Set();
  }

  /** Add a scene's markers and arrows, fading and drawing them in. */
  build(sc: Scene): void {
    const { view, reduceMotion } = this;
    this.clear();
    const evs = sc.events || [];
    this.hiddenPlaces = new Set(evs.map(e => e.n));
    evs.forEach((e, i) => {
      if (e.k === 'bomb') {
        const [x, y] = e.p, dx = 0.041, dy = 0.009;
        this.gBombs.append('path').datum<Polygon>({ type: 'Polygon', coordinates: [[[x - dx, y - dy], [x - dx, y + dy], [x + dx, y + dy], [x + dx, y - dy], [x - dx, y - dy]]] })
          .attr('fill', 'url(#hatch)').attr('stroke', '#8a2a1f').attr('stroke-width', 1.5).attr('opacity', 0)
          .transition().delay(200).duration(700).attr('opacity', 0.9);
      }
      const g = this.gEvents.append('g').attr('class', 'ev').attr('tabindex', 0).attr('role', 'button')
        .attr('aria-label', e.n + (e.note ? ': ' + e.note : '')).datum(e).attr('opacity', 0);
      drawSymbol(g.append('g') as unknown as G, e);
      const lab = g.append('g').attr('class', 'lab');
      lab.append('text').attr('class', 'ev-label').text(e.n);
      if (e.note && !view.mobile) lab.append('text').attr('class', 'ev-note').attr('dy', 15).text(e.note);
      g.transition().delay(reduceMotion ? 0 : 250 + i * 180).duration(reduceMotion ? 0 : 500).attr('opacity', 1);
      g.on('mouseenter focus', (ev: Event) => this.showPop(ev, e)).on('mouseleave blur', () => this.hidePop())
        .on('click', (ev: Event) => { ev.stopPropagation(); this.showPop(ev, e); });
    });
    (sc.arrows || []).forEach(a => {
      const g = this.gArrows.append('g').datum(a);
      const casing = a.n === 'de' ? 'rgba(236,231,216,.75)' : 'rgba(22,22,18,.35)';
      g.append('path').attr('class', 'arrow-casing').attr('stroke', casing).attr('stroke-width', (a.w || 2.4) + 3);
      g.append('path').attr('class', 'arrow').attr('stroke', NAT[a.n]).attr('stroke-width', a.w || 2.4);
    });
    this.render();
    this.gArrows.selectAll<SVGGElement, Arrow>('g').each(function (a, i) {
      const g = select(this), paths = g.selectAll('path');
      const len = (g.select('.arrow').node() as SVGPathElement).getTotalLength() || 1;
      const dash = a.dash ? '7 6' : null;
      if (reduceMotion) { paths.attr('stroke-dasharray', dash); g.select('.arrow').attr('marker-end', `url(#ah-${a.n})`); return; }
      paths.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
        .transition().delay(300 + i * 220).duration(1100).ease(easeCubicOut).attr('stroke-dashoffset', 0)
        .on('end', function () { select(this).attr('stroke-dasharray', dash); });
      g.select('.arrow').transition('head').delay(300 + i * 220 + 1000).duration(0).attr('marker-end', `url(#ah-${a.n})`);
    });
  }

  /** Reposition everything for the current camera. */
  render(): void {
    const view = this.view;
    this.gEvents.selectAll<SVGGElement, MapEvent>('.ev').each(function (e) {
      const p = view.P(e.p);
      const show = view.visible(e.p) && view.inView(p, 0);
      this.style.display = show ? '' : 'none';
      if (!show || !p) return;
      this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
      const lab = this.querySelector('.lab') as SVGGElement;
      const r = e.k === 'gap' ? 30 : 12;
      let lp = e.lp || (e.l ? 'l' : 'r');
      if (lp === 'r' && p[0] > view.avail.x + view.avail.w - 190) lp = 'l';
      const hasNote = !!lab.querySelector('.ev-note');
      const tf = ({ r: [r, -2, 'start'], l: [-r, -2, 'end'], t: [0, hasNote ? -30 : -16, 'middle'], b: [0, 24, 'middle'] } as const)[lp] || [r, -2, 'start'];
      lab.setAttribute('transform', `translate(${tf[0]},${tf[1]})`);
      lab.querySelectorAll('text').forEach(t => t.setAttribute('text-anchor', tf[2]));
    });
    this.gBombs.selectAll<SVGPathElement, Polygon>('path').attr('d', d => view.path(d));
    this.gArrows.selectAll<SVGGElement, Arrow>('g').each(function (a) {
      const d = curve(a.pts.map(p => view.P(p) as Pt)) || '';
      this.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    });
  }

  /** Screen positions of the current event markers. */
  eventPoints(sc: Scene | null): Pt[] {
    return sc ? (sc.events || []).map(e => this.view.P(e.p)).filter((p): p is Pt => !!p) : [];
  }

  showPop(ev: Event, e: MapEvent): void {
    const pop = $('pop');
    $('pop-t').textContent = e.n;
    $('pop-n').textContent = e.note || '';
    pop.style.setProperty('--pc', NAT[e.nat || 'all']);
    pop.hidden = false;
    const r = (ev.currentTarget as Element).getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    pop.style.left = Math.min(this.view.W - pw - 8, Math.max(8, r.left + r.width / 2 - pw / 2)) + 'px';
    pop.style.top = Math.max(8, r.top - ph - 10) + 'px';
  }

  hidePop(): void { $('pop').hidden = true; }
}

/** Arrowhead markers, one per nation colour. */
export function addArrowheads(defs: Selection<SVGDefsElement, unknown, HTMLElement, unknown>): void {
  for (const k of Object.keys(NAT) as (keyof typeof NAT)[]) {
    defs.append('marker').attr('id', 'ah-' + k).attr('viewBox', '0 0 10 10').attr('refX', 3).attr('refY', 5)
      .attr('markerWidth', 3.2).attr('markerHeight', 3.2).attr('orient', 'auto')
      .append('path').attr('d', 'M0,0L10,5L0,10Z').attr('fill', NAT[k]);
  }
}
