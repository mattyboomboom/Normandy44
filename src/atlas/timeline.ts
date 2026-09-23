// The timeline bar: one tick per moment, month labels, progress fill, and
// the previous / next buttons' enabled state.
import type { Scene } from '../data/types';
import { dayLabel } from './panel';

const $ = (id: string) => document.getElementById(id) as HTMLElement;

export class Timeline {
  private readonly ticks: HTMLButtonElement[];

  constructor(private readonly scenes: Scene[], onPick: (i: number) => void, href?: (i: number) => string) {
    const track = $('track');
    const last = scenes.length - 1;
    this.ticks = scenes.map((sc, i) => {
      const b = document.createElement('button');
      // later steps of a close-up get a smaller tick
      b.className = sc.step && sc.step.n > 1 ? 'tick sub' : 'tick';
      b.style.left = (i / last * 100) + '%';
      const name = sc.step ? `${sc.title}, ${sc.step.title}` : sc.title;
      b.setAttribute('aria-label', `${sc.date}: ${name}`);
      b.title = `${sc.date}: ${name}`;
      if (href) b.dataset.href = href(i);
      b.innerHTML = `<i></i><span class="tl">${dayLabel(sc.day)}</span>`;
      b.addEventListener('click', () => onPick(i));
      track.appendChild(b);
      return b;
    });
    const months: [string, number][] = [['June', 0], ['July', scenes.findIndex(s => s.day >= 25)], ['August', scenes.findIndex(s => s.day >= 56)]];
    for (const [mo, i] of months) {
      if (i < 0) continue;
      const el = document.createElement('span');
      el.className = 'month'; el.textContent = mo;
      el.style.left = (i / last * 100) + '%';
      track.appendChild(el);
    }
  }

  /**
   * Mark moment i as current, with `frac` of the way to the next one filled.
   * i = -1 is the front page: nothing current, only "next" enabled.
   */
  set(i: number, frac = 0): void {
    const n = this.scenes.length;
    this.ticks.forEach((t, j) => { t.classList.toggle('on', j === i); t.classList.toggle('done', j < i); });
    $('fill').style.width = Math.max(0, Math.min(100, (i + frac) / (n - 1) * 100)) + '%';
    $('count').textContent = i < 0 ? `${n} moments` : `${i + 1} of ${n}`;
    ($('prev') as HTMLButtonElement).disabled = i < 0;
    ($('next') as HTMLButtonElement).disabled = i >= n - 1;
  }
}
