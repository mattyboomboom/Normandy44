// The atlas: camera, map layers, scene overlays, panel, timeline and playback.
// Ported from the single-file prototype with behaviour unchanged. Phase 2 of
// the plan splits this file further (camera, layers, overlays, timeline, player).
import { select, type Selection } from 'd3-selection';
import 'd3-transition';
import { geoOrthographic, geoPath, geoGraticule10, geoDistance, type GeoPermissibleObjects } from 'd3-geo';
import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { timer, type Timer } from 'd3-timer';
import { interpolateZoom, type ZoomView } from 'd3-interpolate';
import { line, curveCatmullRom } from 'd3-shape';
import { easeCubicInOut, easeCubicOut } from 'd3-ease';
import { range } from 'd3-array';
import type { Polygon } from 'geojson';

import type { AreaState, Arrow, LonLat, MapEvent, Place, Scene, SeaLabel } from '../data/types';
import { SCENES } from '../data/scenes';
import { STATES, RING_NATION } from '../data/areas';
import { PLACES, SEA_LABELS } from '../data/places';
import { HAND_RIVERS } from '../data/rivers';
import { ashoreOn } from '../data/ashore';
import { NAT, NAT_NAME, BEACH_NAT, BEACH_NAME, RING_KEYS } from '../data/nations';
import { loadGeo, type Geo } from './geo';
import { RAD, COS, NPTS, resampleStates, cloneState } from './rings';

interface Cam { lon: number; lat: number; scale: number }
interface Rect { left: number; right: number; top: number; bottom: number }
type Pt = [number, number];

const $ = (id: string) => document.getElementById(id) as HTMLElement;

// World land is drawn only outside this box; inside it the detailed layers take over.
const HOLE: Polygon = (() => {
  const r: LonLat[] = [], W = -12, S = 41, E = 12, N = 56;
  for (let y = S; y <= N; y += 0.5) r.push([W, y]);
  for (let x = W; x <= E; x += 0.5) r.push([x, N]);
  for (let y = N; y >= S; y -= 0.5) r.push([E, y]);
  for (let x = E; x >= W; x -= 0.5) r.push([x, S]);
  return { type: 'Polygon', coordinates: [r] };
})();

export async function start(): Promise<void> {
  let GEO: Geo;
  try {
    GEO = await loadGeo();
  } catch (err) {
    console.error(err);
    $('p-title').textContent = 'The map could not be loaded';
    $('p-body').innerHTML = '<p>Please check your connection and reload the page.</p>';
    return;
  }
  run(GEO);
}

function run(GEO: Geo): void {
  // ------------------------------------------------------------------ setup
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = select<SVGSVGElement, unknown>('#map');

  const RS = resampleStates(STATES);
  let rings: AreaState = cloneState(RS.s0);

  // ------------------------------------------------------------------ projection & layout
  const proj = geoOrthographic().clipAngle(90).precision(0.25);
  const gpath = geoPath(proj);
  const graticule = geoGraticule10();
  const P = (p: LonLat) => proj(p) as Pt | null;
  let W = 0, H = 0, mobile = false;
  let avail = { x: 0, y: 0, w: 0, h: 0 };
  let cam: Cam = { lon: -35, lat: 28, scale: 200 };

  function layout() {
    W = innerWidth; H = innerHeight; mobile = W <= 900;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const barH = mobile ? 70 : 84;
    const pr = $('panel').getBoundingClientRect();
    if (mobile) {
      const ph = pr.height || H * 0.4;
      avail = { x: 0, y: 70, w: W, h: Math.max(160, H - barH - ph - 70 - 16) };
    } else {
      const right = pr.width ? W - pr.left : 440;
      avail = { x: 0, y: 60, w: W - right, h: H - barH - 60 - 10 };
    }
  }
  function globeScale() { return Math.min(avail.w, avail.h) * 1.05; }
  let blocked: Rect[] = [];
  function measureBlocked() {
    blocked = ['counter', 'legend', 'intro', 'panel'].map(id => $(id))
      .filter(el => el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none')
      .map(el => el.getBoundingClientRect());
  }
  function isBlocked(p: Pt | null) { return !!p && blocked.some(r => p[0] > r.left - 4 && p[0] < r.right + 60 && p[1] > r.top - 8 && p[1] < r.bottom + 8); }
  function camFor(sc: Scene): Cam {
    if (!Array.isArray(sc.cam)) return { lon: sc.cam.center[0], lat: sc.cam.center[1], scale: globeScale() };
    const [[w, s], [e, n]] = sc.cam;
    const c: LonLat = [(w + e) / 2, (s + n) / 2];
    const p = geoOrthographic().rotate([-c[0], -c[1]]).scale(1).translate([0, 0]);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
      const q = p([w + (e - w) * i / 8, s + (n - s) * j / 8]) as Pt;
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }
    const pad = mobile ? 0.96 : 0.9;
    return { lon: c[0], lat: c[1], scale: Math.min(avail.w * pad / (x1 - x0), avail.h * pad / (y1 - y0)) };
  }
  function applyCam() {
    proj.rotate([-cam.lon, -cam.lat]).scale(cam.scale).translate([avail.x + avail.w / 2, avail.y + avail.h / 2]);
  }

  // ------------------------------------------------------------------ static layers
  const gRings = select('#rings'), gFront = select('#front');
  for (const k of RING_KEYS) {
    gRings.append('path').attr('class', 'ring').attr('data-k', k).attr('fill', NAT[RING_NATION[k]]).attr('stroke', NAT[RING_NATION[k]]).attr('stroke-width', 3).attr('stroke-linejoin', 'round');
    gFront.append('path').attr('class', 'ring').attr('data-k', k).attr('fill', '#000').attr('stroke', '#000').attr('stroke-width', 4).attr('stroke-linejoin', 'round');
  }
  const gRivers = select('#rivers');
  const rivMajor = gRivers.append('path').attr('class', 'river');
  const rivMinor = gRivers.append('path').attr('class', 'river minor');
  const rivHand = gRivers.append('path').attr('class', 'river minor');

  const gBeaches = select('#beaches');
  for (const k of RING_KEYS) {
    const g = gBeaches.append('g').attr('data-k', k);
    g.append('path').attr('class', 'beach').attr('stroke', NAT[BEACH_NAT[k]]);
    g.append('text').attr('class', 'beach-label').attr('fill', BEACH_NAT[k] === 'us' ? '#9dbdec' : k === 'juno' ? '#ee8f86' : '#e8c47c').text(BEACH_NAME[k]);
  }

  const gPlaces = select('#places');
  const placeSel = gPlaces.selectAll<SVGGElement, Place>('g').data(PLACES).join('g');
  placeSel.append('circle').attr('class', 'place-dot').attr('r', d => d.big ? 3 : 2.2);
  placeSel.append('text').attr('class', d => 'place' + (d.big ? ' big' : '')).attr('x', 6).attr('y', 4).text(d => d.n);

  const seaSel = select('#sealabels').selectAll<SVGTextElement, SeaLabel>('text').data(SEA_LABELS).join('text')
    .attr('class', 'sea-label').attr('text-anchor', 'middle').text(d => d.n);

  const defs = svg.select('defs');
  for (const k of Object.keys(NAT) as (keyof typeof NAT)[]) {
    defs.append('marker').attr('id', 'ah-' + k).attr('viewBox', '0 0 10 10').attr('refX', 3).attr('refY', 5)
      .attr('markerWidth', 3.2).attr('markerHeight', 3.2).attr('orient', 'auto')
      .append('path').attr('d', 'M0,0L10,5L0,10Z').attr('fill', NAT[k]);
  }

  // ------------------------------------------------------------------ render
  let idx = -1, scene: Scene | null = null, arrived = false, hiddenPlaces = new Set<string>();

  function ringPath(pts: LonLat[]) {
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const p = P(pts[i]);
      if (!p) continue;
      d += (d ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1);
    }
    return d ? d + 'Z' : '';
  }
  function inView(p: Pt | null, m = 40) { return !!p && p[0] > -m && p[0] < W + m && p[1] > -m && p[1] < H + m; }
  function visible(lonlat: LonLat) { return geoDistance(lonlat, [cam.lon, cam.lat]) < Math.PI / 2 - 0.02; }
  const gp = (o: GeoPermissibleObjects) => gpath(o);

  function render() {
    applyCam();
    const s = cam.scale;
    select('#sphere').attr('d', gp({ type: 'Sphere' }));
    select('#grat').attr('d', s < 3500 ? gp(graticule) : null).attr('opacity', s < 3500 ? Math.min(1, (3500 - s) / 1500) : 0);
    select('#world').attr('d', s < 20000 ? gp(GEO.world) : null);
    select('#world-hole').attr('d', `M-10,-10H${W + 10}V${H + 10}H-10Z` + (gp(HOLE) || ''));
    select('#borders').attr('d', s < 9000 ? gp(GEO.borders) : null);
    select('#land-other').attr('d', gp(GEO.others));
    select('#land-fr').attr('d', gp(GEO.france));

    rivMajor.attr('d', s > 2500 ? gp(GEO.rivers) : null);
    rivMinor.attr('d', s > 5000 ? gp(GEO.riversMinor) : null);
    rivHand.attr('d', s > 9000 ? gp(HAND_RIVERS) : null);

    for (const k of RING_KEYS) {
      const d = ringPath(rings[k]);
      gRings.select(`[data-k="${k}"]`).attr('d', d);
      gFront.select(`[data-k="${k}"]`).attr('d', d);
    }

    const showBeaches = !!scene && scene.beaches;
    gBeaches.style('display', showBeaches ? '' : 'none');
    if (showBeaches) {
      for (const k of RING_KEYS) {
        const g = gBeaches.select(`[data-k="${k}"]`);
        const ln = GEO.beaches[k];
        g.select('path').attr('d', 'M' + ln.map(p => (P(p) as Pt).map(v => v.toFixed(1)).join(',')).join('L'))
          .attr('stroke-width', Math.max(3, Math.min(9, s / 7000)));
        const mid = P(ln[Math.floor(ln.length / 2)]) as Pt;
        const lbl = g.select('text').style('display', s > 20000 ? '' : 'none');
        const tight = s < 45000;
        if (k === 'utah') lbl.attr('x', mid[0] + (tight ? -14 : 14)).attr('y', mid[1] + 6).attr('text-anchor', tight ? 'end' : 'start');
        else if (tight && k === 'juno') lbl.attr('x', mid[0]).attr('y', mid[1] + 30).attr('text-anchor', 'middle');
        else lbl.attr('x', mid[0]).attr('y', mid[1] - 14).attr('text-anchor', 'middle');
      }
    }

    const evPts = arrived && scene ? (scene.events || []).map(e => P(e.p)).filter((p): p is Pt => !!p) : [];
    placeSel.each(function (d) {
      const p = P(d.p);
      if (p && evPts.some(q => Math.abs(q[0] - p[0]) < 70 && Math.abs(q[1] - p[1]) < 14)) { this.style.display = 'none'; return; }
      const show = s >= d.z && visible(d.p) && inView(p) && !hiddenPlaces.has(d.n) && !isBlocked(p);
      this.style.display = show ? '' : 'none';
      if (show && p) this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
    });
    seaSel.each(function (d) {
      const p = P(d.p);
      const show = s >= d.z && s < d.zmax && visible(d.p) && !isBlocked(p);
      this.style.display = show ? '' : 'none';
      if (show && p) { this.setAttribute('x', String(p[0])); this.setAttribute('y', String(p[1])); }
    });

    renderOverlays();
  }

  // ------------------------------------------------------------------ scene overlays (events, arrows)
  const gEvents = select('#events'), gArrows = select('#arrows'), gBombs = select('#bombs');
  const curve = line().curve(curveCatmullRom.alpha(0.5));

  function symbol(g: Selection<SVGGElement, unknown, null, undefined>, e: MapEvent) {
    const c = NAT[e.nat || 'all'], light = '#f3efe2';
    switch (e.k) {
      case 'star':
        g.append('circle').attr('class', 'pulse').attr('r', 7).attr('stroke', c);
        g.append('circle').attr('r', 6.5).attr('fill', c).attr('stroke', light).attr('stroke-width', 2);
        break;
      case 'clash': {
        const pts = range(16).map(i => { const r = i % 2 ? 4.2 : 10, a = i * Math.PI / 8; return [r * Math.cos(a), r * Math.sin(a)]; });
        g.append('circle').attr('class', 'pulse').attr('r', 8).attr('stroke', c);
        g.append('path').attr('d', 'M' + pts.join('L') + 'Z').attr('fill', c).attr('stroke', light).attr('stroke-width', 1.5);
        break;
      }
      case 'target':
        g.append('circle').attr('r', 9).attr('fill', 'none').attr('stroke', light).attr('stroke-width', 5);
        g.append('circle').attr('r', 9).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2.5);
        g.append('circle').attr('r', 2.5).attr('fill', c);
        break;
      case 'para':
        g.append('path').attr('d', 'M-9,0A9,8 0 0 1 9,0Z').attr('fill', c).attr('stroke', light).attr('stroke-width', 1.5);
        g.append('path').attr('d', 'M-8,0L0,10L8,0M0,0L0,10').attr('fill', 'none').attr('stroke', c).attr('stroke-width', 1.4);
        break;
      case 'fort':
        g.append('rect').attr('x', -6).attr('y', -6).attr('width', 12).attr('height', 12).attr('fill', NAT.de).attr('stroke', light).attr('stroke-width', 1.8);
        break;
      case 'gap':
        g.append('circle').attr('r', 26).attr('fill', 'rgba(38,36,31,.08)').attr('stroke', NAT.de).attr('stroke-width', 2).attr('stroke-dasharray', '5 4');
        break;
      case 'storm': {
        const wave = 'M-9,-2q3-5 6 0t6 0t6 0M-9,4q3-5 6 0t6 0t6 0';
        g.append('path').attr('d', wave).attr('fill', 'none').attr('stroke', light).attr('stroke-width', 4.5);
        g.append('path').attr('d', wave).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2);
        break;
      }
      case 'bomb':
        break;
      default:
        g.append('rect').attr('x', -5).attr('y', -5).attr('width', 10).attr('height', 10).attr('transform', 'rotate(45)').attr('fill', c).attr('stroke', light).attr('stroke-width', 1.6);
    }
  }

  function buildOverlays(sc: Scene) {
    gEvents.selectAll('*').remove(); gArrows.selectAll('*').remove(); gBombs.selectAll('*').remove();
    const evs = sc.events || [];
    hiddenPlaces = new Set(evs.map(e => e.n));
    evs.forEach((e, i) => {
      if (e.k === 'bomb') {
        const [x, y] = e.p, dx = 0.041, dy = 0.009;
        gBombs.append('path').datum<Polygon>({ type: 'Polygon', coordinates: [[[x - dx, y - dy], [x - dx, y + dy], [x + dx, y + dy], [x + dx, y - dy], [x - dx, y - dy]]] })
          .attr('fill', 'url(#hatch)').attr('stroke', '#8a2a1f').attr('stroke-width', 1.5).attr('opacity', 0)
          .transition().delay(200).duration(700).attr('opacity', 0.9);
      }
      const g = gEvents.append('g').attr('class', 'ev').attr('tabindex', 0).attr('role', 'button')
        .attr('aria-label', e.n + (e.note ? ': ' + e.note : '')).datum(e).attr('opacity', 0);
      symbol(g.append('g') as unknown as Selection<SVGGElement, unknown, null, undefined>, e);
      const lab = g.append('g').attr('class', 'lab');
      lab.append('text').attr('class', 'ev-label').text(e.n);
      if (e.note && !mobile) lab.append('text').attr('class', 'ev-note').attr('dy', 15).text(e.note);
      g.transition().delay(reduceMotion ? 0 : 250 + i * 180).duration(reduceMotion ? 0 : 500).attr('opacity', 1);
      g.on('mouseenter focus', (ev: Event) => showPop(ev, e)).on('mouseleave blur', hidePop)
        .on('click', (ev: Event) => { ev.stopPropagation(); showPop(ev, e); });
    });
    (sc.arrows || []).forEach(a => {
      const g = gArrows.append('g').datum(a);
      const casing = a.n === 'de' ? 'rgba(236,231,216,.75)' : 'rgba(22,22,18,.35)';
      g.append('path').attr('class', 'arrow-casing').attr('stroke', casing).attr('stroke-width', (a.w || 2.4) + 3);
      g.append('path').attr('class', 'arrow').attr('stroke', NAT[a.n]).attr('stroke-width', a.w || 2.4);
    });
    renderOverlays();
    gArrows.selectAll<SVGGElement, Arrow>('g').each(function (a, i) {
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

  function renderOverlays() {
    gEvents.selectAll<SVGGElement, MapEvent>('.ev').each(function (e) {
      const p = P(e.p);
      const show = visible(e.p) && inView(p, 0);
      this.style.display = show ? '' : 'none';
      if (!show || !p) return;
      this.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`);
      const lab = this.querySelector('.lab') as SVGGElement;
      const r = e.k === 'gap' ? 30 : 12;
      let lp = e.lp || (e.l ? 'l' : 'r');
      if (lp === 'r' && p[0] > avail.x + avail.w - 190) lp = 'l';
      const hasNote = !!lab.querySelector('.ev-note');
      const tf = ({ r: [r, -2, 'start'], l: [-r, -2, 'end'], t: [0, hasNote ? -30 : -16, 'middle'], b: [0, 24, 'middle'] } as const)[lp] || [r, -2, 'start'];
      lab.setAttribute('transform', `translate(${tf[0]},${tf[1]})`);
      lab.querySelectorAll('text').forEach(t => t.setAttribute('text-anchor', tf[2]));
    });
    gBombs.selectAll<SVGPathElement, Polygon>('path').attr('d', d => gpath(d));
    gArrows.selectAll<SVGGElement, Arrow>('g').each(function (a) {
      const d = curve(a.pts.map(p => P(p) as Pt)) || '';
      this.querySelectorAll('path').forEach(p => p.setAttribute('d', d));
    });
  }

  function showPop(ev: Event, e: MapEvent) {
    const pop = $('pop');
    $('pop-t').textContent = e.n;
    $('pop-n').textContent = e.note || '';
    pop.style.setProperty('--pc', NAT[e.nat || 'all']);
    pop.hidden = false;
    const r = (ev.currentTarget as Element).getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    pop.style.left = Math.min(W - pw - 8, Math.max(8, r.left + r.width / 2 - pw / 2)) + 'px';
    pop.style.top = Math.max(8, r.top - ph - 10) + 'px';
  }
  function hidePop() { $('pop').hidden = true; }
  document.addEventListener('click', hidePop);

  // ------------------------------------------------------------------ panel, counter, timeline
  function dayLabel(d: number) { return d < 0 ? 'D−' + (-d) : d === 0 ? 'D-Day' : 'D+' + d; }
  let shownDay: number | null = null;
  function setCounter(day: number) {
    const preDawn = !!scene && scene.day === 0 && scene.id !== 'nightfall';
    const d = Math.round(day);
    if (d !== shownDay) { $('dnum').textContent = dayLabel(d); shownDay = d; }
    const a = preDawn ? 0 : ashoreOn(day);
    $('ashore').innerHTML = a > 0 ? `<b>${(Math.round(a / 1000) * 1000).toLocaleString('en-GB')}</b> Allied troops ashore` : '';
  }
  function fullDate(sc: Scene) { return sc.date + (sc.date.includes('1944') ? '' : ' 1944'); }

  function fillPanel(sc: Scene) {
    const panel = $('panel');
    const first = sc.forces && sc.forces.find(f => f.n !== 'all' && f.n !== 'de');
    panel.style.setProperty('--accent', first ? NAT[first.n] : NAT.all);
    $('p-date').textContent = fullDate(sc);
    $('p-title').textContent = sc.title;
    $('p-body').innerHTML = sc.body.map(p => `<p>${p}</p>`).join('');
    $('f-head').textContent = sc.forcesNote || 'Troops and formations (approximate)';
    $('f-rows').innerHTML = (sc.forces || []).map(f => `
    <div class="frow"><span class="fsw" style="background:${NAT[f.n]}" title="${NAT_NAME[f.n]}"></span>
      <span class="fk">${f.k}</span><span class="fv">${f.v || ''}</span>
      ${f.s ? `<span class="fs">${f.s}</span>` : ''}</div>`).join('');
    const ps = $('panel-scroll');
    ps.scrollTop = 0;
    ps.classList.remove('panel-enter'); void ps.offsetWidth; ps.classList.add('panel-enter');
    $('ddate').textContent = fullDate(sc);
  }

  const track = $('track');
  const ticks = SCENES.map((sc, i) => {
    const b = document.createElement('button');
    b.className = 'tick';
    b.style.left = (i / (SCENES.length - 1) * 100) + '%';
    b.setAttribute('aria-label', `${sc.date}: ${sc.title}`);
    b.title = `${sc.date}: ${sc.title}`;
    b.innerHTML = `<i></i><span class="tl">${dayLabel(sc.day)}</span>`;
    b.addEventListener('click', () => { stopPlayTimer(); goTo(i); });
    track.appendChild(b);
    return b;
  });
  ([['June', 0], ['July', SCENES.findIndex(s => s.day >= 25)], ['August', SCENES.findIndex(s => s.day >= 56)]] as [string, number][]).forEach(([mo, i]) => {
    const el = document.createElement('span');
    el.className = 'month'; el.textContent = mo;
    el.style.left = (i / (SCENES.length - 1) * 100) + '%';
    track.appendChild(el);
  });
  function setTimeline(i: number, frac = 0) {
    ticks.forEach((t, j) => { t.classList.toggle('on', j === i); t.classList.toggle('done', j < i); });
    $('fill').style.width = Math.min(100, (i + frac) / (SCENES.length - 1) * 100) + '%';
    $('count').textContent = `${i + 1} of ${SCENES.length}`;
    ($('prev') as HTMLButtonElement).disabled = i <= 0; ($('next') as HTMLButtonElement).disabled = i >= SCENES.length - 1;
  }

  // ------------------------------------------------------------------ transitions
  let anim: Timer | null = null;
  function goTo(i: number, opts: { duration?: number; fresh?: boolean } = {}) {
    i = Math.max(0, Math.min(SCENES.length - 1, i));
    if (anim) { anim.stop(); anim = null; }
    hidePop();
    const prevScene = opts.fresh ? null : scene;
    idx = i; scene = SCENES[i]; arrived = false;
    const sc = scene;
    try { history.replaceState(null, '', '#scene=' + (i + 1)); } catch { /* sandboxed */ }
    gEvents.selectAll('*').remove(); gArrows.selectAll('*').remove(); gBombs.selectAll('*').remove();
    hiddenPlaces = new Set();
    fillPanel(sc); setTimeline(i);
    $('intro').classList.toggle('hidden', i !== 0);
    $('legend').classList.toggle('hidden', i === 0);
    document.body.classList.toggle('at-intro', i === 0);
    layout(); measureBlocked();

    const from = Object.assign({}, cam), to = camFor(sc);
    const p0: ZoomView = [from.lon * RAD * COS, from.lat * RAD, avail.w / from.scale];
    const p1: ZoomView = [to.lon * RAD * COS, to.lat * RAD, avail.w / to.scale];
    const iz = interpolateZoom(p0, p1);
    let dur = opts.duration != null ? opts.duration : Math.max(1300, Math.min(3400, iz.duration * 0.75));
    if (reduceMotion) dur = 0;

    const ringFrom = cloneState(rings), ringTo = RS[sc.state];
    const dayFrom = prevScene ? prevScene.day : sc.day, dayTo = sc.day;

    const step = (t: number) => {
      const e = easeCubicInOut(t);
      const z = iz(e);
      cam = { lon: z[0] / (RAD * COS), lat: z[1] / RAD, scale: avail.w / z[2] };
      const m = easeCubicInOut(Math.max(0, Math.min(1, (t - 0.3) / 0.7)));
      for (const k of RING_KEYS) {
        const a = ringFrom[k], b = ringTo[k], r = rings[k];
        for (let n = 0; n < NPTS; n++) { r[n][0] = a[n][0] + (b[n][0] - a[n][0]) * m; r[n][1] = a[n][1] + (b[n][1] - a[n][1]) * m; }
      }
      setCounter(dayFrom + (dayTo - dayFrom) * e);
      render();
    };
    // the front-line filter is the most expensive layer, so it sits out camera moves
    select('#front').style('display', 'none');
    if (dur === 0) { step(1); arrive(); return; }
    anim = timer(el => {
      const t = Math.min(1, el / dur);
      step(t);
      if (t >= 1) { anim?.stop(); anim = null; arrive(); }
    });
  }
  function arrive() {
    arrived = true;
    measureBlocked();
    select('#front').style('display', null);
    if (scene) buildOverlays(scene);
    render();
    if (playing) schedulePlay();
  }

  // ------------------------------------------------------------------ play
  let playing = false, playTimer: ReturnType<typeof setTimeout> | undefined, playStart = 0, playDur = 0, progRaf: number | null = null;
  function dwellFor(sc: Scene) {
    const words = sc.body.join(' ').split(/\s+/).length;
    return Math.max(7000, Math.min(16000, 5000 + words * 75));
  }
  function schedulePlay() {
    stopPlayTimer();
    if (idx >= SCENES.length - 1 || !scene) { setPlaying(false); return; }
    playDur = dwellFor(scene); playStart = performance.now();
    playTimer = setTimeout(() => goTo(idx + 1), playDur);
    const tick = () => {
      if (!playing) return;
      const f = Math.min(1, (performance.now() - playStart) / playDur);
      setTimeline(idx, f);
      if (f < 1) progRaf = requestAnimationFrame(tick);
    };
    progRaf = requestAnimationFrame(tick);
  }
  function stopPlayTimer() {
    clearTimeout(playTimer); playTimer = undefined;
    if (progRaf) cancelAnimationFrame(progRaf); progRaf = null;
    if (idx >= 0) setTimeline(idx);
  }
  function setPlaying(on: boolean) {
    playing = on;
    $('play').setAttribute('aria-label', on ? 'Pause' : 'Play');
    $('play-ico').innerHTML = on ? '<path d="M5 3.5h3.5v13H5zM11.5 3.5H15v13h-3.5z" fill="currentColor"/>' : '<path d="M6 3.5L16 10L6 16.5Z" fill="currentColor"/>';
    if (!on) { stopPlayTimer(); return; }
    if (idx >= SCENES.length - 1) goTo(0);
    else goTo(idx + 1);
  }

  // ------------------------------------------------------------------ interaction
  $('play').addEventListener('click', () => setPlaying(!playing));
  $('prev').addEventListener('click', () => { stopPlayTimer(); goTo(idx - 1); });
  $('next').addEventListener('click', () => { stopPlayTimer(); goTo(idx + 1); });
  $('btn-begin').addEventListener('click', () => setPlaying(true));
  $('btn-step').addEventListener('click', () => { setPlaying(false); goTo(1); });
  $('p-toggle').addEventListener('click', () => {
    const p = $('panel'), open = !p.classList.contains('open');
    p.classList.toggle('open', open);
    $('p-toggle').textContent = open ? 'Less' : 'More';
    $('p-toggle').setAttribute('aria-expanded', String(open));
  });
  addEventListener('keydown', e => {
    const target = e.target as HTMLElement;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { stopPlayTimer(); goTo(idx + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { stopPlayTimer(); goTo(idx - 1); e.preventDefault(); }
    else if (e.key === ' ' && target.tagName !== 'BUTTON') { setPlaying(!playing); e.preventDefault(); }
    else if (e.key === 'Home') { stopPlayTimer(); goTo(0); }
    else if (e.key === 'End') { stopPlayTimer(); goTo(SCENES.length - 1); }
    else if (e.key === 'Escape') hidePop();
  });

  // Free exploration: drag to pan, wheel or pinch to zoom. The next scene re-centres the camera.
  let lastT = zoomIdentity;
  const zoom = d3zoom<SVGSVGElement, unknown>().scaleExtent([1e-3, 1e6])
    .on('start', () => { if (anim) { anim.stop(); anim = null; if (!arrived) arrive(); } hidePop(); })
    .on('zoom', (ev: D3ZoomEvent<SVGSVGElement, unknown>) => {
      const t = ev.transform, k = t.k / lastT.k;
      if (Math.abs(k - 1) > 1e-6) {
        cam.scale = Math.max(150, Math.min(260000, cam.scale * k));
      } else {
        const dx = t.x - lastT.x, dy = t.y - lastT.y;
        cam.lon -= dx / (cam.scale * Math.max(0.2, Math.cos(cam.lat * RAD))) / RAD;
        cam.lat = Math.max(-80, Math.min(80, cam.lat + dy / cam.scale / RAD));
      }
      lastT = t;
      render();
    });
  svg.call(zoom).on('dblclick.zoom', null);

  let rz: ReturnType<typeof setTimeout> | undefined;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      layout(); measureBlocked();
      if (!scene) return;
      if (anim) { anim.stop(); anim = null; }
      cam = camFor(scene); rings = cloneState(RS[scene.state]);
      render(); if (!arrived) arrive();
    }, 120);
  });

  // ------------------------------------------------------------------ start
  layout();
  const hm = location.hash.match(/scene=(\d+)/);
  const startAt = hm ? Math.max(0, Math.min(SCENES.length - 1, +hm[1] - 1)) : 0;
  if (startAt === 0) {
    scene = SCENES[0];
    cam = { lon: -42, lat: 20, scale: globeScale() * 0.6 };
    setCounter(-1);
    render();
    goTo(0, { duration: reduceMotion ? 0 : 3200, fresh: true });
  } else {
    scene = SCENES[startAt];
    rings = cloneState(RS[scene.state]);
    layout(); cam = camFor(scene);
    goTo(startAt, { duration: 0, fresh: true });
  }
}
