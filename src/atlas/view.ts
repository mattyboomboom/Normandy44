// The shared view: projection, current camera and screen layout.
// Every layer draws through this object, so there is one source of truth for
// where things are on screen.
import { geoOrthographic, geoPath, geoDistance, type GeoPermissibleObjects } from 'd3-geo';
import type { LonLat } from '../data/types';
import type { Box, Cam } from './camera';

export type Pt = [number, number];
export interface Rect { left: number; right: number; top: number; bottom: number }

const $ = (id: string) => document.getElementById(id) as HTMLElement;

/** Mobile layout kicks in at this width (matches the CSS breakpoint). */
export const MOBILE_MAX = 900;

export class View {
  readonly proj = geoOrthographic().clipAngle(90).precision(0.25);
  readonly gpath = geoPath(this.proj);
  cam: Cam = { lon: -35, lat: 28, scale: 200 };
  W = 0;
  H = 0;
  mobile = false;
  avail: Box = { x: 0, y: 0, w: 0, h: 0 };
  /** Screen areas covered by UI, where map labels should not go */
  blocked: Rect[] = [];

  constructor(private readonly svg: SVGSVGElement) {}

  /** Measure the window and the panel to find the free area for the map. */
  layout(): void {
    this.W = innerWidth; this.H = innerHeight; this.mobile = this.W <= MOBILE_MAX;
    this.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    const barH = this.mobile ? 70 : 84;
    const pr = $('panel').getBoundingClientRect();
    if (this.mobile) {
      const ph = pr.height || this.H * 0.4;
      this.avail = { x: 0, y: 70, w: this.W, h: Math.max(160, this.H - barH - ph - 70 - 16) };
    } else {
      const right = pr.width ? this.W - pr.left : 440;
      this.avail = { x: 0, y: 60, w: this.W - right, h: this.H - barH - 60 - 10 };
    }
  }

  /** Record which parts of the screen are covered by visible UI. */
  measureBlocked(): void {
    this.blocked = ['counter', 'legend', 'intro', 'panel'].map(id => $(id))
      .filter(el => el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none')
      .map(el => el.getBoundingClientRect());
  }

  isBlocked(p: Pt | null): boolean {
    return !!p && this.blocked.some(r => p[0] > r.left - 4 && p[0] < r.right + 60 && p[1] > r.top - 8 && p[1] < r.bottom + 8);
  }

  /** Point the projection at the current camera. Call once per frame before drawing. */
  apply(): void {
    const { cam, avail } = this;
    this.proj.rotate([-cam.lon, -cam.lat]).scale(cam.scale).translate([avail.x + avail.w / 2, avail.y + avail.h / 2]);
  }

  /** Project a point; null when it is on the far side of the globe. */
  P(p: LonLat): Pt | null { return this.proj(p) as Pt | null; }

  path(o: GeoPermissibleObjects): string | null { return this.gpath(o); }

  inView(p: Pt | null, m = 40): p is Pt {
    return !!p && p[0] > -m && p[0] < this.W + m && p[1] > -m && p[1] < this.H + m;
  }

  /** Is a point on the visible hemisphere (with a small margin)? */
  visible(lonlat: LonLat): boolean {
    return geoDistance(lonlat, [this.cam.lon, this.cam.lat]) < Math.PI / 2 - 0.02;
  }
}
