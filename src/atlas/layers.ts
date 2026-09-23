// The base map: sea, graticule, land, borders, rivers, beaches, and the town
// and sea labels. Which layers and labels show depends on the zoom level.
import { select, type Selection } from 'd3-selection';
import { geoGraticule10 } from 'd3-geo';
import type { Polygon } from 'geojson';
import type { LonLat, Place, SeaLabel } from '../data/types';
import { PLACES, SEA_LABELS } from '../data/places';
import { HAND_RIVERS } from '../data/rivers';
import { NAT, BEACH_NAT, BEACH_NAME, RING_KEYS } from '../data/nations';
import type { Geo } from './geo';
import type { Pt, View } from './view';

// World land is drawn only outside this box; inside it the detailed layers take over.
const HOLE: Polygon = (() => {
  const r: LonLat[] = [], W = -12, S = 41, E = 12, N = 56;
  for (let y = S; y <= N; y += 0.5) r.push([W, y]);
  for (let x = W; x <= E; x += 0.5) r.push([x, N]);
  for (let y = N; y >= S; y -= 0.5) r.push([E, y]);
  for (let x = E; x >= W; x -= 0.5) r.push([x, S]);
  return { type: 'Polygon', coordinates: [r] };
})();

const graticule = geoGraticule10();

/** What the labels need to know about the current scene. */
export interface LabelContext {
  showBeaches: boolean;
  /** Screen positions of this scene's event markers; nearby town labels step aside */
  eventPoints: Pt[];
  /** Places already labelled by an event marker */
  hiddenPlaces: Set<string>;
}

export class BaseMap {
  private readonly rivMajor;
  private readonly rivMinor;
  private readonly rivHand;
  private readonly gBeaches = select('#beaches');
  private readonly placeSel: Selection<SVGGElement, Place, SVGGElement, unknown>;
  private readonly seaSel: Selection<SVGTextElement, SeaLabel, SVGGElement, unknown>;

  constructor(private readonly geo: Geo) {
    const gRivers = select('#rivers');
    this.rivMajor = gRivers.append('path').attr('class', 'river');
    this.rivMinor = gRivers.append('path').attr('class', 'river minor');
    this.rivHand = gRivers.append('path').attr('class', 'river minor');

    for (const k of RING_KEYS) {
      const g = this.gBeaches.append('g').attr('data-k', k);
      g.append('path').attr('class', 'beach').attr('stroke', NAT[BEACH_NAT[k]]);
      g.append('text').attr('class', 'beach-label').attr('fill', BEACH_NAT[k] === 'us' ? '#9dbdec' : k === 'juno' ? '#ee8f86' : '#e8c47c').text(BEACH_NAME[k]);
    }

    this.placeSel = select<SVGGElement, unknown>('#places').selectAll<SVGGElement, Place>('g').data(PLACES).join('g');
    this.placeSel.append('circle').attr('class', 'place-dot').attr('r', d => d.big ? 3 : 2.2);
    this.placeSel.append('text').attr('class', d => 'place' + (d.big ? ' big' : '')).attr('x', 6).attr('y', 4).text(d => d.n);

    this.seaSel = select<SVGGElement, unknown>('#sealabels').selectAll<SVGTextElement, SeaLabel>('text').data(SEA_LABELS).join('text')
      .attr('class', 'sea-label').attr('text-anchor', 'middle').text(d => d.n);
  }

  /** Land, sea, borders and rivers. */
  renderGround(view: View): void {
    const s = view.cam.scale, geo = this.geo;
    select('#sphere').attr('d', view.path({ type: 'Sphere' }));
    select('#grat').attr('d', s < 3500 ? view.path(graticule) : null).attr('opacity', s < 3500 ? Math.min(1, (3500 - s) / 1500) : 0);
    select('#world').attr('d', s < 20000 ? view.path(geo.world) : null);
    select('#world-hole').attr('d', `M-10,-10H${view.W + 10}V${view.H + 10}H-10Z` + (view.path(HOLE) || ''));
    select('#borders').attr('d', s < 9000 ? view.path(geo.borders) : null);
    select('#land-other').attr('d', view.path(geo.others));
    select('#land-fr').attr('d', view.path(geo.france));

    this.rivMajor.attr('d', s > 2500 ? view.path(geo.rivers) : null);
    this.rivMinor.attr('d', s > 5000 ? view.path(geo.riversMinor) : null);
    this.rivHand.attr('d', s > 9000 ? view.path(HAND_RIVERS) : null);
  }

  /** Beaches, town names and sea names. */
  renderLabels(view: View, ctx: LabelContext): void {
    const s = view.cam.scale;
    this.gBeaches.style('display', ctx.showBeaches ? '' : 'none');
    if (ctx.showBeaches) {
      for (const k of RING_KEYS) {
        const g = this.gBeaches.select(`[data-k="${k}"]`);
        const ln = this.geo.beaches[k];
        g.select('path').attr('d', 'M' + ln.map(p => (view.P(p) as Pt).map(v => v.toFixed(1)).join(',')).join('L'))
          .attr('stroke-width', Math.max(3, Math.min(9, s / 7000)));
        const mid = view.P(ln[Math.floor(ln.length / 2)]) as Pt;
        const lbl = g.select('text').style('display', s > 20000 ? '' : 'none');
        const tight = s < 45000;
        if (k === 'utah') lbl.attr('x', mid[0] + (tight ? -14 : 14)).attr('y', mid[1] + 6).attr('text-anchor', tight ? 'end' : 'start');
        else if (tight && k === 'juno') lbl.attr('x', mid[0]).attr('y', mid[1] + 30).attr('text-anchor', 'middle');
        else lbl.attr('x', mid[0]).attr('y', mid[1] - 14).attr('text-anchor', 'middle');
      }
    }

    this.placeSel.each(function (d) {
      const p = view.P(d.p);
      if (p && ctx.eventPoints.some(q => Math.abs(q[0] - p[0]) < 70 && Math.abs(q[1] - p[1]) < 14)) { this.style.display = 'none'; return; }
      const show = s >= d.z && view.visible(d.p) && view.inView(p) && !ctx.hiddenPlaces.has(d.n) && !view.isBlocked(p);
      this.style.display = show ? '' : 'none';
      if (show && p) this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
    });
    this.seaSel.each(function (d) {
      const p = view.P(d.p);
      const show = s >= d.z && s < d.zmax && view.visible(d.p) && !view.isBlocked(p);
      this.style.display = show ? '' : 'none';
      if (show && p) { this.setAttribute('x', String(p[0])); this.setAttribute('y', String(p[1])); }
    });
  }
}
