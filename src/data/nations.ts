import type { Nation, RingKey } from './types';

export const NAT: Record<Nation, string> = { us: '#2e62ab', uk: '#b98a2c', ca: '#b3372f', pl: '#8f2a52', fr: '#5a4fb0', de: '#26241f', all: '#ece7d8' };
export const NAT_NAME: Record<Nation, string> = { us: 'US', uk: 'British', ca: 'Canadian', pl: 'Polish', fr: 'French', de: 'German', all: 'Allied' };
export const BEACH_NAT: Record<RingKey, Nation> = { utah: 'us', omaha: 'us', gold: 'uk', juno: 'ca', sword: 'uk' };
export const BEACH_NAME: Record<RingKey, string> = { utah: 'Utah', omaha: 'Omaha', gold: 'Gold', juno: 'Juno', sword: 'Sword' };
export const RING_KEYS: RingKey[] = ['utah', 'omaha', 'gold', 'juno', 'sword'];
