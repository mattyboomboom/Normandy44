// Site-wide names and URL helpers shared by pages and the atlas.
import { withBase } from './url';

export const SITE_NAME = 'Normandy 1944';
export const SITE_TAGLINE = 'An animated atlas of the Battle of Normandy, 6 June to 30 August 1944';

/** Path of a moment's page, e.g. /cobra/. The home page is the cover. */
export function momentPath(id: string): string {
  return withBase(`${id}/`);
}

/** Anchor on the Sources page for one figure. */
export function figureAnchor(sceneId: string, i: number): string {
  return `fig-${sceneId}-${i + 1}`;
}

export function figureHref(sceneId: string, i: number): string {
  return withBase(`sources/#${figureAnchor(sceneId, i)}`);
}
