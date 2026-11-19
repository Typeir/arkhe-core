/**
 * @fileoverview Slots: once real content sits under a region, each shape's
 * decode front uncovers its whole slot, not just its own box, because real
 * text is wider and taller than its placeholder. Slots come from a
 * recursive XY-cut, so side-by-side layouts work.
 *
 * @module packages/core/src/fx/skeleton/slots
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * A box and the slot it is given, host-local CSS px.
 *
 * @interface Slotted
 * @property {number} x - Box left.
 * @property {number} y - Box top.
 * @property {number} w - Box width.
 * @property {number} h - Box height.
 * @property {number} sx0 - Slot left.
 * @property {number} sx1 - Slot right.
 * @property {number} sy0 - Slot top.
 * @property {number} sy1 - Slot bottom.
 */
export interface Slotted {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
    sx0: number;
    sx1: number;
    sy0: number;
    sy1: number;
}
/**
 * Splits a host into one slot per box: boxes are grouped into rows by
 * overlapping vertical extents, rows into columns by overlapping horizontal
 * extents, and so on; neighbouring groups meet halfway, and the outer
 * groups reach the host's edges. Boxes that overlap on both axes keep their
 * own boxes.
 *
 * @function computeSlots
 * @param {Slotted[]} items - Boxes; their slot fields are written.
 * @param {number} w - Host width.
 * @param {number} h - Host height.
 * @returns {void}
 */
export declare function computeSlots(items: Slotted[], w: number, h: number): void;
