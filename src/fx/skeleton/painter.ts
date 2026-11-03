/**
 * @fileoverview Skeleton painter: draws a region's cells into any view,
 * a tile canvas or the viewport canvas. Ahead of a decode front each cell
 * shows the shape ramp level the sweep gives it; inside the front, Greek
 * glyphs; behind it, nothing, so the real content shows through. At rest a
 * tile keeps its pixels and redraws only cells whose level changed.
 *
 * @module packages/core/src/fx/skeleton/painter
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { hash3 } from '../../canvas/draw/noise.js';
import { pathPen, type Pen } from '../../canvas/draw/pen.js';
import { diagonalSweep } from '../../canvas/draw/sweep.js';
import { snapRect, type Slice, type View } from '../../canvas/view.js';
import type { SkeletonAtlas } from './atlas.js';
import {
  CELL_H,
  CELL_W,
  FRONT_PX,
  GLYPH_TICK_MS,
  GLYPHS,
  SHAPE_SIZE,
  SWEEP,
} from './constants.js';
import type { Palette } from './palette.js';
import { RAMP, rampLevel } from './ramp.js';
import type { SkeletonBox, SkeletonRegion } from './region.js';

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
  atlas(dpr: number): SkeletonAtlas | null;
}

/**
 * Last level drawn per cell of each shape; 255 is unknown.
 *
 * @typedef {Map<SkeletonBox, Uint8Array>} DrawnCells
 */
export type DrawnCells = Map<SkeletonBox, Uint8Array>;

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
 * Paints shapes `idx` of `g` into `v`.
 *
 * @function paintSkeleton
 * @param {SkeletonRegion} g - Region.
 * @param {readonly number[]} idx - Shape indices.
 * @param {View} v - Target.
 * @param {number} t - Time, ms.
 * @param {DrawnCells} [drawn] - Levels already on the canvas; given only when its pixels were kept.
 * @returns {void}
 */
export function paintSkeleton(
  g: SkeletonRegion,
  idx: readonly number[],
  v: View,
  t: number,
  drawn?: DrawnCells,
): void {
  const { style } = g;
  const atlas = style.atlas(v.dpr);
  if (!atlas) return;
  const pal = style.palette;
  const span = Math.max(CELL_H, Math.min(g.height, v.viewH));
  const fills: Path2D[] | null = style.painter === 'path' ? [] : null;
  const pens: Pen[] = [];
  const ctx = v.ctx;
  const boxes = g.pick(idx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (g.swapped && boxes.length) {
    const top = Math.max(v.y0, 0);
    ctx.fillStyle = pal.bg;
    ctx.fillRect(
      ...snapRect(v, 0, top, g.width, Math.min(v.y1, g.height) - top),
    );
    for (const c of boxes) {
      const front = g.front(c, t);
      if (front === null || c.sy1 < v.y0 || c.sy0 > v.y1) continue;
      const right =
        front === Infinity
          ? c.sx1
          : Math.min(c.sx1, c.x + Math.max(0, front - FRONT_PX));
      if (right > c.sx0)
        ctx.clearRect(
          ...snapRect(v, c.sx0, c.sy0, right - c.sx0, c.sy1 - c.sy0),
        );
    }
  }
  for (const c of boxes) {
    if (c.y + c.h < v.y0 || c.y > v.y1) continue;
    const front = g.front(c, t);
    if (front === Infinity) continue;
    const cut = front === null ? 0 : Math.max(0, front - FRONT_PX);
    const kept = g.swapped ? undefined : drawn;
    let lv = kept?.get(c);
    if (kept && !lv)
      kept.set(c, (lv = new Uint8Array(c.rows * c.cols).fill(255)));
    paintCells(c, g, v, t, span, front, cut, atlas, fills, pens, lv);
  }
  if (fills?.length) {
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    fills.forEach((f, l) => {
      ctx.fillStyle = pal.tones[l] ?? pal.front;
      ctx.fill(f, 'evenodd');
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

/**
 * Draws one shape's cells: glyphs inside the decode front, ramp shapes
 * ahead of it. With `lv`, unchanged resting cells are skipped and changed
 * ones cleared first.
 *
 * @function paintCells
 * @returns {void}
 */
function paintCells(
  c: SkeletonBox,
  g: SkeletonRegion,
  v: View,
  t: number,
  span: number,
  front: number | null,
  cut: number,
  atlas: SkeletonAtlas,
  fills: Path2D[] | null,
  pens: Pen[],
  lv: Uint8Array | undefined,
): void {
  const tick = Math.floor(t / GLYPH_TICK_MS);
  const ctx = v.ctx;
  for (let r = 0; r < c.rows; r++) {
    const y = c.cellY + r * CELL_H;
    if (y + CELL_H < v.y0 || y > v.y1) continue;
    const dy = Math.round((y + v.oy) * v.dpr);
    for (let k = 0; k < c.cols; k++) {
      const cx = k * CELL_W;
      if (cx + CELL_W <= cut) continue;
      const x = c.x + cx;
      const col = Math.round(x / CELL_W);
      const row = Math.round(y / CELL_H);
      const dx = Math.round((x + v.ox) * v.dpr);
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
      const l = g.reduced
        ? 0
        : rampLevel(diagonalSweep(x, y, t, g.width, span, SWEEP), col, row);
      if (lv) {
        const j = r * c.cols + k;
        if (lv[j] === l) continue;
        lv[j] = y >= v.y0 && y + CELL_H <= v.y1 ? l : 255;
        const reach = Math.ceil(2 * REACH * v.dpr) + 1;
        ctx.clearRect(
          Math.floor(dx + (CELL_W / 2 - REACH) * v.dpr),
          Math.floor(dy + (CELL_H / 2 - REACH) * v.dpr),
          reach,
          reach,
        );
      }
      if (fills) {
        const pen = (pens[l] ??= pathPen((fills[l] = new Path2D())));
        RAMP[l]?.(pen, dx / v.dpr + CELL_W / 2, dy / v.dpr + CELL_H / 2);
      } else {
        const [sx, sy] = atlas.shape(l);
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
  private readonly drawn: DrawnCells = new Map();

  /**
   * @param {SkeletonRegion} region - Region.
   * @param {readonly number[]} idx - Shape indices it draws.
   */
  constructor(
    private readonly region: SkeletonRegion,
    readonly idx: readonly number[],
  ) {}

  /**
   * Pixels may be kept until the content is swapped in.
   *
   * @returns {boolean} Retains.
   */
  get retains(): boolean {
    return !this.region.swapped;
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
    this.region.startVisible(this.idx, t, top, bottom);
  }

  /**
   * True while any shape has not finished decoding.
   *
   * @param {number} t - Now.
   * @returns {boolean} Pending.
   */
  pending(t: number): boolean {
    return this.region
      .pick(this.idx)
      .some((c) => this.region.front(c, t) !== Infinity);
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
    if (this.region.reduced) return false;
    return this.region
      .pick(this.idx)
      .some(
        (c) =>
          c.y < bottom &&
          c.y + c.h > top &&
          this.region.front(c, t) !== Infinity,
      );
  }

  /**
   * When the last started decode ends; Infinity while one has not started.
   *
   * @returns {number} Time, ms.
   */
  settlesAt(): number {
    return Math.max(
      ...this.region
        .pick(this.idx)
        .map((c) => (c.start === null ? Infinity : c.start + c.dur)),
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
    if (!keep) this.drawn.clear();
    paintSkeleton(
      this.region,
      this.idx,
      view,
      t,
      keep ? this.drawn : undefined,
    );
  }
}
