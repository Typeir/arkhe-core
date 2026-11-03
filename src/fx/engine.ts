/**
 * @fileoverview The skeleton effect engine: one per app. It owns the frame
 * loop, the canvas budget, the observers and the palette; puts each owner
 * on a surface (canvases in the owner, or the viewport canvas for page-level
 * owners on software raster); reveals on `ready`; and re-measures or
 * repaints on resize, DPR, font and theme changes.
 *
 * @module packages/core/src/fx/engine
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { CanvasBudget } from '../canvas/budget.js';
import { DisplayWatcher, type DisplayChange } from '../canvas/display.js';
import { StampCache } from '../canvas/draw/atlas.js';
import { FrameLoop } from '../canvas/loop.js';
import { needsInFlowCanvas } from '../canvas/measure.js';
import { ObserverHub, SizeWatcher, sizeOf } from '../canvas/observers.js';
import { probeAcceleration, type Acceleration } from '../canvas/probe.js';
import { TiledSurface } from '../canvas/tiled.js';
import type { Region, SurfaceContext } from '../canvas/view.js';
import { ViewportSurface } from '../canvas/viewport.js';
import { PAINTED_ATTR, type Fx, type FxOptions, type FxStats } from './api.js';
import { buildAtlas, type SkeletonAtlas } from './skeleton/atlas.js';
import type { SkeletonStyle } from './skeleton/painter.js';
import { readPalette } from './skeleton/palette.js';
import { SkeletonRegion } from './skeleton/region.js';

/**
 * One attached owner.
 *
 * @interface Entry
 * @property {SkeletonRegion} region - Geometry and reveal state.
 * @property {TiledSurface | null} surface - Its own canvases; null on the viewport canvas.
 * @property {() => void} [onRevealed] - Called once its reveal ends.
 */
interface Entry {
  readonly region: SkeletonRegion;
  readonly surface: TiledSurface | null;
  onRevealed?: () => void;
}

/**
 * Effect engine.
 *
 * @class FxEngine
 */
export class FxEngine implements Fx {
  readonly loop = new FrameLoop();
  readonly hub = new ObserverHub();
  readonly display: DisplayWatcher;
  readonly budget: CanvasBudget;
  readonly reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  readonly acceleration: Acceleration;
  private revision = 0;
  private readonly style: SkeletonStyle;
  private readonly atlases = new StampCache<SkeletonAtlas | null>();
  private readonly entries = new Map<HTMLElement, Entry>();
  private readonly sizes: SizeWatcher;
  private readonly context: SurfaceContext;
  private readonly useViewport: boolean;
  private viewport: ViewportSurface | null = null;

  /**
   * @param {FxOptions} opts - Complete options.
   */
  constructor(readonly opts: FxOptions) {
    this.display = new DisplayWatcher(opts.maxDpr, this.onDisplay);
    this.budget = new CanvasBudget(opts.maxCanvases, this.pixelBudget());
    const palette = readPalette(document.documentElement);
    this.style = {
      painter: opts.painter,
      palette,
      atlas: (dpr) =>
        this.atlases.get(`${dpr}|${this.style.palette.key}`, () =>
          buildAtlas(dpr, this.style.palette),
        ),
    };
    this.context = {
      loop: this.loop,
      budget: this.budget,
      hub: this.hub,
      display: this.display,
      revision: () => this.revision,
      sleep: opts.sleep,
      tileScale: opts.bandScale,
      wakeMargin: `${opts.wakeMargin * 100}% 0px`,
      painted: (region: Region) => this.painted(region.host),
      done: (region: Region) => this.finish(region.host, true),
    };
    this.sizes = new SizeWatcher((changed) => this.remeasure(changed, true));
    this.acceleration = probeAcceleration();
    this.useViewport =
      opts.surface === 'viewport' ||
      (opts.surface === 'auto' && !this.acceleration.accelerated);
    this.loop.cap(opts.maxFps);
    if (opts.watchdog) this.loop.watchdog();
    addEventListener('scroll', this.onScroll, { passive: true });
  }

  /**
   * Measures `host`'s skeleton and starts animating it. Attaching again
   * drops the old state and re-measures.
   *
   * @param {HTMLElement} host - Owner element.
   * @returns {void}
   */
  attach(host: HTMLElement): void {
    if (this.entries.has(host)) this.finish(host, false);
    this.scan([host]);
  }

  /**
   * The content has replaced the skeleton under `host`: start the reveal.
   * Live canvases repaint in this task, so the swap never shows uncovered.
   *
   * @param {HTMLElement} host - Owner element.
   * @param {() => void} [onRevealed] - Called once the reveal ends, or now when there is none.
   * @returns {void}
   */
  ready(host: HTMLElement, onRevealed?: () => void): void {
    const entry = this.entries.get(host);
    if (!entry) return onRevealed?.();
    entry.onRevealed = onRevealed;
    const { region, surface } = entry;
    const near = surface
      ? surface.near()
      : (this.viewport?.near(region) ?? true);
    const top = near ? region.box().top : Infinity;
    const bottom = near ? this.display.viewH - top : -Infinity;
    region.ready(performance.now(), -top, bottom);
    region.swapped = true;
    if (surface) surface.paintNow(top);
    else if (near) this.viewport?.paintNow();
    this.kick(entry);
  }

  /**
   * Drops `host` without revealing.
   *
   * @param {HTMLElement} host - Owner element.
   * @returns {void}
   */
  detach(host: HTMLElement): void {
    this.finish(host, false);
  }

  /**
   * Counters, for tests and tuning.
   *
   * @returns {FxStats} Stats.
   */
  stats(): FxStats {
    const vp = this.viewport ? 1 : 0;
    const tiles = [...this.entries.values()].reduce(
      (n, e) => n + (e.surface?.liveCanvases() ?? 0),
      0,
    );
    const vpPx = this.viewport?.pixels() ?? 0;
    return {
      frames: this.loop.frames,
      drawMs: this.loop.drawMs,
      running: this.loop.running ? 1 : 0,
      regions: this.entries.size,
      liveCanvases: tiles + vp,
      livePx: this.budget.livePixels + vpPx,
      peakCanvases: this.budget.peakCount + vp,
      peakPx: this.budget.peakPixels + vpPx,
      accelerated: this.acceleration.accelerated ? 1 : 0,
      viewport: this.useViewport ? 1 : 0,
      tier: this.loop.tier,
    };
  }

  /**
   * Restarts the frame and peak counters.
   *
   * @returns {void}
   */
  resetStats(): void {
    this.loop.frames = 0;
    this.loop.drawMs = 0;
    this.budget.resetPeaks();
  }

  /**
   * Removes every canvas, observer and listener.
   *
   * @returns {void}
   */
  destroy(): void {
    for (const host of [...this.entries.keys()]) this.finish(host, false);
    this.viewport?.destroy();
    this.viewport = null;
    this.loop.clear();
    this.hub.disconnect();
    this.sizes.disconnect();
    this.display.destroy();
    this.atlases.clear();
    removeEventListener('scroll', this.onScroll);
  }

  private pixelBudget(): number {
    return this.opts.pixelBudget * this.display.screenPixels;
  }

  private scan(hosts: HTMLElement[]): void {
    const statics = hosts.filter(
      (h) => getComputedStyle(h).position === 'static',
    );
    for (const h of statics) h.style.position = 'relative';
    this.style.atlas(this.display.dpr);
    const read = hosts.map((host) => {
      const region = new SkeletonRegion(host, this.reduced, this.style);
      region.measure();
      const pageLevel =
        this.useViewport &&
        (this.opts.surface === 'viewport' || !needsInFlowCanvas(host));
      return { host, region, pageLevel, size: sizeOf(host) };
    });
    for (const { host, region, pageLevel, size } of read) {
      const surface = pageLevel ? null : new TiledSurface(this.context, region);
      if (pageLevel) this.viewportSurface().add(region);
      this.entries.set(host, { region, surface });
      this.sizes.watch(host, size);
    }
  }

  private viewportSurface(): ViewportSurface {
    this.viewport ??= new ViewportSurface(this.context);
    return this.viewport;
  }

  private painted(host: HTMLElement): void {
    if (host.hasAttribute(PAINTED_ATTR)) return;
    queueMicrotask(() => {
      if (this.entries.has(host)) host.setAttribute(PAINTED_ATTR, '');
    });
  }

  private finish(host: HTMLElement, revealed: boolean): void {
    const entry = this.entries.get(host);
    if (!entry) return;
    entry.surface?.teardown();
    this.viewport?.remove(entry.region);
    this.sizes.unwatch(host);
    host.removeAttribute(PAINTED_ATTR);
    this.entries.delete(host);
    if (revealed && entry.region.readyAt !== null) entry.onRevealed?.();
  }

  private kick(entry: Entry): void {
    entry.surface?.kick();
    this.viewport?.kick();
  }

  private remeasure(hosts: Iterable<HTMLElement>, force: boolean): void {
    const changed: Entry[] = [];
    for (const host of hosts) {
      const entry = this.entries.get(host);
      if (!entry || (!this.sizes.update(host) && !force)) continue;
      if (!entry.region.swapped) entry.region.measure();
      changed.push(entry);
    }
    for (const entry of changed) {
      if (entry.region.swapped) {
        entry.region.settle();
        this.kick(entry);
        continue;
      }
      entry.surface?.rebuild();
      this.viewport?.remeasured(entry.region);
    }
  }

  private readonly onDisplay = (change: DisplayChange): void => {
    if (change === 'theme') {
      this.style.palette = readPalette(document.documentElement);
      this.revision += 1;
      this.atlases.clear();
      for (const entry of this.entries.values()) this.kick(entry);
      return;
    }
    this.budget.maxPixels = this.pixelBudget();
    if (change !== 'height') {
      this.atlases.clear();
      this.remeasure([...this.entries.keys()], true);
    }
    this.viewport?.resize();
    this.viewport?.kick();
  };

  private readonly onScroll = (): void => {
    for (const entry of this.entries.values()) entry.surface?.scrolled();
  };
}
