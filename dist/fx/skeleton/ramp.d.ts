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
import type { Pen } from '../../canvas/draw/pen.js';
/**
 * Draws one ramp level centred on a point.
 *
 * @typedef {(p: Pen, cx: number, cy: number) => void} Shape
 */
export type Shape = (p: Pen, cx: number, cy: number) => void;
/**
 * Ramp levels, rest state first.
 *
 * @constant RAMP
 * @type {readonly Shape[]}
 */
export declare const RAMP: readonly Shape[];
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
export declare function rampLevel(k: number, col: number, row: number): number;
