// Site-wide names and URL helpers shared by pages and the atlas.
import type { Scene } from '../data/types';
import { withBase } from './url';

export const SITE_NAME = 'Normandy 1944';
export const SITE_TAGLINE = 'An animated atlas of the Battle of Normandy, 6 June to 30 August 1944';

/** Path of a moment's page, e.g. /cobra/. The home page is the cover. */
export function momentPath(id: string): string {
  return withBase(`${id}/`);
}

/** Path of a stop: a moment, or a step of one (/epsom/, /epsom/2/). */
export function scenePath(sc: Scene): string {
  if (sc.step && sc.step.n > 1) return withBase(`${sc.step.moment}/${sc.step.n}/`);
  return withBase(`${sc.step?.moment ?? sc.id}/`);
}

/** Anchor on the Sources page for one figure of a moment. */
export function figureAnchor(momentId: string, i: number): string {
  return `fig-${momentId}-${i + 1}`;
}

export function figureHref(momentId: string, i: number): string {
  return withBase(`sources/#${figureAnchor(momentId, i)}`);
}

/** Anchor on the Sources page for a moment's armour count. */
export function armourHref(momentId: string): string {
  return withBase(`sources/#armour-${momentId}`);
}
