// Automatic playback: dwell on each moment long enough to read it, then
// move on, filling the timeline as time passes.
import type { Scene } from '../data/types';

const $ = (id: string) => document.getElementById(id) as HTMLElement;

const PLAY_ICON = '<path d="M6 3.5L16 10L6 16.5Z" fill="currentColor"/>';
const PAUSE_ICON = '<path d="M5 3.5h3.5v13H5zM11.5 3.5H15v13h-3.5z" fill="currentColor"/>';

/** Reading time for a moment: about 75 ms a word, between 7 and 16 seconds. */
export function dwellFor(sc: Scene): number {
  const words = sc.body.join(' ').split(/\s+/).length;
  return Math.max(7000, Math.min(16000, 5000 + words * 75));
}

export interface PlayerHost {
  /** Index of the moment on screen */
  index(): number;
  count(): number;
  scene(): Scene | null;
  goTo(i: number): void;
  /** Show progress towards the next moment */
  progress(i: number, frac: number): void;
}

export class Player {
  playing = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private raf: number | null = null;

  constructor(private readonly host: PlayerHost) {}

  /** Called when a moment has finished arriving: wait, then advance. */
  schedule(): void {
    const { host } = this;
    this.stopTimer();
    const sc = host.scene();
    if (host.index() >= host.count() - 1 || !sc) { this.set(false); return; }
    const dur = dwellFor(sc), start = performance.now(), i = host.index();
    this.timer = setTimeout(() => host.goTo(i + 1), dur);
    const tick = () => {
      if (!this.playing) return;
      const f = Math.min(1, (performance.now() - start) / dur);
      host.progress(i, f);
      if (f < 1) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Cancel the pending advance (the user took over). */
  stopTimer(): void {
    clearTimeout(this.timer); this.timer = undefined;
    if (this.raf) cancelAnimationFrame(this.raf); this.raf = null;
    const i = this.host.index();
    if (i >= 0) this.host.progress(i, 0);
  }

  set(on: boolean): void {
    this.playing = on;
    $('play').setAttribute('aria-label', on ? 'Pause' : 'Play');
    $('play-ico').innerHTML = on ? PAUSE_ICON : PLAY_ICON;
    if (!on) { this.stopTimer(); return; }
    const { host } = this;
    if (host.index() >= host.count() - 1) host.goTo(0);
    else host.goTo(host.index() + 1);
  }

  toggle(): void { this.set(!this.playing); }
}
