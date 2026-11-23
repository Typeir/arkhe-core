/**
 * @fileoverview Viewport surface: one fixed canvas the size of the
 * viewport, redrawn from each region's position every frame while anything
 * in view animates, at the full display rate while scrolling so it stays
 * aligned. It shrinks to 0×0 when no region is left. Used for page-level
 * regions when canvases are software-rastered.
 *
 * @module packages/core/src/feedback/canvas/viewport
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { Frameable } from './loop.js';
import type { Region, Slice, SurfaceContext } from './view.js';
import { type OwnerWindow, windowOf } from '../../base/dom.js';

/**
 * Attribute that marks the viewport canvas.
 *
 * @constant VIEWPORT_ATTR
 * @type {string}
 */
export const VIEWPORT_ATTR = 'data-canvas-viewport';

/**
 * Root margin within which a region on the viewport surface counts as near.
 *
 * @constant HOST_MARGIN
 * @type {string}
 */
export const HOST_MARGIN = '25% 0px';

/**
 * How long the frame cap stays lifted after a scroll event, ms.
 *
 * @constant SCROLL_UNCAP_MS
 * @type {number}
 */
export const SCROLL_UNCAP_MS = 150;

/**
 * One fixed canvas for many regions.
 *
 * @class ViewportSurface
 */
export class ViewportSurface implements Frameable {
  /**
   * The fixed canvas.
   *
   * @type {HTMLCanvasElement}
   */
  readonly #canvas: HTMLCanvasElement;
  /**
   * Its 2D context; null when the browser gives none.
   *
   * @type {CanvasRenderingContext2D | null}
   */
  readonly #ctx2d: CanvasRenderingContext2D | null;
  /**
   * Regions drawn, each with the slice covering all of it.
   *
   * @type {Map<Region, Slice>}
   */
  readonly #regions = new Map<Region, Slice>();
  /**
   * Regions inside the near margin now.
   *
   * @type {Set<Region>}
   */
  readonly #visible = new Set<Region>();
  /**
   * Regions the near observer has reported at least once.
   *
   * @type {Set<Region>}
   */
  readonly #seen = new Set<Region>();
  /**
   * Backing scale of the canvas.
   *
   * @type {number}
   */
  #dpr = 0;
  /**
   * The canvas holds a stale frame that must be cleared.
   *
   * @type {boolean}
   */
  #dirty = false;
  /**
   * Timer that reports regions done once their reveals end; null while
   * none runs.
   *
   * @type {ReturnType<typeof setTimeout> | null}
   */
  #settle: ReturnType<typeof setTimeout> | null = null;
  /**
   * Shared services.
   *
   * @type {SurfaceContext}
   */
  readonly #ctx: SurfaceContext;
  /**
   * Window whose viewport the canvas covers.
   *
   * @type {OwnerWindow}
   */
  readonly #view: OwnerWindow;

  /**
   * @param {SurfaceContext} ctx - Shared services.
   * @param {Document} [doc] - Document whose body holds the canvas. Defaults to the document of the window core was loaded in.
   */
  constructor(ctx: SurfaceContext, doc: Document = windowOf().document) {
    this.#ctx = ctx;
    this.#view = windowOf(doc);
    const canvas = doc.createElement('canvas');
    canvas.setAttribute(VIEWPORT_ATTR, '');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = canvas.height = 0;
    canvas.style.cssText =
      'position:fixed;left:0;top:0;pointer-events:none;z-index:1';
    doc.body.append(canvas);
    this.#canvas = canvas;
    this.#ctx2d = canvas.getContext('2d');
    canvas.addEventListener('contextrestored', () => {
      this.paintNow();
    });
    this.#view.addEventListener('scroll', this.#onScroll, { passive: true });
  }

  /**
   * Draws `region` from now on.
   *
   * @param {Region} region - Region.
   * @returns {void}
   */
  add(region: Region): void {
    this.#regions.set(region, region.slice(0, region.height));
    if (!this.#canvas.width) this.resize();
    this.#ctx.hub.observe(region.host, HOST_MARGIN, (inside) => {
      this.#seen.add(region);
      if (inside) this.#visible.add(region);
      else this.#visible.delete(region);
      this.#ctx.loop.add(this);
    });
  }

  /**
   * Takes a re-measured region's new content.
   *
   * @param {Region} region - Region.
   * @returns {void}
   */
  remeasured(region: Region): void {
    if (this.#regions.has(region)) {
      this.#regions.set(region, region.slice(0, region.height));
    }
  }

  /**
   * True unless the region was reported outside the near margin.
   *
   * @param {Region} region - Region.
   * @returns {boolean} Near.
   */
  near(region: Region): boolean {
    return !this.#seen.has(region) || this.#visible.has(region);
  }

  /**
   * Stops drawing `region`.
   *
   * @param {Region} region - Region.
   * @returns {void}
   */
  remove(region: Region): void {
    if (!this.#regions.delete(region)) return;
    this.#visible.delete(region);
    this.#seen.delete(region);
    this.#ctx.hub.unobserve(region.host, HOST_MARGIN);
    if (this.#regions.size) {
      this.#dirty = true;
      this.#ctx.loop.add(this);
    } else {
      this.#canvas.width = this.#canvas.height = 0;
    }
  }

  /**
   * Draws on the next frame.
   *
   * @returns {void}
   */
  kick(): void {
    this.#ctx.loop.add(this);
  }

  /**
   * Repaints in the current task, so a DOM swap and its cover land in the
   * same frame.
   *
   * @returns {void}
   */
  paintNow(): void {
    this.frame(performance.now());
  }

  /**
   * Matches the canvas to the viewport and the capped DPR.
   *
   * @returns {void}
   */
  resize(): void {
    if (!this.#regions.size) return;
    const { display } = this.#ctx;
    this.#dpr = display.dpr;
    this.#canvas.width = Math.round(display.viewW * this.#dpr);
    this.#canvas.height = Math.round(display.viewH * this.#dpr);
    this.#canvas.style.width = `${this.#canvas.width / this.#dpr}px`;
    this.#canvas.style.height = `${this.#canvas.height / this.#dpr}px`;
    this.#dirty = true;
  }

  /**
   * Draws every visible region.
   *
   * @param {number} t - Time.
   * @returns {boolean} Still animating, or a stale frame to clear.
   */
  frame(t: number): boolean {
    const ctx = this.#ctx2d;
    if (!ctx) return false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#dirty = false;
    const viewH = this.#ctx.display.viewH;
    let animating = false;
    for (const region of [...this.#visible]) {
      const slice = this.#regions.get(region);
      if (!slice) continue;
      const box = region.box();
      if (box.bottom <= 0 || box.top >= viewH) continue;
      const [top, bottom] = [-box.top, viewH - box.top];
      slice.start(t, top, bottom);
      if (!slice.pending(t)) {
        this.#ctx.done(region);
        continue;
      }
      const view = { ctx, dpr: this.#dpr, ox: box.left, oy: box.top, viewH };
      slice.paint({ ...view, y0: top, y1: bottom }, t, false);
      this.#ctx.painted(region);
      animating ||= slice.animating(t, top, bottom);
    }
    if (!animating && !this.#dirty) this.#settleLater();
    return animating || this.#dirty;
  }

  /**
   * Removes the canvas and every observer.
   *
   * @returns {void}
   */
  destroy(): void {
    this.#cancelSettle();
    this.#view.removeEventListener('scroll', this.#onScroll);
    for (const region of this.#regions.keys()) {
      this.#ctx.hub.unobserve(region.host, HOST_MARGIN);
    }
    this.#regions.clear();
    this.#visible.clear();
    this.#ctx.loop.delete(this);
    this.#canvas.width = this.#canvas.height = 0;
    this.#canvas.remove();
  }

  /**
   * Backing store size, device px.
   *
   * @returns {number} Pixels.
   */
  pixels(): number {
    return this.#canvas.width * this.#canvas.height;
  }

  /**
   * Stops the settle timer, if one runs.
   *
   * @returns {void}
   */
  #cancelSettle(): void {
    if (this.#settle !== null) clearTimeout(this.#settle);
    this.#settle = null;
  }

  /**
   * Once the earliest started reveal ends, reports every region with
   * nothing left to draw, then waits for the next.
   *
   * @returns {void}
   */
  #settleLater(): void {
    this.#cancelSettle();
    const ends = [...this.#regions.values()]
      .map((slice) => slice.settlesAt())
      .filter((end) => Number.isFinite(end));
    if (!ends.length) return;
    const wait = Math.max(0, Math.min(...ends) - performance.now()) + 16;
    this.#settle = setTimeout(() => {
      const t = performance.now();
      for (const [region, slice] of [...this.#regions]) {
        if (!slice.pending(t)) this.#ctx.done(region);
      }
      this.#settleLater();
    }, wait);
  }

  /**
   * Lifts the frame cap for a moment and redraws, so the canvas stays
   * aligned while the page scrolls.
   *
   * @returns {void}
   */
  readonly #onScroll = (): void => {
    this.#ctx.loop.uncapUntil = performance.now() + SCROLL_UNCAP_MS;
    if (this.#visible.size) this.#ctx.loop.add(this);
  };
}
