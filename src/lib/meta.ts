// Page titles and descriptions for the front page and each moment.
import type { Scene } from '../data/types';
import { SITE_NAME } from './site';
import { dayLabel, fullDate } from '../atlas/panel';

export function coverTitle(): string {
  return `${SITE_NAME}: 85 days from the beaches to the Seine`;
}

export function coverDescription(): string {
  return 'An animated, interactive map of the Battle of Normandy, 6 June to 30 August 1944: the landings, the fight for Caen and the bocage, the breakout and the liberation of Paris, moment by moment.';
}

export function momentTitle(sc: Scene): string {
  const name = sc.step ? `${sc.title}: ${sc.step.title}` : sc.title;
  return `${name}, ${fullDate(sc)} (${dayLabel(sc.day)}) · ${SITE_NAME}`;
}

/** First sentence(s) of the story, trimmed to a search-result length. */
export function momentDescription(sc: Scene): string {
  const text = sc.body.join(' ');
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}
