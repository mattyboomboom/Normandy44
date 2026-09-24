// The names of the soundscape moods. Each moment (or step) picks one with
// `sound:`; src/atlas/sound.ts says what each one sounds like.
export const MOODS = [
  'calm', 'sea', 'air', 'beach', 'beach-heavy', 'night', 'battle', 'battle-heavy',
  'distant', 'storm', 'thunder', 'bombing', 'bocage', 'fighters', 'bells', 'aftermath'
] as const;

export type Mood = typeof MOODS[number];
