/**
 * @fileoverview The skeleton effect engine: one per app. It owns the frame
 * loop, the canvas budget, the observers and the palette; puts each owner
 * on a surface (canvases in the owner, or the viewport canvas for page-level
 * owners on software raster); reveals on `ready`; and re-measures or
 * repaints on resize, DPR, font and theme changes.
 *
 * @module packages/core/src/feedback/fx/engine
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { Region, SurfaceContext } from '../canvas/view.js';
import type { SkeletonStyle } from './skeleton/painter.js';
import { type OwnerWindow, windowOf } from '../../base/dom.js';
import { CanvasBudget } from '../canvas/budget.js';
import { type DisplayChange, DisplayWatcher } from '../canvas/display.js';
import { StampCache } from '../canvas/draw/atlas.js';
import { FrameLoop } from '../canvas/loop.js';
import { needsInFlowCanvas } from '../canvas/measure.js';
import { ObserverHub, sizeOf, SizeWatcher } from '../canvas/observers.js';
import { type Acceleration, probeAcceleration } from '../canvas/probe.js';
import { TiledSurface } from '../canvas/tiled.js';
import { ViewportSurface } from '../canvas/viewport.js';
import { type Fx, type FxOptions, type FxStats, PAINTED_ATTR } from './api.js';
import { buildAtlas, type SkeletonAtlas } from './skeleton/atlas.js';
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
  /**
   * Complete options.
   *
   * @type {FxOptions}
   */
  readonly opts: FxOptions;
  /**
   * Shared frame loop, on the engine window's frames.
   *
   * @type {FrameLoop}
   */
  readonly loop: FrameLoop;
  /**
   * Shared intersection observers.
   *
   * @type {ObserverHub}
   */
  readonly hub = new ObserverHub();
  /**
   * Viewport, DPR, font and theme watcher.
   *
   * @type {DisplayWatcher}
   */
  readonly display: DisplayWatcher;
  /**
   * Shared canvas budget.
   *
   * @type {CanvasBudget}
   */
  readonly budget: CanvasBudget;
  /**
   * Reduced motion was asked for when the engine started.
   *
   * @type {boolean}
   */
  readonly reduced: boolean;
  /**
   * Start-up guess at GPU-backed canvases.
   *
   * @type {Acceleration}
   */
  readonly acceleration: Acceleration;
  /**
   * Window the engine draws in.
   *
   * @type {OwnerWindow}
   */
  readonly #view: OwnerWindow;
  /**
   * Bumps when every pixel must be redrawn (theme).
   *
   * @type {number}
   */
  #revision = 0;
  /**
   * Painter, palette and atlas source shared by every region.
   *
   * @type {SkeletonStyle}
   */
  readonly #style: SkeletonStyle;
  /**
   * Stamp atlases by DPR and palette.
   *
   * @type {StampCache<SkeletonAtlas | null>}
   */
  readonly #atlases = new StampCache<SkeletonAtlas | null>();
  /**
   * Attached owners.
   *
   * @type {Map<HTMLElement, Entry>}
   */
  readonly #entries = new Map<HTMLElement, Entry>();
  /**
   * Size watcher of the attached owners.
   *
   * @type {SizeWatcher}
   */
  readonly #sizes: SizeWatcher;
  /**
   * Services handed to every surface.
   *
   * @type {SurfaceContext}
   */
  readonly #context: SurfaceContext;
  /**
   * Page-level owners go on the viewport canvas.
   *
   * @type {boolean}
   */
  readonly #useViewport: boolean;
  /**
   * The viewport canvas; null until a page-level owner needs it.
   *
   * @type {ViewportSurface | null}
   */
  #viewport: ViewportSurface | null = null;

  /**
   * @param {FxOptions} opts - Complete options.
   * @param {OwnerWindow} [view] - Window the engine draws in. Defaults to the window core was loaded in.
   */
  constructor(opts: FxOptions, view: OwnerWindow = windowOf()) {
    this.opts = opts;
    this.#view = view;
    this.loop = new FrameLoop(
      (callback) => view.requestAnimationFrame(callback),
      (id) => {
        view.cancelAnimationFrame(id);
      },
    );
    this.reduced = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.display = new DisplayWatcher(opts.maxDpr, this.#onDisplay, view);
    this.budget = new CanvasBudget(opts.maxCanvases, this.#pixelBudget());
    const palette = readPalette(view.document.documentElement);
    this.#style = {
      painter: opts.painter,
      palette,
      atlas: (dpr) =>
        this.#atlases.get(`${dpr}|${this.#style.palette.key}`, () =>
          buildAtlas(dpr, this.#style.palette, view.document),
        ),
    };
    this.#context = {
      loop: this.loop,
      budget: this.budget,
      hub: this.hub,
      display: this.display,
      revision: () => this.#revision,
      sleep: opts.sleep,
      tileScale: opts.bandScale,
      wakeMargin: `${opts.wakeMargin * 100}% 0px`,
      painted: (region: Region) => {
        this.#painted(region.host);
      },
      done: (region: Region) => {
        this.#finish(region.host, true);
      },
    };
    this.#sizes = new SizeWatcher((changed) => {
      this.#remeasure(changed, true);
    });
    this.acceleration = probeAcceleration(view);
    this.#useViewport =
      opts.surface === 'viewport' ||
      (opts.surface === 'auto' && !this.acceleration.accelerated);
    this.loop.cap(opts.maxFps);
    if (opts.watchdog) this.loop.watchdog();
    view.addEventListener('scroll', this.#onScroll, { passive: true });
  }

  /**
   * Measures `host`'s skeleton and starts animating it. Attaching again
   * drops the old state and re-measures.
   *
   * @param {HTMLElement} host - Owner element.
   * @returns {void}
   */
  attach(host: HTMLElement): void {
    if (this.#entries.has(host)) this.#finish(host, false);
    this.#scan([host]);
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
    const entry = this.#entries.get(host);
    if (!entry) {
      onRevealed?.();
      return;
    }
    entry.onRevealed = onRevealed;
    const { region, surface } = entry;
    const near = surface
      ? surface.near()
      : (this.#viewport?.near(region) ?? true);
    const top = near ? region.box().top : Infinity;
    const bottom = near ? this.display.viewH - top : -Infinity;
    region.ready(performance.now(), -top, bottom);
    region.swapped = true;
    if (surface) surface.paintNow(top);
    else if (near) this.#viewport?.paintNow();
    this.#kick(entry);
  }

  /**
   * Drops `host` without revealing.
   *
   * @param {HTMLElement} host - Owner element.
   * @returns {void}
   */
  detach(host: HTMLElement): void {
    this.#finish(host, false);
  }

  /**
   * Counters, for tests and tuning.
   *
   * @returns {FxStats} Stats.
   */
  stats(): FxStats {
    const vp = this.#viewport ? 1 : 0;
    const tiles = [...this.#entries.values()].reduce(
      (count, entry) => count + (entry.surface?.liveCanvases() ?? 0),
      0,
    );
    const vpPx = this.#viewport?.pixels() ?? 0;
    return {
      frames: this.loop.frames,
      drawMs: this.loop.drawMs,
      running: this.loop.running ? 1 : 0,
      regions: this.#entries.size,
      liveCanvases: tiles + vp,
      livePx: this.budget.livePixels + vpPx,
      peakCanvases: this.budget.peakCount + vp,
      peakPx: this.budget.peakPixels + vpPx,
      accelerated: this.acceleration.accelerated ? 1 : 0,
      viewport: this.#useViewport ? 1 : 0,
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
    for (const host of [...this.#entries.keys()]) this.#finish(host, false);
    this.#viewport?.destroy();
    this.#viewport = null;
    this.loop.clear();
    this.hub.disconnect();
    this.#sizes.disconnect();
    this.display.destroy();
    this.#atlases.clear();
    this.#view.removeEventListener('scroll', this.#onScroll);
  }

  /**
   * Device pixel budget for the current screen.
   *
   * @returns {number} Pixels.
   */
  #pixelBudget(): number {
    return this.opts.pixelBudget * this.display.screenPixels;
  }

  /**
   * Positions, measures and puts each host on a surface: its own tiles, or
   * the viewport canvas for page-level owners. All reads come before any
   * canvas is made.
   *
   * @param {readonly HTMLElement[]} hosts - Owner elements.
   * @returns {void}
   */
  #scan(hosts: readonly HTMLElement[]): void {
    const statics = hosts.filter(
      (host) => windowOf(host).getComputedStyle(host).position === 'static',
    );
    for (const host of statics) host.style.position = 'relative';
    this.#style.atlas(this.display.dpr);
    const read = hosts.map((host) => {
      const region = new SkeletonRegion(host, this.reduced, this.#style);
      region.measure();
      const pageLevel =
        this.#useViewport &&
        (this.opts.surface === 'viewport' || !needsInFlowCanvas(host));
      return { host, region, pageLevel, size: sizeOf(host) };
    });
    for (const { host, region, pageLevel, size } of read) {
      const surface = pageLevel
        ? null
        : new TiledSurface(this.#context, region);
      if (pageLevel) this.#viewportSurface().add(region);
      this.#entries.set(host, { region, surface });
      this.#sizes.watch(host, size);
    }
  }

  /**
   * The viewport canvas, made on first use in the engine's document.
   *
   * @returns {ViewportSurface} Surface.
   */
  #viewportSurface(): ViewportSurface {
    this.#viewport ??= new ViewportSurface(this.#context, this.#view.document);
    return this.#viewport;
  }

  /**
   * Marks `host` painted after this task, if it is still attached then.
   *
   * @param {HTMLElement} host - Owner element.
   * @returns {void}
   */
  #painted(host: HTMLElement): void {
    if (host.hasAttribute(PAINTED_ATTR)) return;
    queueMicrotask(() => {
      if (this.#entries.has(host)) host.setAttribute(PAINTED_ATTR, '');
    });
  }

  /**
   * Drops `host` and its canvases; reports the reveal when it ended one.
   *
   * @param {HTMLElement} host - Owner element.
   * @param {boolean} revealed - Its reveal ran to the end.
   * @returns {void}
   */
  #finish(host: HTMLElement, revealed: boolean): void {
    const entry = this.#entries.get(host);
    if (!entry) return;
    entry.surface?.destroy();
    this.#viewport?.remove(entry.region);
    this.#sizes.unwatch(host);
    host.removeAttribute(PAINTED_ATTR);
    this.#entries.delete(host);
    if (revealed && entry.region.readyAt !== null) entry.onRevealed?.();
  }

  /**
   * Puts an owner's surface, and the viewport canvas, back into the loop.
   *
   * @param {Entry} entry - Owner.
   * @returns {void}
   */
  #kick(entry: Entry): void {
    entry.surface?.kick();
    this.#viewport?.kick();
  }

  /**
   * Re-measures resized owners and rebuilds their surfaces. An owner past
   * its swap ends its reveal instead: its shapes no longer match.
   *
   * @param {Iterable<HTMLElement>} hosts - Owner elements.
   * @param {boolean} force - Re-measure even when the size looks unchanged.
   * @returns {void}
   */
  #remeasure(hosts: Iterable<HTMLElement>, force: boolean): void {
    const changed: Entry[] = [];
    for (const host of hosts) {
      const entry = this.#entries.get(host);
      if (!entry || (!this.#sizes.update(host) && !force)) continue;
      if (!entry.region.swapped) entry.region.measure();
      changed.push(entry);
    }
    for (const entry of changed) {
      if (entry.region.swapped) {
        entry.region.settle();
        this.#kick(entry);
        continue;
      }
      entry.surface?.rebuild();
      this.#viewport?.remeasured(entry.region);
    }
  }

  /**
   * Repaints on a theme change; on a size change, moves the pixel budget
   * and re-measures (a height-only change just resizes the viewport canvas).
   *
   * @param {DisplayChange} change - What changed.
   * @returns {void}
   */
  readonly #onDisplay = (change: DisplayChange): void => {
    if (change === 'theme') {
      this.#style.palette = readPalette(this.#view.document.documentElement);
      this.#revision += 1;
      this.#atlases.clear();
      for (const entry of this.#entries.values()) this.#kick(entry);
      return;
    }
    this.budget.maxPixels = this.#pixelBudget();
    if (change !== 'height') {
      this.#atlases.clear();
      this.#remeasure([...this.#entries.keys()], true);
    }
    this.#viewport?.resize();
    this.#viewport?.kick();
  };

  /**
   * Re-arms visible tiles after a scroll.
   *
   * @returns {void}
   */
  readonly #onScroll = (): void => {
    for (const entry of this.#entries.values()) entry.surface?.scrolled();
  };
}
