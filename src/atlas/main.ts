// The atlas: wires the view, layers, panel, timeline and player together and
// runs the transitions between moments.
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
import { timer, type Timer } from 'd3-timer';
import { easeCubicInOut } from 'd3-ease';

import type { Scene } from '../data/types';
import { STATES } from '../data/areas';
import { figureHref } from '../lib/site';
import { momentTitle } from '../lib/meta';
import { loadGeo, type Geo } from './geo';
import { flightDuration, flightPath, frameCamera, globeScale, panCam, zoomCam } from './camera';
import { View } from './view';
import { AreaLayer } from './areas';
import { BaseMap } from './layers';
import { Markers, addArrowheads } from './markers';
import { Panel } from './panel';
import { Timeline } from './timeline';
import { Player } from './player';
import { Router } from './router';

/** Data embedded in the page by src/components/Atlas.astro */
interface AtlasData {
  /** Index of the moment this page is for */
  start: number;
  /** URL of the base map */
  geo: string;
  /** Page path of each moment */
  paths: string[];
  scenes: Scene[];
}

const $ = (id: string) => document.getElementById(id) as HTMLElement;

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
  private readonly panel = new Panel(figureHref);
  private readonly timeline: Timeline;
  private readonly player: Player;
  private readonly router: Router;
  private readonly scenes: Scene[];

  private idx = -1;
  private scene: Scene | null = null;
  /** True once the camera has landed on the current moment */
  private arrived = false;
  private anim: Timer | null = null;

  constructor(geo: Geo, private readonly data: AtlasData) {
    const scenes = this.scenes = data.scenes;
    this.base = new BaseMap(geo);
    this.markers = new Markers(this.view, this.reduceMotion);
    addArrowheads(select<SVGSVGElement, unknown>('#map').select('defs'));
    this.timeline = new Timeline(scenes, i => { this.player.stopTimer(); this.goTo(i, { push: true }); });
    this.router = new Router(data.paths, i => { this.player.set(false); this.goTo(i); });
    scenes.forEach((sc, i) => this.router.setTitle(i, momentTitle(sc, i)));
    this.player = new Player({
      index: () => this.idx,
      count: () => this.scenes.length,
      scene: () => this.scene,
      goTo: i => this.goTo(i),
      progress: (i, f) => this.timeline.set(i, f)
    });
    this.bindControls();
  }

  // ---------------------------------------------------------------- drawing
  private render(): void {
    const { view } = this;
    view.apply();
    this.base.renderGround(view);
    this.areas.render(view);
    this.base.renderLabels(view, {
      showBeaches: !!this.scene && this.scene.beaches,
      eventPoints: this.arrived ? this.markers.eventPoints(this.scene) : [],
      hiddenPlaces: this.markers.hiddenPlaces
    });
    this.markers.render();
  }

  // ---------------------------------------------------------------- transitions
  /**
   * Fly to moment i.
   * @param opts.duration  override the flight time (ms)
   * @param opts.fresh     first scene after load: count the days from this moment
   * @param opts.push      a step the user took: add it to the browser history
   */
  goTo(i: number, opts: { duration?: number; fresh?: boolean; push?: boolean } = {}): void {
    const { view, scenes } = this;
    i = Math.max(0, Math.min(scenes.length - 1, i));
    this.stopAnim();
    this.markers.hidePop();
    const prevScene = opts.fresh ? null : this.scene;
    const sc = scenes[i];
    this.idx = i; this.scene = sc; this.arrived = false;
    this.router.show(i, !!opts.push);
    this.markers.clear();
    this.panel.fill(sc); this.timeline.set(i);
    $('intro').classList.toggle('hidden', i !== 0);
    $('legend').classList.toggle('hidden', i === 0);
    document.body.classList.toggle('at-intro', i === 0);
    view.layout(); view.measureBlocked();

    const flight = flightPath(view.cam, frameCamera(sc.cam, view.avail, view.mobile), view.avail.w);
    let dur = opts.duration != null ? opts.duration : flightDuration(flight.duration);
    if (this.reduceMotion) dur = 0;

    const morph = this.areas.morphTo(sc.state);
    const dayFrom = prevScene ? prevScene.day : sc.day, dayTo = sc.day;

    const step = (t: number) => {
      const e = easeCubicInOut(t);
      view.cam = flight.at(e);
      morph(easeCubicInOut(Math.max(0, Math.min(1, (t - 0.3) / 0.7))));
      this.panel.setCounter(dayFrom + (dayTo - dayFrom) * e, this.scene);
      this.render();
    };
    this.areas.showFront(false);
    if (dur === 0) { step(1); this.arrive(); return; }
    this.anim = timer(el => {
      const t = Math.min(1, el / dur);
      step(t);
      if (t >= 1) { this.stopAnim(); this.arrive(); }
    });
  }

  private arrive(): void {
    this.arrived = true;
    this.view.measureBlocked();
    this.areas.showFront(true);
    if (this.scene) this.markers.build(this.scene);
    this.render();
    if (this.player.playing) this.player.schedule();
  }

  private stopAnim(): void {
    if (this.anim) { this.anim.stop(); this.anim = null; }
  }

  // ---------------------------------------------------------------- input
  private step(delta: number): void { this.player.stopTimer(); this.goTo(this.idx + delta, { push: true }); }

  private bindControls(): void {
    const { player } = this;
    $('play').addEventListener('click', () => player.toggle());
    $('prev').addEventListener('click', () => this.step(-1));
    $('next').addEventListener('click', () => this.step(1));
    $('btn-begin').addEventListener('click', () => player.set(true));
    $('btn-step').addEventListener('click', () => { player.set(false); this.goTo(1, { push: true }); });
    addEventListener('keydown', e => {
      const target = e.target as HTMLElement;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { this.step(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { this.step(-1); e.preventDefault(); }
      else if (e.key === ' ' && target.tagName !== 'BUTTON') { player.toggle(); e.preventDefault(); }
      else if (e.key === 'Home') { player.stopTimer(); this.goTo(0, { push: true }); }
      else if (e.key === 'End') { player.stopTimer(); this.goTo(this.scenes.length - 1, { push: true }); }
      else if (e.key === 'Escape') this.markers.hidePop();
    });

    // Free exploration: drag to pan, wheel or pinch to zoom. The next moment re-centres the camera.
    let lastT = zoomIdentity;
    const zoom = d3zoom<SVGSVGElement, unknown>().scaleExtent([1e-3, 1e6])
      .on('start', () => {
        if (this.anim) { this.stopAnim(); if (!this.arrived) this.arrive(); }
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
    view.layout();
    // An old #scene=N link wins over the page it landed on
    const legacy = this.router.legacyIndex(location.hash);
    const startAt = legacy >= 0 ? legacy : this.data.start;
    if (startAt === 0) {
      // Open on a distant globe and fly in
      this.scene = scenes[0];
      view.cam = { lon: -42, lat: 20, scale: globeScale(view.avail) * 0.6 };
      this.panel.setCounter(-1, this.scene);
      this.render();
      this.goTo(0, { duration: this.reduceMotion ? 0 : 3200, fresh: true });
    } else {
      this.scene = scenes[startAt];
      this.areas.set(this.scene.state);
      view.layout(); view.cam = frameCamera(this.scene.cam, view.avail, view.mobile);
      this.goTo(startAt, { duration: 0, fresh: true });
    }
  }
}
