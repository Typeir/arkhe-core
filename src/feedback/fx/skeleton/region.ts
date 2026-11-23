/**
 * @fileoverview One skeleton owner (canvas-fx R13): the geometry of the
 * `Skeleton` parts it declares, each snapped to its own cell grid size
 * first, and their reveal state. Parts of a nested owner belong to that
 * owner. Geometry is host-local CSS px from the padding-box origin.
 *
 * @module packages/core/src/feedback/fx/skeleton/region
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { Region, Slice } from '../../canvas/view.js';
import { borderEdges, boxFromEdges, type Edges } from '../../canvas/measure.js';
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

/**
 * Border widths before the first measure.
 *
 * @constant NO_EDGES
 * @type {Edges}
 */
const NO_EDGES: Edges = { left: 0, top: 0, right: 0, bottom: 0 };

/**
 * State and geometry of one owner.
 *
 * @class SkeletonRegion
 */
export class SkeletonRegion implements Region {
  /**
   * Declared shapes, in document order.
   *
   * @type {SkeletonBox[]}
   */
  boxes: SkeletonBox[] = [];
  /**
   * Padding-box width, CSS px.
   *
   * @type {number}
   */
  width = 0;
  /**
   * Padding-box height, CSS px.
   *
   * @type {number}
   */
  height = 0;
  /**
   * Row grid tiles are cut on: one cell row.
   *
   * @type {number}
   */
  readonly step = CELL_H;
  /**
   * When the content arrived; null before that.
   *
   * @type {number | null}
   */
  readyAt: number | null = null;
  /**
   * The real content now sits under the shapes.
   *
   * @type {boolean}
   */
  swapped = false;
  /**
   * Owner element; canvases go inside it.
   *
   * @type {HTMLElement}
   */
  readonly host: HTMLElement;
  /**
   * Reduced motion: one still frame, instant reveal.
   *
   * @type {boolean}
   */
  readonly reduced: boolean;
  /**
   * Painter and colours, shared by the engine.
   *
   * @type {SkeletonStyle}
   */
  readonly style: SkeletonStyle;
  /**
   * Border widths of the last measure.
   *
   * @type {Edges}
   */
  #edges: Edges = NO_EDGES;

  /**
   * @param {HTMLElement} host - Owner element.
   * @param {boolean} reduced - Reduced motion: one still frame, instant reveal.
   * @param {SkeletonStyle} style - Painter and colours, shared by the engine.
   */
  constructor(host: HTMLElement, reduced: boolean, style: SkeletonStyle) {
    this.host = host;
    this.reduced = reduced;
    this.style = style;
  }

  /**
   * Padding box now, from the border widths of the last measure.
   *
   * @returns {{ left: number; top: number; bottom: number }} Viewport px.
   */
  box(): { left: number; top: number; bottom: number } {
    const padding = boxFromEdges(this.host, this.#edges);
    return {
      left: padding.left,
      top: padding.top,
      bottom: padding.top + this.height,
    };
  }

  /**
   * Reads the declared shapes from the DOM.
   *
   * @returns {void}
   */
  measure(): void {
    this.#edges = borderEdges(this.host);
    const hostBox = boxFromEdges(this.host, this.#edges);
    this.width = hostBox.width;
    this.height = hostBox.height;
    const own = (el: Element) =>
      el.parentElement?.closest(OWNER_SELECTOR) === this.host;
    this.boxes = [...this.host.querySelectorAll(SHAPE_SELECTOR)]
      .filter(own)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const rows = Math.max(1, Math.round(rect.height / CELL_H));
        const y = rect.top - hostBox.top;
        return {
          x: rect.left - hostBox.left,
          y,
          w: rect.width,
          h: rect.height,
          cols: Math.max(1, Math.round(rect.width / CELL_W)),
          rows,
          cellY: y + (rect.height - rows * CELL_H) / 2,
          sx0: 0,
          sx1: 0,
          sy0: 0,
          sy1: 0,
          start: null,
          dur: DECODE_BASE_MS + DECODE_PER_PX * rect.width,
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
    return JSON.stringify(
      this.boxes.map((box) => [box.y, box.h, box.sy0, box.sy1]),
    );
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
    const idx = this.boxes.flatMap((box, i) =>
      Math.max(box.y + box.h, box.sy1) > lo && Math.min(box.y, box.sy0) < hi
        ? [i]
        : [],
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
    for (const box of this.boxes) {
      box.visibleAtReady = box.y < viewBottom && box.y + box.h > viewTop;
      if (this.reduced) box.start = -Infinity;
    }
  }

  /**
   * Ends every reveal at once, as after a re-measure past the swap: the
   * shapes no longer match what is underneath.
   *
   * @returns {void}
   */
  settle(): void {
    for (const box of this.boxes) box.start = -Infinity;
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
    for (const box of this.pick(idx)) {
      if (box.start !== null || box.y >= bottom || box.y + box.h <= top) {
        continue;
      }
      const stagger = Math.min(
        STAGGER_MAX_MS,
        Math.max(0, box.y - top) * STAGGER_PER_PX,
      );
      box.start = (box.visibleAtReady ? readyAt : t + LATE_START_MS) + stagger;
    }
  }

  /**
   * Decode front of a shape at `t`, in px from its left edge; null before
   * it starts, Infinity once done.
   *
   * @param {SkeletonBox} box - Shape.
   * @param {number} t - Now.
   * @returns {number | null} Front.
   */
  front(box: SkeletonBox, t: number): number | null {
    if (box.start === null || t < box.start) return null;
    const progress = (t - box.start) / box.dur;
    return progress >= 1 ? Infinity : progress * (box.w + FRONT_PX);
  }

  /**
   * Shapes of `idx`.
   *
   * @param {readonly number[]} idx - Shape indices.
   * @returns {readonly SkeletonBox[]} Shapes.
   */
  pick(idx: readonly number[]): readonly SkeletonBox[] {
    return idx.flatMap((i) => this.boxes[i] ?? []);
  }
}
