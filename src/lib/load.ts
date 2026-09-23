// Build-time access to the content collections. Import only from .astro pages
// and endpoints (it depends on astro:content).
import { getCollection } from 'astro:content';
import type { Scene, Source } from '../data/types';
import { STATES } from '../data/areas';
import { checkContent, checkMomentOrder, flattenMoments, type MomentData } from './content';

let cache: Promise<{ scenes: Scene[]; sources: Source[] }> | null = null;

/**
 * Every stop in story order (moments, with stepped moments expanded into
 * their steps), and the bibliography. Throws if the content is inconsistent.
 */
export function loadContent(): Promise<{ scenes: Scene[]; sources: Source[] }> {
  cache ??= (async () => {
    const moments = (await getCollection('moments')).map(m => ({ id: m.id, data: m.data as MomentData }));
    const scenes = flattenMoments(moments);
    const sources = (await getCollection('sources')).map(s => s.data as Source);
    const errors = [...checkMomentOrder(moments), ...checkContent(scenes, sources, Object.keys(STATES))];
    if (errors.length) throw new Error('Content check failed:\n  - ' + errors.join('\n  - '));
    return { scenes, sources };
  })();
  return cache;
}
