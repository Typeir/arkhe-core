/**
 * @fileoverview One tile of a tiled surface: a sentinel that drives wake
 * and visibility, and a budgeted canvas allocated lazily. It paints in full
 * once when it gets a canvas, then only its visible slice. Off screen it
 * waits for spare frame time. Once nothing in view animates, it finishes
 * on a timer when its last started reveal ends, on screen or off, so a
 * reveal never waits for a scroll. It gives its canvas back on eviction or
 * context loss.
 *
 * @module packages/core/src/feedback/canvas/tile
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { BudgetClient } from './budget.js';
import type { Frameable } from './loop.js';
import type { TiledSurface } from './tiled.js';
import type { Slice } from './view.js';
import { ManagedCanvas } from './managed.js';
import { type Tile, tilePxHeight } from './tiles.js';

/**
 * Attribute that marks a tile's sentinel.
 *
 * @constant SENTINEL_ATTR
 * @type {string}
 */
export const SENTINEL_ATTR = 'data-canvas-sentinel';

/**
 * Rows painted beyond the viewport on a partial repaint, CSS px.
 *
 * @constant SLICE_MARGIN
 * @type {number}
 */
export const SLICE_MARGIN = 64;

/**
 * One tile.
 *
 * @class CanvasTile
 */
export class CanvasTile implements BudgetClient, Frameable {
  /**
   * Outside the wake margin.
   *
   * @type {boolean}
   */
  asleep = true;
  /**
   * The wake observer has reported it at least once.
   *
   * @type {boolean}
   */
  reported = false;
  /**
   * On screen; the budget never evicts it.
   *
   * @type {boolean}
   */
  visible = false;
  /**
   * Time it last woke.
   *
   * @type {number}
   */
  lastSeen = 0;
  /**
   * Nothing is left to draw; it is being removed.
   *
   * @type {boolean}
   */
  done = false;
  /**
   * Rows it covers.
   *
   * @type {Tile}
   */
  readonly tile: Tile;
  /**
   * What it draws.
   *
   * @type {Slice}
   */
  readonly slice: Slice;
  /**
   * Invisible element over its rows that the observers watch.
   *
   * @type {HTMLElement}
   */
  readonly sentinel: HTMLElement;
  /**
   * The next frame paints in full.
   *
   * @type {boolean}
   */
  #fresh = true;
  /**
   * Timer that finishes it once its last reveal ends; null while none runs.
   *
   * @type {ReturnType<typeof setTimeout> | null}
   */
  #settle: ReturnType<typeof setTimeout> | null = null;
  /**
   * Surface revision of the last paint; a new one means repaint all.
   *
   * @type {number}
   */
  #revision = -1;
  /**
   * Its budgeted canvas.
   *
   * @type {ManagedCanvas}
   */
  readonly #canvas: ManagedCanvas;
  /**
   * Surface it belongs to.
   *
   * @type {TiledSurface}
   */
  readonly #owner: TiledSurface;

  /**
   * @param {TiledSurface} owner - Surface.
   * @param {Tile} tile - Rows it covers.
   * @param {Slice} slice - What it draws.
   */
  constructor(owner: TiledSurface, tile: Tile, slice: Slice) {
    this.#owner = owner;
    this.tile = tile;
    this.slice = slice;
    this.#canvas = new ManagedCanvas(owner.ctx.budget, this, {
      lost: () => {
        if (!this.visible) this.evict();
      },
      restored: () => {
        this.repaint(performance.now());
      },
    });
    const sentinel = owner.region.host.ownerDocument.createElement('div');
    sentinel.setAttribute(SENTINEL_ATTR, '');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = `position:absolute;left:0;top:${tile.y}px;width:${owner.plan.cssWidth}px;height:${tile.h}px;pointer-events:none;opacity:0`;
    owner.region.host.append(sentinel);
    this.sentinel = sentinel;
  }

  /**
   * Off-screen work: the loop runs it only while frame time is left.
   *
   * @returns {boolean} Idle.
   */
  get idle(): boolean {
    return !this.visible;
  }

  /**
   * True while it holds a canvas.
   *
   * @returns {boolean} Has a canvas.
   */
  get hasCanvas(): boolean {
    return this.#canvas.live;
  }

  /**
   * Enters the wake margin.
   *
   * @param {number} now - Time.
   * @returns {void}
   */
  wake(now: number): void {
    this.asleep = false;
    this.lastSeen = now;
    this.ensure();
  }

  /**
   * Gets a canvas if awake and unfinished, and joins the loop. A visible
   * tile paints a new canvas before returning, so it never shows blank.
   *
   * @returns {void}
   */
  ensure(): void {
    if (this.asleep || this.done) return;
    const created = !this.#canvas.live;
    if (created && !this.#allocate()) return;
    if (!this.visible) this.#fresh = true;
    if (created && this.visible && !this.frame(performance.now())) return;
    this.#owner.ctx.loop.add(this);
  }

  /**
   * Redraws in full: now when `now`, else on the next frame.
   *
   * @param {number} t - Time.
   * @param {boolean} [now] - Paint in this task. Defaults to `visible`.
   * @returns {void}
   */
  repaint(t: number, now: boolean = this.visible): void {
    if (!this.#canvas.live || this.done) return;
    this.#fresh = true;
    if (now) this.frame(t);
    else this.#owner.ctx.loop.add(this);
  }

  /**
   * Leaves the wake margin.
   *
   * @returns {void}
   */
  sleep(): void {
    this.asleep = true;
    this.#owner.ctx.loop.delete(this);
    if (this.#owner.ctx.sleep === 'release') this.#canvas.release();
  }

  /**
   * Gives its canvas back; the budget calls it.
   *
   * @returns {void}
   */
  evict(): void {
    this.#owner.ctx.loop.delete(this);
    this.#canvas.release();
  }

  /**
   * Draws one frame.
   *
   * @param {number} t - Time.
   * @returns {boolean} Still animating.
   */
  frame(t: number): boolean {
    const { ctx, canvas } = this.#canvas;
    if (!ctx || !canvas) return false;
    const [top, bottom] = this.#owner.view(t);
    const { y, h } = this.tile;
    this.slice.start(t, top, bottom);
    if (!this.slice.pending(t)) {
      this.#finish();
      return false;
    }
    const dpr = this.#owner.plan.dpr;
    const y0 = this.#fresh ? y : Math.max(y, top - SLICE_MARGIN);
    const y1 = this.#fresh ? y + h : Math.min(y + h, bottom + SLICE_MARGIN);
    const revision = this.#owner.ctx.revision();
    const keep =
      !this.#fresh && revision === this.#revision && this.slice.retains;
    this.#revision = revision;
    this.#fresh = false;
    if (y1 > y0) {
      const d0 = Math.floor((y0 - y) * dpr);
      const d1 = Math.ceil((y1 - y) * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, d0, canvas.width, d1 - d0);
      ctx.clip();
      if (!keep) ctx.clearRect(0, d0, canvas.width, d1 - d0);
      const viewH = this.#owner.ctx.display.viewH;
      this.slice.paint({ ctx, dpr, ox: 0, oy: -y, y0, y1, viewH }, t, keep);
      ctx.restore();
      this.#owner.ctx.painted(this.#owner.region);
    }
    const top1 = Math.max(top, y);
    const animating = this.slice.animating(t, top1, Math.min(bottom, y + h));
    if (!animating) this.#settleLater();
    return animating;
  }

  /**
   * Enters or leaves the screen.
   *
   * @param {boolean} visible - On screen.
   * @returns {void}
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      this.ensure();
      return;
    }
    if (this.#owner.ctx.budget.over) this.evict();
    this.#settleLater();
  }

  /**
   * Removes its canvas, sentinel and observers.
   *
   * @returns {void}
   */
  destroy(): void {
    this.#cancelSettle();
    this.evict();
    this.#owner.unobserve(this.sentinel);
    this.sentinel.remove();
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
   * Finishes the tile once its last started reveal ends, unless it still
   * has something to draw then. Waits while any reveal has not started.
   *
   * @returns {void}
   */
  #settleLater(): void {
    const end = this.slice.settlesAt();
    if (!Number.isFinite(end)) return;
    this.#cancelSettle();
    this.#settle = setTimeout(
      () => {
        if (!this.done && !this.slice.pending(performance.now())) {
          this.#finish();
        }
      },
      Math.max(0, end - performance.now()) + 16,
    );
  }

  /**
   * Asks for a canvas over its rows at the plan's DPR.
   *
   * @returns {boolean} True when granted.
   */
  #allocate(): boolean {
    const { plan, region } = this.#owner;
    const h = tilePxHeight(this.tile, plan.dpr);
    const ok = this.#canvas.allocate(region.host, plan.pxWidth, h, {
      top: this.tile.y,
      width: plan.cssWidth,
      height: this.tile.h,
    });
    this.#fresh = true;
    return ok;
  }

  /**
   * Marks it done, leaves the loop and, after this task, removes it and
   * tells the surface.
   *
   * @returns {void}
   */
  #finish(): void {
    this.done = true;
    this.#owner.ctx.loop.delete(this);
    queueMicrotask(() => {
      this.destroy();
      this.#owner.tileDone();
    });
  }
}
