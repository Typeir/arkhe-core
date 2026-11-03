/**
 * @fileoverview The shape ramp (canvas-fx R3): squares, then rhombi, then
 * triangles; each family runs empty, filled, filled with outline, stack.
 * The rest state is the empty square. Shapes draw through a pen, so the
 * atlas and the `Path2D` painter share one definition.
 *
 * @module packages/core/src/fx/skeleton/ramp
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { bayerAt } from '../../canvas/draw/noise.js';
import type { Pen } from '../../canvas/draw/pen.js';
import { LEVELS, SHAPE_SIZE } from './constants.js';

/**
 * Draws one ramp level centred on a point.
 *
 * @typedef {(p: Pen, cx: number, cy: number) => void} Shape
 */
export type Shape = (p: Pen, cx: number, cy: number) => void;

const S = SHAPE_SIZE;
const DIA = Math.SQRT1_2;
const TRI_SHIFT = (1 - Math.sqrt(5)) / 4;
const TRI_GROW = (1 + Math.sqrt(5)) / 4;

/**
 * Square of half-size `h`.
 *
 * @function square
 * @param {Pen} p - Pen.
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} h - Half size.
 * @param {boolean} fill - Filled or outlined.
 * @returns {void}
 */
function square(p: Pen, cx: number, cy: number, h: number, fill: boolean) {
  p.rect(cx - h, cy - h, 2 * h, 2 * h);
  if (!fill) p.rect(cx - h + 1, cy - h + 1, 2 * h - 2, 2 * h - 2);
}

/**
 * Rhombus of half-size `h`.
 *
 * @function diamond
 * @param {Pen} p - Pen.
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} h - Half size.
 * @param {boolean} fill - Filled or outlined.
 * @returns {void}
 */
function diamond(p: Pen, cx: number, cy: number, h: number, fill: boolean) {
  if (fill) p.diamond(cx, cy, h);
  else {
    p.diamond(cx, cy, h + DIA);
    p.diamond(cx, cy, h - DIA);
  }
}

/**
 * Upward triangle of half-size `h`.
 *
 * @function triangle
 * @param {Pen} p - Pen.
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} h - Half size.
 * @param {boolean} fill - Filled or outlined.
 * @returns {void}
 */
function triangle(p: Pen, cx: number, cy: number, h: number, fill: boolean) {
  if (fill) p.triangle(cx, cy, h);
  else {
    p.triangle(cx, cy + TRI_SHIFT, h + TRI_GROW);
    p.triangle(cx, cy - TRI_SHIFT, h - TRI_GROW);
  }
}

/**
 * Ramp levels, rest state first.
 *
 * @constant RAMP
 * @type {readonly Shape[]}
 */
export const RAMP: readonly Shape[] = [
  (p, x, y) => square(p, x, y, S / 2 - 0.3, false),
  (p, x, y) => square(p, x, y, S / 2 - 0.3, true),
  (p, x, y) => {
    square(p, x, y, S / 2 - 0.3, false);
    square(p, x, y, (S / 2) * 0.4, true);
  },
  (p, x, y) => {
    const h = S / 4;
    square(p, x - h, y - h, h - 0.45, true);
    square(p, x + h, y - h, h - 0.45, true);
    square(p, x - h, y + h, h - 0.45, true);
    square(p, x + h, y + h, h - 0.45, true);
  },
  (p, x, y) => diamond(p, x, y, S / 2 + 0.2, false),
  (p, x, y) => diamond(p, x, y, S / 2 + 0.3, true),
  (p, x, y) => {
    diamond(p, x, y, S / 2 + 0.2, false);
    diamond(p, x, y, (S / 2) * 0.45, true);
  },
  (p, x, y) => {
    const h = S / 4 + 0.15;
    diamond(p, x, y - h, h - 0.45, true);
    diamond(p, x + h, y, h - 0.45, true);
    diamond(p, x, y + h, h - 0.45, true);
    diamond(p, x - h, y, h - 0.45, true);
  },
  (p, x, y) => triangle(p, x, y, S / 2 - 0.4, false),
  (p, x, y) => triangle(p, x, y, S / 2, true),
  (p, x, y) => {
    triangle(p, x, y, S / 2 - 0.4, false);
    triangle(p, x, y + 0.6, (S / 2) * 0.42, true);
  },
  (p, x, y) => {
    const h = S / 4;
    triangle(p, x, y - h, h - 0.35, true);
    triangle(p, x - h, y + h, h - 0.35, true);
    triangle(p, x + h, y + h, h - 0.35, true);
  },
];

/**
 * Ramp level for an intensity, spread over neighbouring levels by the
 * Bayer threshold of the cell.
 *
 * @function rampLevel
 * @param {number} k - Intensity, 0 to 1.
 * @param {number} col - Cell column.
 * @param {number} row - Cell row.
 * @returns {number} Level; 0 is rest.
 */
export function rampLevel(k: number, col: number, row: number): number {
  return Math.min(LEVELS - 1, (k * (LEVELS - 1) + bayerAt(col, row)) | 0);
}
