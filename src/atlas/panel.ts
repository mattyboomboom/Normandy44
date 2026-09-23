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
    if (sourceHref && f.check) {
      const label = f.check === 'verified' ? 'Source' : 'Unverified';
      const title = f.check === 'verified' ? 'Where this figure comes from' : 'This figure has not yet been checked against a source';
      cite = `<a class="fcite${f.check === 'unverified' ? ' unv' : ''}" href="${sourceHref(sc.id, i)}" title="${title}">${label}</a>`;
    }
    const detail = f.s || cite ? `<span class="fs">${esc(f.s || '')}${cite}</span>` : '';
    return `
    <div class="frow"><span class="fsw" style="background:${NAT[f.n]}" title="${NAT_NAME[f.n]}"></span>
      <span class="fk">${esc(f.k)}</span><span class="fv">${esc(f.v || '')}</span>
      ${detail}</div>`;
  }).join('');
}

export class Panel {
  private shownDay: number | null = null;

  /**
   * @param sourceHref builds the link for a figure's source note; figures
   *   without sources get no link
   */
  constructor(private readonly sourceHref?: (sceneId: string, i: number) => string) {
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
    $('p-body').innerHTML = bodyHtml(sc);
    $('f-head').textContent = forcesHeading(sc);
    $('f-rows').innerHTML = forcesHtml(sc, this.sourceHref);
    const ps = $('panel-scroll');
    ps.scrollTop = 0;
    ps.classList.remove('panel-enter'); void ps.offsetWidth; ps.classList.add('panel-enter');
    $('ddate').textContent = fullDate(sc);
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
