// The atlas: wires the view, layers, panel, timeline and player together and
// runs the transitions between the front page (cover) and the moments.
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { timer, type Timer } from 'd3-timer';
import { easeCubicInOut } from 'd3-ease';

import type { Scene } from '../data/types';
import { STATES } from '../data/areas';
import { armourHref, figureHref } from '../lib/site';
import { coverTitle, momentTitle } from '../lib/meta';
import { loadGeo, type Geo } from './geo';
import { flightDuration, flightPath, frameCamera, globeScale, panCam, zoomCam, type Cam } from './camera';
import { View } from './view';
import { AreaLayer } from './areas';
import { BaseMap } from './layers';
import { Markers, addArrowheads } from './markers';
import { Panel } from './panel';
import { Timeline } from './timeline';
import { Player } from './player';
import { Router, COVER } from './router';
import { Cover } from './cover';
import { TacticalLayer } from './tactical';

/** Data embedded in the page by src/components/Atlas.astro */
interface AtlasData {
  /** Index of the moment this page is for; -1 for the front page */
  start: number;
  /** URL of the base map */
  geo: string;
  /** Front page path */
  cover: string;
  /** Page path of each moment */
  paths: string[];
  scenes: Scene[];
}

const $ = (id: string) => document.getElementById(id) as HTMLElement;

/** What the cover shows: a pulsing marker on the Normandy coast. */
const COVER_SCENE: Scene = {
  id: 'cover', order: 0, day: -1, date: '', title: '', state: 's0', beaches: false, body: [],
  cam: { globe: true, center: [-9, 44] },
  events: [{ n: 'Normandy', p: [-0.6, 49.3], k: 'star', nat: 'all', lp: 'r' }]
};

export async function start(): Promise<void> {
  const data = JSON.parse(($('atlas-data')).textContent || '{}') as AtlasData;
  let geo: Geo;
  try {
    geo = await loadGeo(data.geo);
  } catch (err) {
    console.error(err);
    $('p-title').textContent = 'The map could not be loaded';
    $('p-body').innerHTML = '<p>Please check your connection and reload the page.</p>';
    return;
  }
  new Atlas(geo, data).boot();
}

class Atlas {
  private readonly reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly svgEl = $('map') as unknown as SVGSVGElement;
  private readonly view = new View(this.svgEl);
  private readonly areas = new AreaLayer(STATES);
  private readonly base: BaseMap;
  private readonly markers: Markers;
  private readonly tactical: TacticalLayer;
  private readonly panel = new Panel(figureHref, armourHref);
  private readonly timeline: Timeline;
  private readonly player: Player;
  private readonly router: Router;
  private readonly cover: Cover;
  private readonly scenes: Scene[];

  /** Moment on screen; COVER (-1) for the front page */
  private idx = COVER;
  private scene: Scene | null = null;
  /** True once the camera has landed */
  private arrived = false;
  private anim: Timer | null = null;
  /** Slow drift of the globe on the front page */
  private drift: Timer | null = null;

  constructor(geo: Geo, private readonly data: AtlasData) {
    const scenes = this.scenes = data.scenes;
    this.base = new BaseMap(geo);
    this.markers = new Markers(this.view, this.reduceMotion);
    this.tactical = new TacticalLayer(this.view, this.reduceMotion);
    addArrowheads(select<SVGSVGElement, unknown>('#map').select('defs'));
    this.timeline = new Timeline(scenes, i => { this.player.stopTimer(); this.goTo(i, { push: true }); });
    this.router = new Router(data.paths, data.cover, i => {
      this.player.set(false);
      if (i === COVER) this.showCover(); else this.goTo(i);
    });
    this.router.setTitle(COVER, coverTitle());
    scenes.forEach((sc, i) => this.router.setTitle(i, momentTitle(sc)));
    this.cover = new Cover(() => { this.player.set(false); this.showCover({ push: true }); });
    this.player = new Player({
      index: () => this.idx,
      count: () => this.scenes.length,
      scene: () => this.scene,
      goTo: i => this.goTo(i),
      progress: (i, f) => this.timeline.set(i, f)
    });
    this.bindControls();
  }

  private get atCover(): boolean { return this.idx === COVER; }

  // ---------------------------------------------------------------- drawing
  private render(): void {
    const { view } = this;
    view.apply();
    this.base.renderGround(view);
    this.areas.render(view);
    this.base.renderLabels(view, {
      showBeaches: !!this.scene && this.scene.beaches,
      eventPoints: this.arrived ? [...this.markers.eventPoints(this.scene), ...this.tactical.points()] : [],
      hiddenPlaces: this.markers.hiddenPlaces
    });
    this.tactical.render();
    this.markers.render();
  }

  /**
   * Animate the camera to `to` (and the areas of control to `state`), then call
   * `done`. The flight takes `duration` ms, or a time based on its length.
   */
  private fly(to: Cam, state: string, duration: number | undefined, onFrame: (e: number) => void, done: () => void): void {
    const { view } = this;
    const flight = flightPath(view.cam, to, view.avail.w);
    let dur = duration != null ? duration : flightDuration(flight.duration);
    if (this.reduceMotion) dur = 0;
    const morph = this.areas.morphTo(state);
    const step = (t: number) => {
      const e = easeCubicInOut(t);
      view.cam = flight.at(e);
      morph(easeCubicInOut(Math.max(0, Math.min(1, (t - 0.3) / 0.7))));
      onFrame(e);
      this.render();
    };
    this.areas.showFront(false);
    if (dur === 0) { step(1); done(); return; }
    this.anim = timer(el => {
      const t = Math.min(1, el / dur);
      step(t);
      if (t >= 1) { this.stopAnim(); done(); }
    });
  }

  // ---------------------------------------------------------------- transitions
  /**
   * Fly to moment i. Going below the first moment returns to the cover.
   * @param opts.duration  override the flight time (ms)
   * @param opts.fresh     first scene after load: count the days from this moment
   * @param opts.push      a step the user took: add it to the browser history
   */
  goTo(i: number, opts: { duration?: number; fresh?: boolean; push?: boolean } = {}): void {
    const { view, scenes } = this;
    if (i < 0) { this.showCover(opts); return; }
    i = Math.min(scenes.length - 1, i);
    this.stopAnim(); this.stopDrift();
    this.markers.hidePop();
    const fromCover = this.atCover;
    const prevScene = opts.fresh || fromCover ? null : this.scene;
    const sc = scenes[i];
    this.idx = i; this.scene = sc; this.arrived = false;
    this.router.show(i, !!opts.push);
    this.markers.clear(); this.tactical.clear();
    this.panel.fill(sc); this.timeline.set(i);
    if (fromCover || !this.cover.isDocked()) this.cover.dock(!!opts.fresh);
    view.layout(); view.measureBlocked();

    const dayFrom = prevScene ? prevScene.day : sc.day, dayTo = sc.day;
    this.fly(frameCamera(sc.cam, view.avail, view.mobile), sc.state, opts.duration,
      e => this.panel.setCounter(dayFrom + (dayTo - dayFrom) * e, this.scene),
      () => this.arrive());
  }

  /** Return to (or open on) the front page: big title, globe, no panel. */
  showCover(opts: { duration?: number; push?: boolean; fresh?: boolean } = {}): void {
    const { view } = this;
    this.stopAnim();
    this.markers.hidePop();
    this.markers.clear(); this.tactical.clear();
    this.panel.setArmour(null);
    this.idx = COVER; this.scene = COVER_SCENE; this.arrived = false;
    this.router.show(COVER, !!opts.push);
    this.timeline.set(COVER);
    this.cover.undock(!!opts.fresh);
    this.panel.setCounter(this.scenes[0].day, this.scenes[0]);
    view.layout(true); view.measureBlocked();
    const to = { ...frameCamera(COVER_SCENE.cam, view.avail, view.mobile) };
    to.scale *= view.mobile ? 0.9 : 0.95;
    this.fly(to, COVER_SCENE.state, opts.duration, () => {}, () => {
      this.arrived = true;
      this.markers.build(COVER_SCENE);
      this.render();
      this.startDrift(to);
    });
  }

  private arrive(): void {
    this.arrived = true;
    this.view.measureBlocked();
    this.areas.showFront(true);
    if (this.scene) { this.tactical.build(this.scene); this.markers.build(this.scene); }
    this.render();
    if (this.player.playing) this.player.schedule();
  }

  private stopAnim(): void {
    if (this.anim) { this.anim.stop(); this.anim = null; }
  }

  /** Let the globe sway gently while the front page is showing. */
  private startDrift(home: Cam): void {
    this.stopDrift();
    if (this.reduceMotion) return;
    this.drift = timer(el => {
      this.view.cam = { ...home, lon: home.lon + 10 * Math.sin(el / 9000) };
      this.render();
    });
  }

  private stopDrift(): void {
    if (this.drift) { this.drift.stop(); this.drift = null; }
  }

  // ---------------------------------------------------------------- input
  private step(delta: number): void { this.player.stopTimer(); this.goTo(this.idx + delta, { push: true }); }

  private bindControls(): void {
    const { player } = this;
    $('play').addEventListener('click', () => player.toggle());
    $('prev').addEventListener('click', () => this.step(-1));
    $('next').addEventListener('click', () => this.step(1));
    $('btn-begin').addEventListener('click', () => player.set(true));
    $('btn-step').addEventListener('click', () => { player.set(false); this.goTo(0, { push: true }); });
    addEventListener('keydown', e => {
      const target = e.target as HTMLElement;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { this.step(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (!this.atCover) this.step(-1); e.preventDefault(); }
      else if (e.key === ' ' && target.tagName !== 'BUTTON' && target.tagName !== 'A') { player.toggle(); e.preventDefault(); }
      else if (e.key === 'Home') { player.set(false); this.showCover({ push: true }); }
      else if (e.key === 'End') { player.stopTimer(); this.goTo(this.scenes.length - 1, { push: true }); }
      else if (e.key === 'Escape') this.markers.hidePop();
    });

    // Free exploration: drag to pan, wheel or pinch to zoom. The next moment re-centres the camera.
    let lastT = zoomIdentity;
    const zoom = d3zoom<SVGSVGElement, unknown>().scaleExtent([1e-3, 1e6])
      .on('start', () => {
        this.stopDrift();
        if (this.anim) { this.stopAnim(); if (!this.arrived && !this.atCover) this.arrive(); }
        this.markers.hidePop();
      })
      .on('zoom', (ev: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const t = ev.transform, k = t.k / lastT.k;
        this.view.cam = Math.abs(k - 1) > 1e-6 ? zoomCam(this.view.cam, k) : panCam(this.view.cam, t.x - lastT.x, t.y - lastT.y);
        lastT = t;
        this.render();
      });
    select(this.svgEl).call(zoom).on('dblclick.zoom', null);

    let rz: ReturnType<typeof setTimeout> | undefined;
    addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        const { view } = this;
        if (this.atCover) { this.showCover({ duration: 0 }); return; }
        view.layout(); view.measureBlocked();
        if (!this.scene) return;
        this.stopAnim();
        view.cam = frameCamera(this.scene.cam, view.avail, view.mobile);
        this.areas.set(this.scene.state);
        this.render(); if (!this.arrived) this.arrive();
      }, 120);
    });
  }

  // ---------------------------------------------------------------- start
  boot(): void {
    const { view, scenes } = this;
    // An old #scene=N link wins over the page it landed on
    const legacy = this.router.legacyIndex(location.hash);
    const startAt = legacy >= 0 ? legacy : this.data.start;
    if (startAt === COVER) {
      // Open on a distant globe and fly in to the cover
      view.layout(true);
      this.scene = COVER_SCENE;
      view.cam = { lon: -42, lat: 20, scale: globeScale(view.avail) * 0.6 };
      this.render();
      this.showCover({ duration: this.reduceMotion ? 0 : 3200, fresh: true });
    } else {
      this.scene = scenes[startAt];
      this.areas.set(this.scene.state);
      view.layout(); view.cam = frameCamera(this.scene.cam, view.avail, view.mobile);
      this.goTo(startAt, { duration: 0, fresh: true });
    }
  }
}
