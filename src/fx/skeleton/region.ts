/**
 * @fileoverview One skeleton owner (canvas-fx R13): the geometry of the
 * `Skeleton` parts it declares, each snapped to its own cell grid size
 * first, and their reveal state. Parts of a nested owner belong to that
 * owner. Geometry is host-local CSS px from the padding-box origin.
 *
 * @module packages/core/src/fx/skeleton/region
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { borderEdges, boxFromEdges, type Edges } from '../../canvas/measure.js';
import type { Region, Slice } from '../../canvas/view.js';
import {
  CELL_H,
  CELL_W,
  DECODE_BASE_MS,
  DECODE_PER_PX,
  FRONT_PX,
  LATE_START_MS,
  STAGGER_MAX_MS,
  STAGGER_PER_PX,
} from './constants.js';
import { SkeletonSlice, type SkeletonStyle } from './painter.js';
import { computeSlots, type Slotted } from './slots.js';

/**
 * Selector of an owner: a `SkeletonGroup` root.
 *
 * @constant OWNER_SELECTOR
 * @type {string}
 */
export const OWNER_SELECTOR = '[data-scope="skeleton"][data-part="group"]';

/**
 * Selector of a declared shape: a `Skeleton` root.
 *
 * @constant SHAPE_SELECTOR
 * @type {string}
 */
export const SHAPE_SELECTOR = '[data-scope="skeleton"][data-part="root"]';

/**
 * A declared shape, its cell grid and its decode state.
 *
 * @interface SkeletonBox
 * @property {number} cols - Cell columns, at least one.
 * @property {number} rows - Cell rows, at least one.
 * @property {number} cellY - Top of the first cell row, centred in the box.
 * @property {number | null} start - Decode start, ms; null before it is due.
 * @property {number} dur - Decode duration, ms.
 * @property {boolean} visibleAtReady - In view when the content arrived.
 */
export interface SkeletonBox extends Slotted {
  readonly cols: number;
  readonly rows: number;
  readonly cellY: number;
  start: number | null;
  dur: number;
  visibleAtReady: boolean;
}

const NO_EDGES: Edges = { left: 0, top: 0, right: 0, bottom: 0 };

/**
 * State and geometry of one owner.
 *
 * @class SkeletonRegion
 */
export class SkeletonRegion implements Region {
  boxes: SkeletonBox[] = [];
  width = 0;
  height = 0;
  readonly step = CELL_H;
  readyAt: number | null = null;
  swapped = false;
  private edges: Edges = NO_EDGES;

  /**
   * @param {HTMLElement} host - Owner element.
   * @param {boolean} reduced - Reduced motion: one still frame, instant reveal.
   * @param {SkeletonStyle} style - Painter and colours, shared by the engine.
   */
  constructor(
    readonly host: HTMLElement,
    readonly reduced: boolean,
    readonly style: SkeletonStyle,
  ) {}

  /**
   * Padding box now, from the border widths of the last measure.
   *
   * @returns {{ left: number; top: number; bottom: number }} Viewport px.
   */
  box(): { left: number; top: number; bottom: number } {
    const b = boxFromEdges(this.host, this.edges);
    return { left: b.left, top: b.top, bottom: b.top + this.height };
  }

  /**
   * Reads the declared shapes from the DOM.
   *
   * @returns {void}
   */
  measure(): void {
    this.edges = borderEdges(this.host);
    const hb = boxFromEdges(this.host, this.edges);
    this.width = hb.width;
    this.height = hb.height;
    const own = (el: Element) =>
      el.parentElement?.closest(OWNER_SELECTOR) === this.host;
    this.boxes = [...this.host.querySelectorAll(SHAPE_SELECTOR)]
      .filter(own)
      .map((el) => {
        const r = el.getBoundingClientRect();
        const rows = Math.max(1, Math.round(r.height / CELL_H));
        const y = r.top - hb.top;
        return {
          x: r.left - hb.left,
          y,
          w: r.width,
          h: r.height,
          cols: Math.max(1, Math.round(r.width / CELL_W)),
          rows,
          cellY: y + (r.height - rows * CELL_H) / 2,
          sx0: 0,
          sx1: 0,
          sy0: 0,
          sy1: 0,
          start: null,
          dur: DECODE_BASE_MS + DECODE_PER_PX * r.width,
          visibleAtReady: false,
        };
      });
    computeSlots(this.boxes, this.width, this.height);
  }

  /**
   * Identity of the geometry tiles depend on.
   *
   * @returns {string} Key.
   */
  key(): string {
    return JSON.stringify(this.boxes.map((c) => [c.y, c.h, c.sy0, c.sy1]));
  }

  /**
   * Content touching rows [y0, y1), one cell row either side.
   *
   * @param {number} y0 - First row.
   * @param {number} y1 - Row after the last.
   * @returns {Slice} Slice.
   */
  slice(y0: number, y1: number): Slice {
    const lo = y0 - CELL_H;
    const hi = y1 + CELL_H;
    const idx = this.boxes.flatMap((c, i) =>
      Math.max(c.y + c.h, c.sy1) > lo && Math.min(c.y, c.sy0) < hi ? [i] : [],
    );
    return new SkeletonSlice(this, idx);
  }

  /**
   * Marks the content as arrived. Shapes in view start decoding now; the
   * rest start when they come into view.
   *
   * @param {number} t - Now.
   * @param {number} viewTop - Viewport top, host-local.
   * @param {number} viewBottom - Viewport bottom, host-local.
   * @returns {void}
   */
  ready(t: number, viewTop: number, viewBottom: number): void {
    this.readyAt = t;
    for (const c of this.boxes) {
      c.visibleAtReady = c.y < viewBottom && c.y + c.h > viewTop;
      if (this.reduced) c.start = -Infinity;
    }
  }

  /**
   * Ends every reveal at once, as after a re-measure past the swap: the
   * shapes no longer match what is underneath.
   *
   * @returns {void}
   */
  settle(): void {
    for (const c of this.boxes) c.start = -Infinity;
  }

  /**
   * Gives start times to shapes of `idx` that are in view.
   *
   * @param {readonly number[]} idx - Shape indices.
   * @param {number} t - Now.
   * @param {number} top - Viewport top, host-local.
   * @param {number} bottom - Viewport bottom, host-local.
   * @returns {void}
   */
  startVisible(
    idx: readonly number[],
    t: number,
    top: number,
    bottom: number,
  ): void {
    const readyAt = this.readyAt;
    if (readyAt === null || t < readyAt) return;
    for (const c of this.pick(idx)) {
      if (c.start !== null || c.y >= bottom || c.y + c.h <= top) continue;
      const stagger = Math.min(
        STAGGER_MAX_MS,
        Math.max(0, c.y - top) * STAGGER_PER_PX,
      );
      c.start = (c.visibleAtReady ? readyAt : t + LATE_START_MS) + stagger;
    }
  }

  /**
   * Decode front of a shape at `t`, in px from its left edge; null before
   * it starts, Infinity once done.
   *
   * @param {SkeletonBox} c - Shape.
   * @param {number} t - Now.
   * @returns {number | null} Front.
   */
  front(c: SkeletonBox, t: number): number | null {
    if (c.start === null || t < c.start) return null;
    const p = (t - c.start) / c.dur;
    return p >= 1 ? Infinity : p * (c.w + FRONT_PX);
  }

  /**
   * Shapes of `idx`.
   *
   * @param {readonly number[]} idx - Shape indices.
   * @returns {SkeletonBox[]} Shapes.
   */
  pick(idx: readonly number[]): SkeletonBox[] {
    return idx.flatMap((i) => this.boxes[i] ?? []);
  }
}
