// Camera maths. Pure functions only (no DOM), so they can be unit-tested.
//
// The camera is an orthographic projection centred on (lon, lat) at a given
// scale (pixels per radian). Scenes describe what to show either as a
// bounding box or as a globe view; frameCamera turns that into a camera that
// fits the free area of the screen.
import { geoOrthographic } from 'd3-geo';
import { interpolateZoom, type ZoomView } from 'd3-interpolate';
import type { Camera, LonLat } from '../data/types';
import { RAD, COS } from './rings';

export interface Cam { lon: number; lat: number; scale: number }

/** Part of the screen the map can use (not covered by the panel or the bar). */
export interface Box { x: number; y: number; w: number; h: number }

/** Smallest and largest zoom the user can reach by hand. */
export const MIN_SCALE = 150;
export const MAX_SCALE = 260000;

export function globeScale(avail: Box): number {
  return Math.min(avail.w, avail.h) * 1.05;
}

/**
 * Camera that fits a scene's view into the available box.
 * A bounding box is sampled on a 9x9 grid, projected around its centre, and
 * scaled so its projected extent fills `pad` of the box (more on mobile).
 */
export function frameCamera(view: Camera, avail: Box, mobile: boolean): Cam {
  if (!Array.isArray(view)) return { lon: view.center[0], lat: view.center[1], scale: globeScale(avail) };
  const [[w, s], [e, n]] = view;
  const c: LonLat = [(w + e) / 2, (s + n) / 2];
  const p = geoOrthographic().rotate([-c[0], -c[1]]).scale(1).translate([0, 0]);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
    const q = p([w + (e - w) * i / 8, s + (n - s) * j / 8]) as [number, number];
    x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
  }
  const pad = mobile ? 0.96 : 0.9;
  return { lon: c[0], lat: c[1], scale: Math.min(avail.w * pad / (x1 - x0), avail.h * pad / (y1 - y0)) };
}

/**
 * A smooth zoom-out-and-in flight between two cameras (van Wijk and Nuij,
 * via d3.interpolateZoom), in planar coordinates scaled for Normandy.
 */
export function flightPath(from: Cam, to: Cam, width: number): { at: (t: number) => Cam; duration: number } {
  const p0: ZoomView = [from.lon * RAD * COS, from.lat * RAD, width / from.scale];
  const p1: ZoomView = [to.lon * RAD * COS, to.lat * RAD, width / to.scale];
  const iz = interpolateZoom(p0, p1);
  return {
    at: t => { const z = iz(t); return { lon: z[0] / (RAD * COS), lat: z[1] / RAD, scale: width / z[2] }; },
    duration: iz.duration
  };
}

/** How long a scene change should take for a given flight, in ms. */
export function flightDuration(pathDuration: number): number {
  return Math.max(1300, Math.min(3400, pathDuration * 0.75));
}

/** Pan the camera by a screen-space drag of (dx, dy) pixels. */
export function panCam(cam: Cam, dx: number, dy: number): Cam {
  return {
    lon: cam.lon - dx / (cam.scale * Math.max(0.2, Math.cos(cam.lat * RAD))) / RAD,
    lat: Math.max(-80, Math.min(80, cam.lat + dy / cam.scale / RAD)),
    scale: cam.scale
  };
}

/** Zoom the camera by factor k, within the allowed range. */
export function zoomCam(cam: Cam, k: number): Cam {
  return { ...cam, scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, cam.scale * k)) };
}
