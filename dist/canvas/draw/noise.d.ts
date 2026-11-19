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
export declare const BAYER4: readonly number[];
/**
 * Integer hash of up to three keys to [0, 1).
 *
 * @function hash3
 * @param {number} a - First key.
 * @param {number} [b] - Second key.
 * @param {number} [c] - Third key.
 * @returns {number} Hash.
 */
export declare function hash3(a: number, b?: number, c?: number): number;
/**
 * Bayer threshold of a grid cell.
 *
 * @function bayerAt
 * @param {number} col - Column.
 * @param {number} row - Row.
 * @returns {number} Threshold in [0, 1).
 */
export declare function bayerAt(col: number, row: number): number;
