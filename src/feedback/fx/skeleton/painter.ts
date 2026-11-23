/**
 * @fileoverview Skeleton painter: draws a region's cells into any view,
 * a tile canvas or the viewport canvas. Ahead of a decode front each cell
 * shows the shape ramp level the sweep gives it; inside the front, Greek
 * glyphs; behind it, nothing, so the real content shows through. At rest a
 * tile keeps its pixels and redraws only cells whose level changed.
 *
 * @module packages/core/src/feedback/fx/skeleton/painter
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { SkeletonAtlas } from './atlas.js';
import type { Palette } from './palette.js';
import type { SkeletonBox, SkeletonRegion } from './region.js';
import { hash3 } from '../../canvas/draw/noise.js';
import { pathPen, type Pen } from '../../canvas/draw/pen.js';
import { diagonalSweep } from '../../canvas/draw/sweep.js';
import { type Slice, snapRect, type View } from '../../canvas/view.js';
import {
  CELL_H,
  CELL_W,
  FRONT_PX,
  GLYPH_TICK_MS,
  GLYPHS,
  SHAPE_SIZE,
  SWEEP,
} from './constants.js';
import { RAMP, rampLevel } from './ramp.js';

/**
 * How shapes are drawn: stamped from the atlas, or batched `Path2D` fills.
 *
 * @typedef {'atlas' | 'path'} PainterKind
 */
export type PainterKind = 'atlas' | 'path';

/**
 * Painter settings the engine shares with every region.
 *
 * @interface SkeletonStyle
 * @property {PainterKind} painter - Shape painter.
 * @property {Palette} palette - Colours; replaced on a theme change.
 * @property {(dpr: number) => SkeletonAtlas | null} atlas - Stamp atlas for a backing scale.
 */
export interface SkeletonStyle {
  readonly painter: PainterKind;
  palette: Palette;
  atlas: (dpr: number) => SkeletonAtlas | null;
}

/**
 * Last level drawn per cell of each shape; 255 is unknown.
 *
 * @typedef {Map<SkeletonBox, Uint8Array>} DrawnCells
 */
export type DrawnCells = Map<SkeletonBox, Uint8Array>;

/**
 * Half the area a resting shape may cover around its cell centre, CSS px;
 * a changed cell clears this much before drawing again.
 *
 * @constant REACH
 * @type {number}
 */
const REACH = SHAPE_SIZE / 2 + 1;

/**
 * Glyph index for a cell at a glyph tick.
 *
 * @function glyphAt
 * @param {number} col - Column.
 * @param {number} row - Row.
 * @param {number} tick - Glyph tick.
 * @returns {number} Index into `GLYPHS`.
 */
function glyphAt(col: number, row: number, tick: number): number {
  return (hash3(col, row, tick) * GLYPHS.length) | 0;
}

/**
 * Paints shapes `idx` of `region` into `view`.
 *
 * @function paintSkeleton
 * @param {SkeletonRegion} region - Region.
 * @param {readonly number[]} idx - Shape indices.
 * @param {View} view - Target.
 * @param {number} t - Time, ms.
 * @param {DrawnCells} [drawn] - Levels already on the canvas; given only when its pixels were kept.
 * @returns {void}
 */
export function paintSkeleton(
  region: SkeletonRegion,
  idx: readonly number[],
  view: View,
  t: number,
  drawn?: DrawnCells,
): void {
  const { style } = region;
  const atlas = style.atlas(view.dpr);
  if (!atlas) return;
  const palette = style.palette;
  const span = Math.max(CELL_H, Math.min(region.height, view.viewH));
  const fills: Path2D[] | null = style.painter === 'path' ? [] : null;
  const pens: Pen[] = [];
  const ctx = view.ctx;
  const boxes = region.pick(idx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (region.swapped && boxes.length) {
    const top = Math.max(view.y0, 0);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(
      ...snapRect(
        view,
        0,
        top,
        region.width,
        Math.min(view.y1, region.height) - top,
      ),
    );
    for (const box of boxes) {
      const front = region.front(box, t);
      if (front === null || box.sy1 < view.y0 || box.sy0 > view.y1) continue;
      const right =
        front === Infinity
          ? box.sx1
          : Math.min(box.sx1, box.x + Math.max(0, front - FRONT_PX));
      if (right > box.sx0) {
        ctx.clearRect(
          ...snapRect(
            view,
            box.sx0,
            box.sy0,
            right - box.sx0,
            box.sy1 - box.sy0,
          ),
        );
      }
    }
  }
  for (const box of boxes) {
    if (box.y + box.h < view.y0 || box.y > view.y1) continue;
    const front = region.front(box, t);
    if (front === Infinity) continue;
    const cut = front === null ? 0 : Math.max(0, front - FRONT_PX);
    const kept = region.swapped ? undefined : drawn;
    let levels = kept?.get(box);
    if (kept && !levels) {
      levels = new Uint8Array(box.rows * box.cols).fill(255);
      kept.set(box, levels);
    }
    paintCells(
      box,
      region,
      view,
      t,
      span,
      front,
      cut,
      atlas,
      fills,
      pens,
      levels,
    );
  }
  if (fills !== null && fills.length > 0) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    for (const [level, fill] of fills.entries()) {
      if (fill === undefined) continue;
      ctx.fillStyle = palette.tones[level] ?? palette.front;
      ctx.fill(fill, 'evenodd');
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

/**
 * Draws one shape's cells: glyphs inside the decode front, ramp shapes
 * ahead of it. With `levels`, unchanged resting cells are skipped and
 * changed ones cleared first.
 *
 * @function paintCells
 * @param {SkeletonBox} box - Shape.
 * @param {SkeletonRegion} region - Its region.
 * @param {View} view - Target.
 * @param {number} t - Time, ms.
 * @param {number} span - Sweep repeat height, CSS px.
 * @param {number | null} front - Decode front, px from the shape's left; null before it starts.
 * @param {number} cut - Cells left of this, px from the shape's left, are uncovered.
 * @param {SkeletonAtlas} atlas - Stamp atlas.
 * @param {Path2D[] | null} fills - One path per ramp level for the `path` painter; null for stamps.
 * @param {Pen[]} pens - Pens over `fills`, made on first use.
 * @param {Uint8Array | undefined} levels - Levels already on the canvas, written as cells change.
 * @returns {void}
 */
function paintCells(
  box: SkeletonBox,
  region: SkeletonRegion,
  view: View,
  t: number,
  span: number,
  front: number | null,
  cut: number,
  atlas: SkeletonAtlas,
  fills: Path2D[] | null,
  pens: Pen[],
  levels: Uint8Array | undefined,
): void {
  const tick = Math.floor(t / GLYPH_TICK_MS);
  const ctx = view.ctx;
  for (let i = 0; i < box.rows; i += 1) {
    const y = box.cellY + i * CELL_H;
    if (y + CELL_H < view.y0 || y > view.y1) continue;
    const dy = Math.round((y + view.oy) * view.dpr);
    for (let k = 0; k < box.cols; k += 1) {
      const cx = k * CELL_W;
      if (cx + CELL_W <= cut) continue;
      const x = box.x + cx;
      const col = Math.round(x / CELL_W);
      const row = Math.round(y / CELL_H);
      const dx = Math.round((x + view.ox) * view.dpr);
      if (front !== null && cx < front) {
        const [sx, sy] = atlas.glyph(glyphAt(col, row, tick));
        ctx.drawImage(
          atlas.canvas,
          sx,
          sy,
          atlas.cw,
          atlas.ch,
          dx,
          dy,
          atlas.cw,
          atlas.ch,
        );
        continue;
      }
      const level = region.reduced
        ? 0
        : rampLevel(
            diagonalSweep(x, y, t, region.width, span, SWEEP),
            col,
            row,
          );
      if (levels) {
        const j = i * box.cols + k;
        if (levels[j] === level) continue;
        levels[j] = y >= view.y0 && y + CELL_H <= view.y1 ? level : 255;
        const reach = Math.ceil(2 * REACH * view.dpr) + 1;
        ctx.clearRect(
          Math.floor(dx + (CELL_W / 2 - REACH) * view.dpr),
          Math.floor(dy + (CELL_H / 2 - REACH) * view.dpr),
          reach,
          reach,
        );
      }
      if (fills) {
        const pen = (pens[level] ??= pathPen((fills[level] = new Path2D())));
        RAMP[level]?.(
          pen,
          dx / view.dpr + CELL_W / 2,
          dy / view.dpr + CELL_H / 2,
        );
      } else {
        const [sx, sy] = atlas.shape(level);
        ctx.drawImage(
          atlas.canvas,
          sx,
          sy,
          atlas.cw,
          atlas.ch,
          dx,
          dy,
          atlas.cw,
          atlas.ch,
        );
      }
    }
  }
}

/**
 * The shapes of one region a canvas draws.
 *
 * @class SkeletonSlice
 */
export class SkeletonSlice implements Slice {
  /**
   * Shape indices it draws.
   *
   * @type {readonly number[]}
   */
  readonly idx: readonly number[];
  /**
   * Levels on its canvas per shape, while the pixels are kept.
   *
   * @type {DrawnCells}
   */
  readonly #drawn: DrawnCells = new Map();
  /**
   * Region the shapes belong to.
   *
   * @type {SkeletonRegion}
   */
  readonly #region: SkeletonRegion;

  /**
   * @param {SkeletonRegion} region - Region.
   * @param {readonly number[]} idx - Shape indices it draws.
   */
  constructor(region: SkeletonRegion, idx: readonly number[]) {
    this.#region = region;
    this.idx = idx;
  }

  /**
   * Pixels may be kept until the content is swapped in.
   *
   * @returns {boolean} Retains.
   */
  get retains(): boolean {
    return !this.#region.swapped;
  }

  /**
   * Starts the shapes in view.
   *
   * @param {number} t - Now.
   * @param {number} top - View top, host-local.
   * @param {number} bottom - View bottom, host-local.
   * @returns {void}
   */
  start(t: number, top: number, bottom: number): void {
    this.#region.startVisible(this.idx, t, top, bottom);
  }

  /**
   * True while any shape has not finished decoding.
   *
   * @param {number} t - Now.
   * @returns {boolean} Pending.
   */
  pending(t: number): boolean {
    return this.#region
      .pick(this.idx)
      .some((box) => this.#region.front(box, t) !== Infinity);
  }

  /**
   * True when a shape in [top, bottom) still changes. Rows out of view
   * never keep the loop running; under reduced motion nothing does.
   *
   * @param {number} t - Now.
   * @param {number} top - View top, host-local.
   * @param {number} bottom - View bottom, host-local.
   * @returns {boolean} Animating.
   */
  animating(t: number, top: number, bottom: number): boolean {
    if (this.#region.reduced) return false;
    return this.#region
      .pick(this.idx)
      .some(
        (box) =>
          box.y < bottom &&
          box.y + box.h > top &&
          this.#region.front(box, t) !== Infinity,
      );
  }

  /**
   * When the last started decode ends; Infinity while one has not started.
   *
   * @returns {number} Time, ms.
   */
  settlesAt(): number {
    return Math.max(
      ...this.#region
        .pick(this.idx)
        .map((box) => (box.start === null ? Infinity : box.start + box.dur)),
    );
  }

  /**
   * Paints; forgets the kept levels when the canvas was cleared.
   *
   * @param {View} view - Target.
   * @param {number} t - Now.
   * @param {boolean} keep - The last frame's pixels are still there.
   * @returns {void}
   */
  paint(view: View, t: number, keep: boolean): void {
    if (!keep) this.#drawn.clear();
    paintSkeleton(
      this.#region,
      this.idx,
      view,
      t,
      keep ? this.#drawn : undefined,
    );
  }
}
