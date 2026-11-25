/**
 * @fileoverview The shape ramp (canvas-fx R3): squares, then rhombi, then
 * triangles; each family runs empty, filled, filled with outline, stack.
 * The rest state is the empty square. Shapes draw through a pen, so the
 * atlas and the `Path2D` painter share one definition.
 *
 * @module packages/core/src/feedback/fx/skeleton/ramp
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { bayerAt } from '../../canvas/draw/noise.js';
import { LEVELS, SHAPE_SIZE } from './constants.js';
/**
 * Half the shape size, CSS px.
 *
 * @constant HALF
 * @type {number}
 */
const HALF = SHAPE_SIZE / 2;
/**
 * A quarter of the shape size, CSS px: the offset of a stack's parts.
 *
 * @constant QUARTER
 * @type {number}
 */
const QUARTER = SHAPE_SIZE / 4;
/**
 * Half the outline width of a rhombus, measured along its axes.
 *
 * @constant DIA
 * @type {number}
 */
const DIA = Math.SQRT1_2;
/**
 * Centre shift between a triangle's outer and inner contours.
 *
 * @constant TRI_SHIFT
 * @type {number}
 */
const TRI_SHIFT = (1 - Math.sqrt(5)) / 4;
/**
 * Half-size difference between a triangle's outer and inner contours.
 *
 * @constant TRI_GROW
 * @type {number}
 */
const TRI_GROW = (1 + Math.sqrt(5)) / 4;
/**
 * Square of half-size `h`.
 *
 * @function square
 * @param {Pen} pen - Pen.
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} h - Half size.
 * @param {boolean} fill - Filled or outlined.
 * @returns {void}
 */
function square(pen, cx, cy, h, fill) {
    pen.rect(cx - h, cy - h, 2 * h, 2 * h);
    if (!fill)
        pen.rect(cx - h + 1, cy - h + 1, 2 * h - 2, 2 * h - 2);
}
/**
 * Rhombus of half-size `h`.
 *
 * @function diamond
 * @param {Pen} pen - Pen.
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} h - Half size.
 * @param {boolean} fill - Filled or outlined.
 * @returns {void}
 */
function diamond(pen, cx, cy, h, fill) {
    if (fill) {
        pen.diamond(cx, cy, h);
    }
    else {
        pen.diamond(cx, cy, h + DIA);
        pen.diamond(cx, cy, h - DIA);
    }
}
/**
 * Upward triangle of half-size `h`.
 *
 * @function triangle
 * @param {Pen} pen - Pen.
 * @param {number} cx - Centre x.
 * @param {number} cy - Centre y.
 * @param {number} h - Half size.
 * @param {boolean} fill - Filled or outlined.
 * @returns {void}
 */
function triangle(pen, cx, cy, h, fill) {
    if (fill) {
        pen.triangle(cx, cy, h);
    }
    else {
        pen.triangle(cx, cy + TRI_SHIFT, h + TRI_GROW);
        pen.triangle(cx, cy - TRI_SHIFT, h - TRI_GROW);
    }
}
/**
 * Ramp levels, rest state first.
 *
 * @constant RAMP
 * @type {readonly Shape[]}
 */
export const RAMP = [
    (pen, x, y) => {
        square(pen, x, y, HALF - 0.3, false);
    },
    (pen, x, y) => {
        square(pen, x, y, HALF - 0.3, true);
    },
    (pen, x, y) => {
        square(pen, x, y, HALF - 0.3, false);
        square(pen, x, y, HALF * 0.4, true);
    },
    (pen, x, y) => {
        const h = QUARTER;
        square(pen, x - h, y - h, h - 0.45, true);
        square(pen, x + h, y - h, h - 0.45, true);
        square(pen, x - h, y + h, h - 0.45, true);
        square(pen, x + h, y + h, h - 0.45, true);
    },
    (pen, x, y) => {
        diamond(pen, x, y, HALF + 0.2, false);
    },
    (pen, x, y) => {
        diamond(pen, x, y, HALF + 0.3, true);
    },
    (pen, x, y) => {
        diamond(pen, x, y, HALF + 0.2, false);
        diamond(pen, x, y, HALF * 0.45, true);
    },
    (pen, x, y) => {
        const h = QUARTER + 0.15;
        diamond(pen, x, y - h, h - 0.45, true);
        diamond(pen, x + h, y, h - 0.45, true);
        diamond(pen, x, y + h, h - 0.45, true);
        diamond(pen, x - h, y, h - 0.45, true);
    },
    (pen, x, y) => {
        triangle(pen, x, y, HALF - 0.4, false);
    },
    (pen, x, y) => {
        triangle(pen, x, y, HALF, true);
    },
    (pen, x, y) => {
        triangle(pen, x, y, HALF - 0.4, false);
        triangle(pen, x, y + 0.6, HALF * 0.42, true);
    },
    (pen, x, y) => {
        const h = QUARTER;
        triangle(pen, x, y - h, h - 0.35, true);
        triangle(pen, x - h, y + h, h - 0.35, true);
        triangle(pen, x + h, y + h, h - 0.35, true);
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
export function rampLevel(k, col, row) {
    return Math.min(LEVELS - 1, (k * (LEVELS - 1) + bayerAt(col, row)) | 0);
}
