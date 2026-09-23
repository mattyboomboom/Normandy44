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

export interface Scene {
  id: string;
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
}
