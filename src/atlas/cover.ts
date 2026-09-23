// The front page title. On the cover it is a big "Normandy, 1944" over the
// globe; once the story starts it shrinks into a small wordmark (bottom left
// on desktop, top right on phones) that links back to the cover.
//
// The title keeps its large font size and is moved with a CSS transform, so
// it stays sharp and the move can be animated. This module measures where
// the docked wordmark should sit and hands CSS the translate and scale.
import { MOBILE_MAX } from './view';

const $ = (id: string) => document.getElementById(id) as HTMLElement;

/** Size of the docked wordmark, in CSS pixels of cap height-ish font size */
const DOCK_FONT_DESKTOP = 28;
const DOCK_FONT_MOBILE = 20;

export class Cover {
  private readonly brand = $('brand');
  private readonly body = document.body;

  constructor(onBrandClick: () => void) {
    this.brand.querySelector('a')?.addEventListener('click', e => {
      e.preventDefault();
      if (this.isDocked()) onBrandClick();
    });
    addEventListener('resize', () => this.measure());
  }

  isDocked(): boolean { return this.body.classList.contains('docked'); }

  /**
   * Work out the transform that takes the title from its cover position to the
   * docked corner, and publish it as CSS custom properties.
   */
  measure(): void {
    const b = this.brand;
    const prev = b.style.transition;
    // measure the untransformed title
    b.style.transition = 'none';
    b.style.transform = 'none';
    const r = b.getBoundingClientRect();
    const fontPx = parseFloat(getComputedStyle(b).fontSize);
    b.style.transform = '';
    void b.offsetWidth;
    b.style.transition = prev;

    const W = innerWidth, H = innerHeight, mobile = W <= MOBILE_MAX;
    const s = (mobile ? DOCK_FONT_MOBILE : DOCK_FONT_DESKTOP) / fontPx;
    const w = r.width * s, h = r.height * s;
    const barH = mobile ? 70 : 84;
    let x: number, y: number;
    if (mobile) {
      x = W - 14 - w;
      y = 14;
    } else {
      x = Math.max(12, Math.min(24, W * 0.016));
      y = H - barH - 14 - h;
    }
    const st = this.body.style;
    st.setProperty('--dock-x', `${(x - r.left).toFixed(1)}px`);
    st.setProperty('--dock-y', `${(y - r.top).toFixed(1)}px`);
    st.setProperty('--dock-s', s.toFixed(4));
  }

  /** Shrink the title into the corner (animated unless `instant`). */
  dock(instant = false): void {
    this.measure();
    this.set(true, instant);
  }

  /** Bring the title back to the cover. */
  undock(instant = false): void { this.set(false, instant); }

  private set(docked: boolean, instant: boolean): void {
    const b = this.brand;
    if (instant) b.style.transition = 'none';
    this.body.classList.toggle('docked', docked);
    this.body.classList.toggle('at-cover', !docked);
    this.body.classList.add('brand-ready');
    const link = b.querySelector('a');
    if (link) {
      link.setAttribute('aria-label', docked ? 'Normandy, 1944: back to the front page' : 'Normandy, 1944');
      link.tabIndex = docked ? 0 : -1;
    }
    if (instant) { void b.offsetWidth; b.style.transition = ''; }
  }
}
