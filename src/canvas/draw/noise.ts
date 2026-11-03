/**
 * @fileoverview Deterministic noise for procedural looks: a stable hash per
 * cell, with no per-frame state, and the 4×4 Bayer ordered threshold
 * matrix that spreads an intensity over neighbouring levels.
 *
 * @module packages/core/src/canvas/draw/noise
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

/**
 * Bayer 4×4 thresholds, row by row, centred in [0, 1).
 *
 * @constant BAYER4
 * @type {readonly number[]}
 */
export const BAYER4: readonly number[] = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
].map((r) => (r + 0.5) / 16);

/**
 * Integer hash of up to three keys to [0, 1).
 *
 * @function hash3
 * @param {number} a - First key.
 * @param {number} [b] - Second key.
 * @param {number} [c] - Third key.
 * @returns {number} Hash.
 */
export function hash3(a: number, b = 0, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Bayer threshold of a grid cell.
 *
 * @function bayerAt
 * @param {number} col - Column.
 * @param {number} row - Row.
 * @returns {number} Threshold in [0, 1).
 */
export function bayerAt(col: number, row: number): number {
  return BAYER4[(row & 3) * 4 + (col & 3)] ?? 0;
}
