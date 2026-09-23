// Shared types for the atlas content.

/** [longitude, latitude] in degrees */
export type LonLat = [number, number];

/** Nation codes used for colours and labels. `all` = Allied / combined. */
export type Nation = 'us' | 'uk' | 'ca' | 'pl' | 'fr' | 'de' | 'all';

/** One of the five landing forces whose area of control grows through the campaign. */
export type RingKey = 'utah' | 'omaha' | 'gold' | 'juno' | 'sword';

/** Name of a snapshot in STATES (s0 … s12). */
export type StateKey = string;

/** Outline of each landing force's area of control at one moment. */
export type AreaState = Record<RingKey, LonLat[]>;

export interface Place {
  n: string;
  p: LonLat;
  /** Minimum on-screen scale before the label shows */
  z: number;
  big?: 1;
}

export interface SeaLabel {
  n: string;
  p: LonLat;
  z: number;
  zmax: number;
}

export interface Force {
  n: Nation;
  /** What is being counted */
  k: string;
  /** The figure, pre-formatted (may be empty) */
  v?: string;
  /** Sub-line with detail */
  s?: string;
  /** Keys into the bibliography (src/content/sources.yaml) supporting this figure */
  src?: string[];
  /** Whether the figure has been checked against its sources */
  check?: 'verified' | 'unverified';
  /** Caveats about the figure */
  note?: string;
}

export type EventKind = 'star' | 'clash' | 'target' | 'para' | 'fort' | 'gap' | 'storm' | 'bomb' | 'harbour' | 'point';

export interface MapEvent {
  n: string;
  p: LonLat;
  k: EventKind;
  nat?: Nation;
  note?: string;
  /** Label on the left (legacy flag) */
  l?: 1;
  /** Label position: right, left, top, bottom */
  lp?: 'r' | 'l' | 't' | 'b';
}

export interface Arrow {
  n: Nation;
  pts: LonLat[];
  /** Stroke width */
  w?: number;
  /** Dashed line */
  dash?: 1;
}

export type Camera = [LonLat, LonLat] | { globe: true; center: LonLat };

/** Kind of formation, drawn as a simplified military map symbol. */
export type UnitKind = 'inf' | 'arm' | 'mech' | 'para' | 'kg';

/** A formation shown on a close-up map. Positions are approximate. */
export interface Unit {
  n: Nation;
  k: UnitKind;
  /** e.g. "15th (Scottish)", "12th SS" */
  label: string;
  p: LonLat;
  /** Echelon mark above the symbol */
  size?: 'corps' | 'div' | 'bde' | 'kg';
  /** Label position: right (default), left, top, bottom */
  lp?: 'r' | 'l' | 't' | 'b';
}

/** A line on a close-up map: start line, objective, road, ridge. */
export interface TacLine {
  kind: 'start' | 'objective' | 'road' | 'ridge' | 'front';
  pts: LonLat[];
  label?: string;
  n?: Nation;
}

/** A shaded area on a close-up map: bombing zone, corridor, pocket. */
export interface Zone {
  kind: 'bomb' | 'corridor' | 'pocket';
  pts: LonLat[];
  label?: string;
  n?: Nation;
}

/** A village or feature named only on a close-up map. */
export interface TacLabel { n: string; p: LonLat }

/** German armoured divisions facing each Allied army at a moment. */
export interface Armour {
  /** Facing the British and Canadians (null: not recorded) */
  br: number | null;
  /** Facing the Americans (null: not recorded) */
  us: number | null;
  tanks?: { br: number; us: number };
  /** When the count applies, e.g. "25 July" */
  when: string;
  src: string[];
  note?: string;
}

/** Where a scene sits inside a moment that is told in several steps. */
export interface StepInfo {
  /** 1-based */
  n: number;
  of: number;
  title: string;
  /** id of the moment the step belongs to */
  moment: string;
}

export interface Scene {
  /** URL slug, from the content file name (01-eve.yaml -> eve) */
  id: string;
  /** Position in the story, 1-based */
  order: number;
  /** Days relative to D-Day (6 June 1944 = 0) */
  day: number;
  date: string;
  title: string;
  /** Bounding box [[W,S],[E,N]] or a globe view */
  cam: Camera;
  state: StateKey;
  beaches: boolean;
  body: string[];
  forces?: Force[];
  forcesNote?: string;
  events?: MapEvent[];
  arrows?: Arrow[];
  units?: Unit[];
  lines?: TacLine[];
  zones?: Zone[];
  labels?: TacLabel[];
  armour?: Armour;
  /** Set when the moment is told in steps */
  step?: StepInfo;
}

/** A bibliography entry (src/content/sources.yaml). */
export interface Source {
  id: string;
  kind: 'web' | 'book' | 'official' | 'data';
  author: string;
  title: string;
  publisher?: string;
  year?: number;
  pages?: string;
  url?: string;
  accessed?: Date;
  via?: string;
  note?: string;
}
