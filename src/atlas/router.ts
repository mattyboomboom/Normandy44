// Keeps the address bar in step with the moment on screen, so every moment
// has its own link and the browser's Back and Forward buttons step through
// the ones you visited.
//
//   /Normandy44/          the first moment (the eve of D-Day)
//   /Normandy44/cobra/    Operation Cobra, and so on
//
// Old links of the form #scene=12 still work and are rewritten to the new
// address.

/** Normalise a path for comparison: always a trailing slash. */
const norm = (p: string) => (p.endsWith('/') ? p : p + '/');

export class Router {
  private readonly titles: string[];

  /**
   * @param paths  the page path of each moment, in order
   * @param onNavigate  called when the user goes Back or Forward
   */
  constructor(private readonly paths: string[], onNavigate: (i: number) => void) {
    this.titles = paths.map(() => '');
    addEventListener('popstate', () => {
      const i = this.indexFor(location.pathname);
      if (i >= 0) onNavigate(i);
    });
  }

  /** Index of the moment a path points at, or -1. */
  indexFor(pathname: string): number {
    return this.paths.findIndex(p => norm(p) === norm(pathname));
  }

  /** Moment requested by an old-style #scene=N link, or -1. */
  legacyIndex(hash: string): number {
    const m = hash.match(/scene=(\d+)/);
    if (!m) return -1;
    return Math.max(0, Math.min(this.paths.length - 1, +m[1] - 1));
  }

  setTitle(i: number, title: string): void { this.titles[i] = title; }

  /**
   * Show moment i in the address bar. `push` adds a history entry (a step the
   * user took); otherwise the current entry is replaced (autoplay, start-up).
   */
  show(i: number, push: boolean): void {
    const path = this.paths[i];
    if (this.titles[i]) document.title = this.titles[i];
    try {
      const same = norm(location.pathname) === norm(path) && !location.hash;
      if (same) return;
      if (push) history.pushState({ i }, '', path);
      else history.replaceState({ i }, '', path);
    } catch { /* sandboxed iframes can refuse history changes */ }
  }
}
