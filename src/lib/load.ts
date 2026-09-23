// Build-time access to the content collections. Import only from .astro pages
// and endpoints (it depends on astro:content).
import { getCollection } from 'astro:content';
import type { Scene, Source } from '../data/types';
import { STATES } from '../data/areas';
import { checkContent } from './content';

let cache: Promise<{ scenes: Scene[]; sources: Source[] }> | null = null;

/** All moments in story order, and the bibliography. Throws if the content is inconsistent. */
export function loadContent(): Promise<{ scenes: Scene[]; sources: Source[] }> {
  cache ??= (async () => {
    const moments = await getCollection('moments');
    const scenes = moments
      .map(m => ({ id: m.id, ...m.data }) as Scene)
      .sort((a, b) => a.order - b.order);
    const sources = (await getCollection('sources')).map(s => s.data as Source);
    const errors = checkContent(scenes, sources, Object.keys(STATES));
    if (errors.length) throw new Error('Content check failed:\n  - ' + errors.join('\n  - '));
    return { scenes, sources };
  })();
  return cache;
}
