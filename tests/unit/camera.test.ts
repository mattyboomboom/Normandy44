import { describe, expect, it } from 'vitest';
import { geoOrthographic } from 'd3-geo';
import { frameCamera, flightPath, globeScale, panCam, zoomCam, MAX_SCALE, MIN_SCALE, type Box } from '../../src/atlas/camera';
import type { Camera } from '../../src/data/types';

const desktop: Box = { x: 0, y: 60, w: 996, h: 746 };
const mobile: Box = { x: 0, y: 70, w: 390, h: 300 };

/** Projected size of a box when framed by the camera, in pixels. */
function extent(view: [[number, number], [number, number]], cam: { lon: number; lat: number; scale: number }) {
  const p = geoOrthographic().rotate([-cam.lon, -cam.lat]).scale(cam.scale).translate([0, 0]);
  const [[w, s], [e, n]] = view;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
    const [x, y] = p([w + (e - w) * i / 8, s + (n - s) * j / 8]) as [number, number];
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { w: x1 - x0, h: y1 - y0 };
}

describe('frameCamera', () => {
  it('centres a globe view on its centre at the globe scale', () => {
    const view: Camera = { globe: true, center: [-13, 41.5] };
    expect(frameCamera(view, desktop, false)).toEqual({ lon: -13, lat: 41.5, scale: globeScale(desktop) });
  });

  it('centres a bounding box on its midpoint', () => {
    const cam = frameCamera([[-1.8, 48.98], [-0.05, 49.45]], desktop, false);
    expect(cam.lon).toBeCloseTo(-0.925, 10);
    expect(cam.lat).toBeCloseTo(49.215, 10);
  });

  it('fills 90% of the free area on desktop along the tighter side', () => {
    const view: [[number, number], [number, number]] = [[-1.8, 48.98], [-0.05, 49.45]];
    const e = extent(view, frameCamera(view, desktop, false));
    expect(e.w).toBeLessThanOrEqual(desktop.w * 0.9 + 1e-6);
    expect(e.h).toBeLessThanOrEqual(desktop.h * 0.9 + 1e-6);
    expect(Math.max(e.w / desktop.w, e.h / desktop.h)).toBeCloseTo(0.9, 6);
  });

  it('uses more of the screen on mobile (96%)', () => {
    const view: [[number, number], [number, number]] = [[-1.42, 49.22], [-0.12, 49.5]];
    const e = extent(view, frameCamera(view, mobile, true));
    expect(Math.max(e.w / mobile.w, e.h / mobile.h)).toBeCloseTo(0.96, 6);
  });

  it('zooms in further for a smaller box', () => {
    const wide = frameCamera([[-5, 46.9], [4.3, 50.2]], desktop, false);
    const tight = frameCamera([[-1.05, 49.315], [-0.76, 49.425]], desktop, false);
    expect(tight.scale).toBeGreaterThan(wide.scale * 10);
  });
});

describe('flightPath', () => {
  it('starts and ends on the two cameras', () => {
    const a = { lon: -42, lat: 20, scale: 300 }, b = { lon: -0.9, lat: 49.3, scale: 40000 };
    const f = flightPath(a, b, 1000);
    for (const [t, want] of [[0, a], [1, b]] as const) {
      const c = f.at(t);
      expect(c.lon).toBeCloseTo(want.lon, 6);
      expect(c.lat).toBeCloseTo(want.lat, 6);
      expect(c.scale).toBeCloseTo(want.scale, 3);
    }
    expect(f.duration).toBeGreaterThan(0);
  });
});

describe('manual pan and zoom', () => {
  it('keeps zoom within limits', () => {
    const cam = { lon: 0, lat: 49, scale: 1000 };
    expect(zoomCam(cam, 1e-6).scale).toBe(MIN_SCALE);
    expect(zoomCam(cam, 1e6).scale).toBe(MAX_SCALE);
    expect(zoomCam(cam, 2).scale).toBe(2000);
  });

  it('drags the map the way the pointer moves and stops short of the poles', () => {
    const cam = { lon: 0, lat: 49, scale: 5000 };
    expect(panCam(cam, 100, 0).lon).toBeLessThan(0); // drag right: look further west
    expect(panCam(cam, 0, 100).lat).toBeGreaterThan(49); // drag down: look further north
    expect(panCam(cam, 0, 1e9).lat).toBe(80);
  });
});
