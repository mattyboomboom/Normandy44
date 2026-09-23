// The info panel (date, title, story, forces) and the big day counter.
import type { Scene } from '../data/types';
import { NAT, NAT_NAME } from '../data/nations';
import { ashoreOn } from '../data/ashore';

const $ = (id: string) => document.getElementById(id) as HTMLElement;

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** D−1, D-Day, D+6 … */
export function dayLabel(d: number): string {
  return d < 0 ? 'D−' + (-d) : d === 0 ? 'D-Day' : 'D+' + d;
}

/** The scene's date with the year added when it is missing. */
export function fullDate(sc: Scene): string {
  return sc.date + (sc.date.includes('1944') ? '' : ' 1944');
}

/** Panel accent colour: the first Allied nation among the figures. */
export function accentFor(sc: Scene): string {
  const first = sc.forces && sc.forces.find(f => f.n !== 'all' && f.n !== 'de');
  return first ? NAT[first.n] : NAT.all;
}

export function forcesHeading(sc: Scene): string {
  return sc.forcesNote || 'Troops and formations (approximate)';
}

export function bodyHtml(sc: Scene): string {
  return sc.body.map(p => `<p>${esc(p)}</p>`).join('');
}

/**
 * The figures table. Shared by the browser (on every scene change) and the
 * build (so each moment's page ships with its text already in place).
 */
export function forcesHtml(sc: Scene, sourceHref?: (sceneId: string, i: number) => string): string {
  return (sc.forces || []).map((f, i) => {
    let cite = '';
    const moment = sc.step?.moment ?? sc.id;
    if (sourceHref && f.check) {
      const label = f.check === 'verified' ? 'Source' : 'Unverified';
      const title = f.check === 'verified' ? 'Where this figure comes from' : 'This figure has not yet been checked against a source';
      cite = `<a class="fcite${f.check === 'unverified' ? ' unv' : ''}" href="${sourceHref(moment, i)}" title="${title}">${label}</a>`;
    }
    const detail = f.s || cite ? `<span class="fs">${esc(f.s || '')}${cite}</span>` : '';
    return `
    <div class="frow"><span class="fsw" style="background:${NAT[f.n]}" title="${NAT_NAME[f.n]}"></span>
      <span class="fk">${esc(f.k)}</span><span class="fv">${esc(f.v || '')}</span>
      ${detail}</div>`;
  }).join('');
}

/** "Step 2 of 3 · The Scottish Corridor", or '' for a single-stop moment. */
export function stepLabel(sc: Scene): string {
  return sc.step ? `Step ${sc.step.n} of ${sc.step.of} · ${sc.step.title}` : '';
}

/** Blocks for a count of divisions: one per division, half a block for ½. */
function blocks(n: number): string {
  const whole = Math.floor(n), half = n - whole >= 0.5;
  return '<i></i>'.repeat(whole) + (half ? '<i class="h"></i>' : '');
}

const fmtCount = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`);

/**
 * The balance-of-armour gauge: German armoured divisions facing the British
 * and Canadians against those facing the Americans.
 */
export function armourHtml(sc: Scene, href?: (momentId: string) => string): string {
  const a = sc.armour;
  if (!a) return '';
  const row = (cls: string, label: string, n: number | null) =>
    `<div class="ar-row ${cls}"><span class="ar-l">${label}</span>` +
    (n === null ? `<span class="ar-na">not recorded</span>` : `<span class="ar-b" aria-hidden="true">${blocks(n)}</span><b class="ar-n">${fmtCount(n)}</b>`) +
    `</div>`;
  const tanks = a.tanks ? `<div class="ar-t">About ${a.tanks.br.toLocaleString('en-GB')} tanks against ${a.tanks.us.toLocaleString('en-GB')}</div>` : '';
  const link = href ? `<a class="ar-src" href="${href(sc.step?.moment ?? sc.id)}">Source</a>` : '';
  return `<div class="ar-h">German armoured divisions by front, ${esc(a.when)}</div>` +
    row('br', 'British &amp; Canadian', a.br) + row('us', 'American', a.us) + tanks + link;
}

export class Panel {
  private shownDay: number | null = null;

  /**
   * @param sourceHref builds the link for a figure's source note; figures
   *   without sources get no link
   */
  constructor(
    private readonly sourceHref?: (momentId: string, i: number) => string,
    private readonly armourHref?: (momentId: string) => string
  ) {
    $('p-toggle').addEventListener('click', () => {
      const p = $('panel'), open = !p.classList.contains('open');
      p.classList.toggle('open', open);
      $('p-toggle').textContent = open ? 'Less' : 'More';
      $('p-toggle').setAttribute('aria-expanded', String(open));
    });
  }

  fill(sc: Scene): void {
    const panel = $('panel');
    panel.style.setProperty('--accent', accentFor(sc));
    $('p-date').textContent = fullDate(sc);
    $('p-title').textContent = sc.title;
    const step = $('p-step');
    step.textContent = stepLabel(sc);
    step.hidden = !sc.step;
    $('p-body').innerHTML = bodyHtml(sc);
    $('f-head').textContent = forcesHeading(sc);
    $('f-rows').innerHTML = forcesHtml(sc, this.sourceHref);
    const ps = $('panel-scroll');
    ps.scrollTop = 0;
    ps.classList.remove('panel-enter'); void ps.offsetWidth; ps.classList.add('panel-enter');
    $('ddate').textContent = fullDate(sc);
    this.setArmour(sc);
  }

  /** Show (or hide) the balance-of-armour gauge for a scene. */
  setArmour(sc: Scene | null): void {
    const el = $('armour');
    const html = sc ? armourHtml(sc, this.armourHref) : '';
    el.innerHTML = html;
    el.hidden = !html;
  }

  /** Update the day counter and the troops-ashore line for a (fractional) day. */
  setCounter(day: number, sc: Scene | null): void {
    const preDawn = !!sc && sc.day === 0 && sc.id !== 'nightfall';
    const d = Math.round(day);
    if (d !== this.shownDay) { $('dnum').textContent = dayLabel(d); this.shownDay = d; }
    const a = preDawn ? 0 : ashoreOn(day);
    $('ashore').innerHTML = a > 0 ? `<b>${(Math.round(a / 1000) * 1000).toLocaleString('en-GB')}</b> Allied troops ashore` : '';
  }
}
