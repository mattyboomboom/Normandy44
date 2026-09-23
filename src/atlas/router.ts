// Keeps the address bar in step with the moment on screen, so every moment
// has its own link and the browser's Back and Forward buttons step through
// the ones you visited.
//
//   /Normandy44/          the front page (cover)
//   /Normandy44/eve/      the first moment (the eve of D-Day)
//   /Normandy44/cobra/    Operation Cobra, and so on
//
// Old links of the form #scene=12 still work and are rewritten to the new
// address.

/** Normalise a path for comparison: always a trailing slash. */
const norm = (p: string) => (p.endsWith('/') ? p : p + '/');

/** Index used for the front page */
export const COVER = -1;
/** indexFor() result for a path that is neither the cover nor a moment */
export const UNKNOWN = -2;

export class Router {
  private readonly titles = new Map<number, string>();

  /**
   * @param paths  the page path of each moment, in order
   * @param coverPath  the front page
   * @param onNavigate  called when the user goes Back or Forward (COVER for the front page)
   */
  constructor(private readonly paths: string[], private readonly coverPath: string, onNavigate: (i: number) => void) {
    addEventListener('popstate', () => {
      const i = this.indexFor(location.pathname);
      if (i !== UNKNOWN) onNavigate(i);
    });
  }

  /** Moment a path points at: its index, COVER, or UNKNOWN. */
  indexFor(pathname: string): number {
    if (norm(pathname) === norm(this.coverPath)) return COVER;
    const i = this.paths.findIndex(p => norm(p) === norm(pathname));
    return i >= 0 ? i : UNKNOWN;
  }

  private pathFor(i: number): string { return i === COVER ? this.coverPath : this.paths[i]; }

  /** Moment requested by an old-style #scene=N link, or -1. */
  legacyIndex(hash: string): number {
    const m = hash.match(/scene=(\d+)/);
    if (!m) return -1;
    return Math.max(0, Math.min(this.paths.length - 1, +m[1] - 1));
  }

  setTitle(i: number, title: string): void { this.titles.set(i, title); }

  /**
   * Show moment i in the address bar. `push` adds a history entry (a step the
   * user took); otherwise the current entry is replaced (autoplay, start-up).
   */
  show(i: number, push: boolean): void {
    const path = this.pathFor(i);
    const title = this.titles.get(i);
    if (title) document.title = title;
    try {
      const same = norm(location.pathname) === norm(path) && !location.hash;
      if (same) return;
      if (push) history.pushState({ i }, '', path);
      else history.replaceState({ i }, '', path);
    } catch { /* sandboxed iframes can refuse history changes */ }
  }
}
