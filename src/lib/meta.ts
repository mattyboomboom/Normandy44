// Page titles and descriptions for each moment.
import type { Scene } from '../data/types';
import { SITE_NAME } from './site';
import { dayLabel, fullDate } from '../atlas/panel';

export function momentTitle(sc: Scene, index: number): string {
  return index === 0
    ? `${SITE_NAME}: 85 days from the beaches to the Seine`
    : `${sc.title}, ${fullDate(sc)} (${dayLabel(sc.day)}) · ${SITE_NAME}`;
}

/** First sentence of the story, trimmed to a search-result length. */
export function momentDescription(sc: Scene, index: number): string {
  if (index === 0) return 'An animated, interactive map of the Battle of Normandy, 6 June to 30 August 1944: the landings, the fight for the beachhead, the breakout and the liberation of Paris, in 18 moments.';
  const text = sc.body.join(' ');
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}
