// Generates the link-preview image for every moment (public/og/<id>.png,
// 1200 x 630) by drawing the map for that moment, the same way the site does,
// and adding the day, title and date. Runs before every build:
//
//   npm run og
//
// Rendering is done with resvg, so no browser is needed. Fonts come from
// scripts/og-fonts (TTF copies of the site's fonts).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { Resvg } from '@resvg/resvg-js';
import { geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { line, curveCatmullRom } from 'd3-shape';
import type { Feature, MultiLineString, MultiPolygon } from 'geojson';

import { moment } from '../src/content/schema';
import { STATES, RING_NATION } from '../src/data/areas';
import { NAT, BEACH_NAT, RING_KEYS } from '../src/data/nations';
import { HAND_RIVERS } from '../src/data/rivers';
import { resampleStates } from '../src/atlas/rings';
import { frameCamera, type Box } from '../src/atlas/camera';
import { dayLabel, fullDate } from '../src/atlas/panel';
import type { LonLat, Scene } from '../src/data/types';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/og');
const W = 1200, H = 630;
/** Free area for the map, to the right of the title block */
const AVAIL: Box = { x: 360, y: 24, w: W - 360 - 24, h: H - 48 };

interface GeoSource {
  world: MultiPolygon; borders: MultiLineString; france: MultiPolygon; others: MultiPolygon;
  rivers: MultiLineString; riversMinor: MultiLineString; beaches: Record<string, LonLat[]>;
}
const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-src/geo.json'), 'utf8')) as GeoSource;
const states = resampleStates(STATES);

const scenes: Scene[] = fs.readdirSync(path.join(ROOT, 'src/content/moments')).filter(f => f.endsWith('.yaml')).sort()
  .map(f => ({ id: f.replace(/^\d+-/, '').replace(/\.yaml$/, ''), ...moment.parse(YAML.parse(fs.readFileSync(path.join(ROOT, 'src/content/moments', f), 'utf8'))) }) as Scene);

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** Break text into lines of at most `max` characters. */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function render(sc: Scene): string {
  const cam = frameCamera(sc.cam, AVAIL, false);
  const proj = geoOrthographic().clipAngle(90).precision(0.25)
    .rotate([-cam.lon, -cam.lat]).scale(cam.scale).translate([AVAIL.x + AVAIL.w / 2, AVAIL.y + AVAIL.h / 2]);
  const gp = geoPath(proj);
  const d = (o: GeoPermissibleObjects) => gp(o) || '';
  const s = cam.scale;
  const P = (p: LonLat) => proj(p) as [number, number] | null;

  const ringD = (pts: LonLat[]) => {
    const xy = pts.map(P).filter((p): p is [number, number] => !!p);
    return xy.length ? 'M' + xy.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z' : '';
  };
  const st = states[sc.state];
  const rings = RING_KEYS.map(k => ({ k, d: ringD(st[k]), c: NAT[RING_NATION[k]] })).filter(r => r.d);

  const curve = line().curve(curveCatmullRom.alpha(0.5));
  const arrows = (sc.arrows || []).map(a => {
    const pts = a.pts.map(P);
    if (pts.some(p => !p)) return '';
    const dd = curve(pts as [number, number][]) || '';
    const w = (a.w || 2.4) * 1.3;
    const casing = a.n === 'de' ? 'rgba(236,231,216,.75)' : 'rgba(22,22,18,.35)';
    const dash = a.dash ? ' stroke-dasharray="9 7"' : '';
    return `<path d="${dd}" fill="none" stroke="${casing}" stroke-width="${w + 3}" stroke-linecap="round"${dash}/>` +
      `<path d="${dd}" fill="none" stroke="${NAT[a.n]}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#ah-${a.n})"${dash}/>`;
  }).join('');

  const events = (sc.events || []).filter(e => e.k !== 'bomb').map(e => {
    const p = P(e.p);
    if (!p || p[0] < AVAIL.x - 10) return '';
    const c = NAT[e.nat || 'all'];
    if (e.k === 'fort') return `<rect x="${p[0] - 7}" y="${p[1] - 7}" width="14" height="14" fill="${NAT.de}" stroke="#f3efe2" stroke-width="2"/>`;
    if (e.k === 'gap') return `<circle cx="${p[0]}" cy="${p[1]}" r="30" fill="rgba(38,36,31,.08)" stroke="${NAT.de}" stroke-width="2.5" stroke-dasharray="6 5"/>`;
    return `<circle cx="${p[0]}" cy="${p[1]}" r="8" fill="${c}" stroke="#f3efe2" stroke-width="2.5"/>`;
  }).join('');

  const beaches = sc.beaches ? RING_KEYS.map(k => {
    const xy = geo.beaches[k].map(P);
    if (xy.some(p => !p)) return '';
    return `<path d="M${(xy as [number, number][]).map(p => p.join(',')).join('L')}" fill="none" stroke="${NAT[BEACH_NAT[k]]}" stroke-width="${Math.max(4, Math.min(10, s / 6000))}" stroke-linecap="round"/>`;
  }).join('') : '';

  const titleLines = wrap(sc.title, 17);
  const titleY = 330;
  const title = titleLines.map((l, i) => `<tspan x="56" y="${titleY + i * 54}">${esc(l)}</tspan>`).join('');
  const dateY = titleY + titleLines.length * 54 + 12;
  const markers = Object.entries(NAT).map(([k, c]) =>
    `<marker id="ah-${k}" viewBox="0 0 10 10" refX="3" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0,0L10,5L0,10Z" fill="${c}"/></marker>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  ${markers}
  <clipPath id="fr"><path d="${d(geo.france as unknown as Feature)}"/></clipPath>
  <linearGradient id="shade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#10181e" stop-opacity=".94"/>
    <stop offset=".34" stop-color="#10181e" stop-opacity=".86"/>
    <stop offset=".52" stop-color="#10181e" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="#182530"/>
<path d="${d({ type: 'Sphere' })}" fill="#23343f"/>
${s < 3500 ? `<path d="${d(geoGraticule10())}" fill="none" stroke="rgba(233,228,212,.07)" stroke-width=".7"/>` : ''}
${s < 20000 ? `<path d="${d(geo.world)}" fill="#b4b7a2"/>` : ''}
<path d="${d(geo.others)}" fill="#b4b7a2" stroke="#6f6a52" stroke-width=".5"/>
<path d="${d(geo.france)}" fill="#d6cba9" stroke="#6f6a52" stroke-width=".6"/>
${s > 2500 ? `<path d="${d(geo.rivers)}" fill="none" stroke="#6f93a6" stroke-width="1.1" opacity=".8"/>` : ''}
${s > 5000 ? `<path d="${d(geo.riversMinor)}" fill="none" stroke="#6f93a6" stroke-width=".8" opacity=".6"/>` : ''}
${s > 9000 ? `<path d="${d(HAND_RIVERS)}" fill="none" stroke="#6f93a6" stroke-width=".8" opacity=".6"/>` : ''}
<g clip-path="url(#fr)">
  ${rings.map(r => `<path d="${r.d}" fill="none" stroke="#1c1a15" stroke-width="6" stroke-linejoin="round"/>`).join('')}
  ${rings.map(r => `<path d="${r.d}" fill="#d6cba9" stroke="#d6cba9" stroke-width="2" stroke-linejoin="round"/>`).join('')}
  ${rings.map(r => `<path d="${r.d}" fill="${r.c}" stroke="${r.c}" stroke-width="3" stroke-linejoin="round" opacity=".62"/>`).join('')}
</g>
${beaches}
${arrows}
${events}
<rect width="${W}" height="${H}" fill="url(#shade)"/>
<text x="52" y="236" font-family="Big Shoulders Stencil Display" font-weight="800" font-size="196" fill="#ece7d8">${esc(dayLabel(sc.day))}</text>
<text font-family="Source Serif 4" font-weight="600" font-size="48" fill="#ece7d8">${title}</text>
<text x="56" y="${dateY}" font-family="Source Serif 4" font-size="27" fill="#aeb4ab">${esc(fullDate(sc))}</text>
<text x="56" y="${H - 44}" font-family="Source Serif 4" font-style="italic" font-size="23" fill="#aeb4ab">Normandy 1944 · an animated atlas</text>
</svg>`;
}

const fontFiles = fs.readdirSync(path.join(ROOT, 'scripts/og-fonts')).map(f => path.join(ROOT, 'scripts/og-fonts', f));
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
for (const [i, sc] of scenes.entries()) {
  const png = new Resvg(render(sc), {
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Source Serif 4' },
    fitTo: { mode: 'width', value: W }
  }).render().asPng();
  fs.writeFileSync(path.join(OUT, `${sc.id}.png`), png);
  if (i === 0) fs.writeFileSync(path.join(OUT, 'default.png'), png);
}
console.log(`og: ${scenes.length} preview images in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
