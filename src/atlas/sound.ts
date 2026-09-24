// Ambient soundscape, synthesised in the browser with the Web Audio API.
// There are no audio files: every sound is built from filtered noise and
// oscillators, so it costs nothing to download.
//
// Each moment names a mood (src/content/moments, `sound:`). A mood sets the
// level of five continuous layers (sea, wind, rain, aircraft engines, distant
// small-arms crackle) and the rate of three kinds of event (artillery, bombs,
// church bells). Moving between moments crossfades from one mood to the next.
//
// Sound is off until the visitor turns it on (browsers only allow audio
// after a click anyway), and the choice is remembered on their device.

import type { Mood } from '../data/moods';
export type { Mood };

interface Levels {
  sea: number; wind: number; rain: number; engines: number; crackle: number;
  /** events per minute */
  guns: number; bombs: number; bells: number;
}

const MOODS: Record<Mood, Levels> = {
  calm:          { sea: 0.15, wind: 0.45, rain: 0,    engines: 0,    crackle: 0,    guns: 0,  bombs: 0,  bells: 0 },
  sea:           { sea: 0.75, wind: 0.35, rain: 0,    engines: 0.45, crackle: 0,    guns: 0,  bombs: 0,  bells: 0 },
  air:           { sea: 0.1,  wind: 0.3,  rain: 0,    engines: 0.8,  crackle: 0,    guns: 5,  bombs: 0,  bells: 0 },
  beach:         { sea: 0.8,  wind: 0.25, rain: 0,    engines: 0.15, crackle: 0.25, guns: 14, bombs: 0,  bells: 0 },
  'beach-heavy': { sea: 0.7,  wind: 0.2,  rain: 0,    engines: 0,    crackle: 0.5,  guns: 22, bombs: 0,  bells: 0 },
  night:         { sea: 0.45, wind: 0.35, rain: 0,    engines: 0,    crackle: 0.05, guns: 4,  bombs: 0,  bells: 0 },
  battle:        { sea: 0,    wind: 0.3,  rain: 0,    engines: 0,    crackle: 0.2,  guns: 12, bombs: 0,  bells: 0 },
  'battle-heavy':{ sea: 0,    wind: 0.25, rain: 0,    engines: 0.1,  crackle: 0.35, guns: 22, bombs: 0,  bells: 0 },
  distant:       { sea: 0,    wind: 0.4,  rain: 0,    engines: 0,    crackle: 0.05, guns: 5,  bombs: 0,  bells: 0 },
  storm:         { sea: 0.9,  wind: 0.9,  rain: 0.7,  engines: 0,    crackle: 0,    guns: 0,  bombs: 0,  bells: 0 },
  thunder:       { sea: 0,    wind: 0.5,  rain: 0.75, engines: 0,    crackle: 0.1,  guns: 9,  bombs: 0,  bells: 0 },
  bombing:       { sea: 0,    wind: 0.2,  rain: 0,    engines: 0.9,  crackle: 0,    guns: 3,  bombs: 7,  bells: 0 },
  bocage:        { sea: 0,    wind: 0.35, rain: 0,    engines: 0,    crackle: 0.4,  guns: 8,  bombs: 0,  bells: 0 },
  fighters:      { sea: 0,    wind: 0.25, rain: 0,    engines: 0.6,  crackle: 0.15, guns: 8,  bombs: 2,  bells: 0 },
  bells:         { sea: 0,    wind: 0.3,  rain: 0,    engines: 0,    crackle: 0,    guns: 0,  bombs: 0,  bells: 30 },
  aftermath:     { sea: 0.1,  wind: 0.5,  rain: 0,    engines: 0,    crackle: 0,    guns: 1,  bombs: 0,  bells: 0 }
};


const STORE_KEY = 'n44-sound';
const FADE = 2.5; // seconds

/** A buffer of noise: white, pink or brown (deeper, rumbling). */
function noise(ctx: AudioContext, seconds: number, colour: 'white' | 'pink' | 'brown'): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (colour === 'white') d[i] = w;
      else if (colour === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else {
        // Paul Kellet's pink noise filter
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
  }
  return buf;
}

/** A simple reverb tail (decaying noise), to put distant sounds at a distance. */
function reverbImpulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

class Engine {
  readonly ctx = new AudioContext();
  private readonly master = this.ctx.createGain();
  private readonly verb = this.ctx.createConvolver();
  private readonly white: AudioBuffer;
  private readonly brown: AudioBuffer;
  private readonly bus: Record<'sea' | 'wind' | 'rain' | 'engines' | 'crackle', GainNode>;
  private rates = { guns: 0, bombs: 0, bells: 0, crackle: 0 };
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    const { ctx } = this;
    this.master.gain.value = 0;
    // a gentle limiter so a cluster of bombs never clips
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 6;
    this.master.connect(comp).connect(ctx.destination);
    this.verb.buffer = reverbImpulse(ctx, 3.5, 2.5);
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    this.verb.connect(wet).connect(this.master);

    this.white = noise(ctx, 4, 'white');
    this.brown = noise(ctx, 6, 'brown');
    const pink = noise(ctx, 5, 'pink');
    const loop = (buf: AudioBuffer) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = rand(0, 1); s.start(0, rand(0, buf.duration)); return s; };
    const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const lfo = (freq: number, depth: number, target: AudioParam) => {
      const o = ctx.createOscillator(); o.frequency.value = freq;
      const g = gain(depth); o.connect(g).connect(target); o.start(); return o;
    };
    const filter = (type: BiquadFilterType, freq: number, q = 0.7) => { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; };

    // Sea: brown noise, low-passed, with two slow swells for waves
    const sea = gain(), seaSwell = gain(0.55);
    loop(this.brown).connect(filter('lowpass', 520)).connect(seaSwell).connect(sea);
    lfo(0.11, 0.3, seaSwell.gain); lfo(0.043, 0.15, seaSwell.gain);
    const surf = gain(0.2);
    loop(pink).connect(filter('bandpass', 1800, 0.4)).connect(surf).connect(sea);
    lfo(0.11, 0.18, surf.gain);

    // Wind: pink noise through a band-pass filter whose pitch drifts
    const wind = gain(), windBody = gain(0.6);
    const wf = filter('bandpass', 420, 0.9);
    loop(pink).connect(wf).connect(windBody).connect(wind);
    lfo(0.05, 260, wf.frequency); lfo(0.083, 0.3, windBody.gain);

    // Rain: bright white noise
    const rain = gain();
    loop(this.white).connect(filter('highpass', 1400)).connect(filter('lowpass', 7500)).connect(gain(0.35)).connect(rain);

    // Aircraft: detuned low oscillators (the beat of many engines) and rumble, slowly passing
    const engines = gain(), pass = gain(0.6);
    const ef = filter('lowpass', 320, 1.2);
    for (const f of [58, 61.3, 87.5, 116.8, 119.4]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      lfo(rand(0.03, 0.09), rand(0.4, 1.2), o.frequency);
      const g = gain(0.09); o.connect(g).connect(ef); o.start();
    }
    loop(this.brown).connect(filter('lowpass', 180)).connect(gain(0.5)).connect(ef);
    ef.connect(pass).connect(engines);
    lfo(0.035, 0.35, pass.gain);

    // Distant small arms: the bus for short crackle bursts (scheduled below)
    const crackle = gain();

    this.bus = { sea, wind, rain, engines, crackle };
    const dry = gain(1);
    for (const b of [sea, wind, rain, engines]) b.connect(dry);
    dry.connect(this.master);
    crackle.connect(this.verb); crackle.connect(gain(0.4)).connect(this.master);
  }

  setVolume(v: number, seconds = 1): void {
    const g = this.master.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + seconds);
  }

  setMood(mood: Mood, fade = FADE): void {
    const m = MOODS[mood], t = this.ctx.currentTime;
    for (const k of ['sea', 'wind', 'rain', 'engines', 'crackle'] as const) {
      const g = this.bus[k].gain;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(m[k], t + fade);
    }
    this.rates = { guns: m.guns, bombs: m.bombs, bells: m.bells, crackle: m.crackle > 0 ? 6 + m.crackle * 20 : 0 };
    this.restartSchedules();
  }

  private restartSchedules(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    const every = (perMin: () => number, fire: () => void, slot: number) => {
      const next = () => {
        const r = perMin();
        if (r <= 0) return;
        // random (Poisson) spacing around the average rate
        const wait = -Math.log(1 - Math.random()) * 60000 / r;
        this.timers[slot] = setTimeout(() => { fire(); next(); }, wait);
      };
      next();
    };
    every(() => this.rates.guns, () => this.gun(), 0);
    every(() => this.rates.bombs, () => this.bombStick(), 1);
    every(() => this.rates.bells, () => this.bell(), 2);
    every(() => this.rates.crackle, () => this.burst(), 3);
  }

  /** One distant artillery shot: a low thud with a long rolling tail. */
  private gun(big = false): void {
    const { ctx } = this, t = ctx.currentTime + 0.01;
    const pan = ctx.createStereoPanner(); pan.pan.value = rand(-0.85, 0.85);
    const vol = (big ? rand(0.5, 0.8) : rand(0.18, 0.45));
    const src = ctx.createBufferSource(); src.buffer = this.brown;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = big ? rand(90, 160) : rand(140, 320);
    const env = ctx.createGain(); env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.001, t + (big ? rand(2.5, 4) : rand(1.2, 2.6)));
    src.connect(f).connect(env).connect(pan);
    // the body of the blast
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(big ? 52 : 70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    const og = ctx.createGain(); og.gain.setValueAtTime(vol * 0.8, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(og).connect(pan);
    pan.connect(this.verb); pan.connect(this.master);
    src.start(t, rand(0, 3)); src.stop(t + 4.5); o.start(t); o.stop(t + 0.8);
    // sometimes a battery fires a salvo
    if (!big && Math.random() < 0.25) {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 1; i <= n; i++) this.timers.push(setTimeout(() => this.gun(), i * rand(250, 700)));
    }
  }

  /** A stick of bombs: a run of heavy thuds walking across the field. */
  private bombStick(): void {
    const n = 3 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) this.timers.push(setTimeout(() => this.gun(true), i * rand(160, 320)));
  }

  /** A burst of distant rifle and machine-gun fire. */
  private burst(): void {
    const { ctx } = this;
    const shots = 3 + Math.floor(Math.random() * 10), gap = rand(0.06, 0.16), t0 = ctx.currentTime + 0.02;
    const pan = ctx.createStereoPanner(); pan.pan.value = rand(-0.9, 0.9);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(900, 1700); bp.Q.value = 0.8;
    bp.connect(pan).connect(this.bus.crackle);
    for (let i = 0; i < shots; i++) {
      const t = t0 + i * gap * rand(0.8, 1.2);
      const s = ctx.createBufferSource(); s.buffer = this.white;
      const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(rand(0.15, 0.3), t + 0.003);
      e.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      s.connect(e).connect(bp); s.start(t, rand(0, 3)); s.stop(t + 0.1);
    }
  }

  /** A church bell: the inharmonic partials of a real bell, each dying away. */
  private bell(): void {
    const { ctx } = this, t = ctx.currentTime + 0.01;
    const base = [196, 246.9, 293.7, 392][Math.floor(Math.random() * 4)];
    const pan = ctx.createStereoPanner(); pan.pan.value = rand(-0.6, 0.6);
    pan.connect(this.verb); pan.connect(this.master);
    const partials: [number, number, number][] = [[0.5, 0.35, 5], [1, 0.4, 4], [1.183, 0.25, 3], [1.506, 0.2, 2.5], [2, 0.15, 2], [2.514, 0.1, 1.5], [2.662, 0.08, 1.2], [3.011, 0.06, 1]];
    for (const [ratio, amp, dec] of partials) {
      const o = ctx.createOscillator(); o.frequency.value = base * ratio;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp * 0.25, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dec * 1.6);
      o.connect(g).connect(pan); o.start(t); o.stop(t + dec * 1.6 + 0.1);
    }
  }

  pauseEvents(): void { for (const t of this.timers) clearTimeout(t); this.timers = []; }
  resumeEvents(): void { this.restartSchedules(); }
}

/**
 * The sound button and the soundscape behind it. Nothing is created until the
 * visitor first turns sound on.
 */
export class Soundscape {
  private engine: Engine | null = null;
  private on = false;
  private mood: Mood = 'calm';

  constructor(private readonly button: HTMLButtonElement) {
    button.addEventListener('click', () => this.toggle());
    document.addEventListener('visibilitychange', () => {
      if (!this.engine || !this.on) return;
      if (document.hidden) { this.engine.pauseEvents(); void this.engine.ctx.suspend(); }
      else { void this.engine.ctx.resume(); this.engine.resumeEvents(); }
    });
    let wanted = false;
    try { wanted = localStorage.getItem(STORE_KEY) === 'on'; } catch { /* storage blocked */ }
    // A remembered "on" still needs a click before the browser will play,
    // so show the button as ready and start on the first interaction anywhere.
    if (wanted) {
      this.render(false, true);
      const start = (e: Event) => {
        removeEventListener('pointerdown', start); removeEventListener('keydown', start);
        // a click on the button itself is handled by the button (it would turn sound straight back off)
        if (!this.on && !button.contains(e.target as Node)) this.set(true);
      };
      addEventListener('pointerdown', start);
      addEventListener('keydown', start);
    } else this.render(false);
  }

  /** Change the mood; crossfades if sound is playing. */
  setMood(mood: Mood | undefined): void {
    this.mood = mood ?? 'calm';
    if (this.engine && this.on) this.engine.setMood(this.mood);
  }

  toggle(): void { this.set(!this.on); }

  private set(on: boolean): void {
    this.on = on;
    try { localStorage.setItem(STORE_KEY, on ? 'on' : 'off'); } catch { /* storage blocked */ }
    if (on) {
      try {
        this.engine ??= new Engine();
      } catch (err) {
        console.warn('Sound is not available in this browser', err);
        this.on = false; this.render(false); return;
      }
      void this.engine.ctx.resume();
      this.engine.setMood(this.mood, 0.8);
      this.engine.setVolume(0.7, 1.5);
    } else if (this.engine) {
      this.engine.setVolume(0, 0.6);
      const e = this.engine;
      setTimeout(() => { if (!this.on) { e.pauseEvents(); void e.ctx.suspend(); } }, 700);
    }
    this.render(on);
  }

  private render(on: boolean, pending = false): void {
    const b = this.button;
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    b.title = on ? 'Sound on' : pending ? 'Sound will start when you click' : 'Sound off';
    b.classList.toggle('on', on);
  }
}
