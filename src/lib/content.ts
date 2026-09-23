// Loads the moments and sources at build time and cross-checks them.
// checkContent is pure so the unit tests can run it without Astro.
import type { Scene, Source } from '../data/types';

/** Top-level pages that a moment's URL must not clash with. */
export const RESERVED_SLUGS = ['about', 'sources', 'story', 'og', 'data', 'fonts', '_astro', '404'];

/**
 * Consistency checks that a single-file schema cannot express.
 * Returns a list of problems; an empty list means the content is sound.
 */
export function checkContent(scenes: Scene[], sources: Source[], stateKeys: string[]): string[] {
  const errors: string[] = [];
  const srcIds = new Set(sources.map(s => s.id));
  const states = new Set(stateKeys);

  scenes.forEach((sc, i) => {
    const where = `moment "${sc.id}"`;
    if (sc.order !== i + 1) errors.push(`${where}: order is ${sc.order}, expected ${i + 1} (orders must run 1, 2, 3 … without gaps)`);
    if (i > 0 && sc.day < scenes[i - 1].day) errors.push(`${where}: day ${sc.day} is earlier than the previous moment (${scenes[i - 1].day})`);
    if (!states.has(sc.state)) errors.push(`${where}: unknown area state "${sc.state}" (see src/data/areas.ts)`);
    if (RESERVED_SLUGS.includes(sc.id)) errors.push(`${where}: the id clashes with a site page; rename the file`);
    (sc.forces || []).forEach((f, j) => {
      for (const key of f.src || []) {
        if (!srcIds.has(key)) errors.push(`${where}, figure ${j + 1} ("${f.k}"): unknown source "${key}" (add it to src/content/sources.yaml)`);
      }
    });
  });
  if (scenes.length && scenes[0].cam && Array.isArray(scenes[0].cam)) errors.push('the first moment must be a globe view');
  const ids = scenes.map(s => s.id);
  ids.forEach((id, i) => { if (ids.indexOf(id) !== i) errors.push(`duplicate moment id "${id}"`); });
  for (const s of sources) {
    if (s.via && !srcIds.has(s.via)) errors.push(`source "${s.id}": via "${s.via}" is not a known source`);
  }
  return errors;
}

/** Sources actually cited by at least one figure, in bibliography order. */
export function citedSources(scenes: Scene[], sources: Source[]): Source[] {
  const cited = new Set<string>();
  for (const sc of scenes) for (const f of sc.forces || []) for (const k of f.src || []) cited.add(k);
  // a work checked via a web page makes that page cited too
  for (const s of sources) if (cited.has(s.id) && s.via) cited.add(s.via);
  return sources.filter(s => cited.has(s.id));
}
