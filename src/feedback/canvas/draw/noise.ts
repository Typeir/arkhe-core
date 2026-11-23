/**
 * @fileoverview Deterministic noise for procedural looks: a stable hash per
 * cell, with no per-frame state, and the 4×4 Bayer ordered threshold
 * matrix that spreads an intensity over neighbouring levels.
 *
 * @module packages/core/src/feedback/canvas/draw/noise
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
].map((rank) => (rank + 0.5) / 16);

/**
 * Integer hash of up to three keys to [0, 1).
 *
 * @function hash3
 * @param {number} first - First key.
 * @param {number} [second] - Second key. Defaults to 0.
 * @param {number} [third] - Third key. Defaults to 0.
 * @returns {number} Hash.
 */
export function hash3(first: number, second = 0, third = 0): number {
  let h = (first * 374761393 + second * 668265263 + third * 2147483647) | 0;
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
