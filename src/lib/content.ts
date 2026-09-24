// Loads the moments and sources at build time and cross-checks them.
// checkContent is pure so the unit tests can run it without Astro.
import type { Armour, Arrow, Camera, Force, MapEvent, Scene, Source, TacLabel, TacLine, Unit, Zone } from '../data/types';

/** A moment as written in src/content/moments/*.yaml (after schema parsing). */
export interface MomentData {
  order: number;
  title: string;
  forces?: Force[];
  forcesNote?: string;
  armour?: Armour;
  day?: number;
  date?: string;
  cam?: Camera;
  state?: string;
  beaches?: boolean;
  body?: string[];
  events?: MapEvent[];
  arrows?: Arrow[];
  units?: Unit[];
  lines?: TacLine[];
  zones?: Zone[];
  labels?: TacLabel[];
  steps?: {
    title: string; day: number; date: string; cam: Camera; state: string; beaches?: boolean; body: string[];
    events?: MapEvent[]; arrows?: Arrow[]; units?: Unit[]; lines?: TacLine[]; zones?: Zone[]; labels?: TacLabel[];
  }[];
}

/**
 * Turn moments into the sequence of stops the atlas plays through. A moment
 * with steps becomes one scene per step: "epsom", "epsom-2", "epsom-3".
 * Figures, notes and the armour count belong to the moment and are shared
 * by its steps. Scenes are numbered 1, 2, 3 … in story order.
 */
export function flattenMoments(moments: { id: string; data: MomentData }[]): Scene[] {
  const sorted = [...moments].sort((a, b) => a.data.order - b.data.order);
  const scenes: Scene[] = [];
  for (const { id, data: m } of sorted) {
    const shared = { title: m.title, forces: m.forces, forcesNote: m.forcesNote, armour: m.armour };
    if (!m.steps) {
      scenes.push({
        ...shared, id, order: 0, day: m.day!, date: m.date!, cam: m.cam!, state: m.state!, beaches: !!m.beaches, body: m.body!,
        events: m.events, arrows: m.arrows, units: m.units, lines: m.lines, zones: m.zones, labels: m.labels
      });
      continue;
    }
    m.steps.forEach((st, k) => {
      scenes.push({
        ...shared, id: k === 0 ? id : `${id}-${k + 1}`, order: 0,
        day: st.day, date: st.date, cam: st.cam, state: st.state, beaches: !!st.beaches, body: st.body,
        events: st.events, arrows: st.arrows, units: st.units, lines: st.lines, zones: st.zones, labels: st.labels,
        step: { n: k + 1, of: m.steps!.length, title: st.title, moment: id }
      });
    });
  }
  scenes.forEach((s, i) => { s.order = i + 1; });
  return scenes;
}

/** Order numbers of the moment files must run 1, 2, 3 … without gaps or repeats. */
export function checkMomentOrder(moments: { id: string; data: { order: number } }[]): string[] {
  const errors: string[] = [];
  const sorted = [...moments].sort((a, b) => a.data.order - b.data.order);
  sorted.forEach((m, i) => {
    if (m.data.order !== i + 1) errors.push(`moment "${m.id}": order is ${m.data.order}, expected ${i + 1} (orders must run 1, 2, 3 … without gaps)`);
  });
  return errors;
}

/** The moment a scene belongs to (its own id unless it is a step). */
export const momentOf = (sc: Scene): string => sc.step?.moment ?? sc.id;

/** One scene per moment: the first step of stepped moments. */
export const firstSteps = (scenes: Scene[]): Scene[] => scenes.filter(s => !s.step || s.step.n === 1);

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
    const where = sc.step ? `moment "${sc.step.moment}", step ${sc.step.n}` : `moment "${sc.id}"`;
    if (sc.order !== i + 1) errors.push(`${where}: order is ${sc.order}, expected ${i + 1} (orders must run 1, 2, 3 … without gaps)`);
    if (i > 0 && sc.day < scenes[i - 1].day) errors.push(`${where}: day ${sc.day} is earlier than the previous stop (${scenes[i - 1].day})`);
    if (!states.has(sc.state)) errors.push(`${where}: unknown area state "${sc.state}" (see src/data/areas.ts)`);
    if (RESERVED_SLUGS.includes(momentOf(sc))) errors.push(`${where}: the id clashes with a site page; rename the file`);
    if (sc.step && sc.step.n > 1) return; // figures and armour are shared by all steps: check once
    (sc.forces || []).forEach((f, j) => {
      for (const key of f.src || []) {
        if (!srcIds.has(key)) errors.push(`${where}, figure ${j + 1} ("${f.k}"): unknown source "${key}" (add it to src/content/sources.yaml)`);
      }
    });
    for (const key of sc.armour?.src || []) {
      if (!srcIds.has(key)) errors.push(`${where}, armour count: unknown source "${key}" (add it to src/content/sources.yaml)`);
    }
  });
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
  for (const sc of scenes) {
    for (const f of sc.forces || []) for (const k of f.src || []) cited.add(k);
    for (const k of sc.armour?.src || []) cited.add(k);
  }
  // a work checked via a web page makes that page cited too
  for (const s of sources) if (cited.has(s.id) && s.via) cited.add(s.via);
  return sources.filter(s => cited.has(s.id));
}
