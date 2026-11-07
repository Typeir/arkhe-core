/**
 * @fileoverview Fixed numbers of the skeleton effect: cell grid, sweep,
 * decode timing and glyph set. Ruled final as built (canvas-fx R16).
 *
 * @module packages/core/src/fx/skeleton/constants
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { SweepShape } from '../../canvas/draw/sweep.js';
/**
 * Cell width, CSS px.
 *
 * @constant CELL_W
 * @type {number}
 */
export declare const CELL_W = 10;
/**
 * Cell height, CSS px; also the row grid tiles are cut on.
 *
 * @constant CELL_H
 * @type {number}
 */
export declare const CELL_H = 12;
/**
 * Shape size inside a cell, CSS px.
 *
 * @constant SHAPE_SIZE
 * @type {number}
 */
export declare const SHAPE_SIZE = 7;
/**
 * Ramp levels, rest first.
 *
 * @constant LEVELS
 * @type {number}
 */
export declare const LEVELS = 12;
/**
 * The sweep: a 105° band crossing every 2.4 s, 70 px either side.
 *
 * @constant SWEEP
 * @type {SweepShape}
 */
export declare const SWEEP: SweepShape;
/**
 * Decode time of a shape: this much, plus `DECODE_PER_PX` per px of width.
 *
 * @constant DECODE_BASE_MS
 * @type {number}
 */
export declare const DECODE_BASE_MS = 280;
/**
 * Extra decode time per px of shape width, ms.
 *
 * @constant DECODE_PER_PX
 * @type {number}
 */
export declare const DECODE_PER_PX = 0.9;
/**
 * Width of the glyph band at a decode front, CSS px.
 *
 * @constant FRONT_PX
 * @type {number}
 */
export declare const FRONT_PX = 40;
/**
 * Decode delay per px below the viewport top, ms.
 *
 * @constant STAGGER_PER_PX
 * @type {number}
 */
export declare const STAGGER_PER_PX = 3.5;
/**
 * Longest decode delay, ms.
 *
 * @constant STAGGER_MAX_MS
 * @type {number}
 */
export declare const STAGGER_MAX_MS = 1000;
/**
 * Delay before a shape that scrolls into view after the content arrived
 * starts decoding, ms.
 *
 * @constant LATE_START_MS
 * @type {number}
 */
export declare const LATE_START_MS = 240;
/**
 * Glyph change interval at a decode front, ms.
 *
 * @constant GLYPH_TICK_MS
 * @type {number}
 */
export declare const GLYPH_TICK_MS = 60;
/**
 * Glyphs shown at a decode front: Greek capitals and small letters.
 *
 * @constant GLYPHS
 * @type {string}
 */
export declare const GLYPHS = "\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A6\u03A8\u03A9\u03B1\u03B2\u03B3\u03B4\u03B5\u03B6\u03B7\u03B8\u03BB\u03BC\u03BE\u03C0\u03C1\u03C3\u03C2\u03C4\u03C6\u03C7\u03C8\u03C9";
