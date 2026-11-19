/**
 * @fileoverview The contract between canvas surfaces and what they draw. A
 * surface (tiled or viewport) knows nothing about the look: it hands each
 * region's slices a `View` and asks them to paint, whether they are still
 * pending, and whether they still animate. Also the shared services a
 * surface runs on, and pixel-snapped fills for views.
 *
 * @module packages/core/src/canvas/view
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Root margin of the on-screen test: the viewport itself.
 *
 * @constant VISIBLE_MARGIN
 * @type {string}
 */
export const VISIBLE_MARGIN = '0px';
/**
 * Snaps a region-local rect of `view` to whole device px.
 *
 * @function snapRect
 * @param {View} v - View.
 * @param {number} x - Left.
 * @param {number} y - Top.
 * @param {number} w - Width.
 * @param {number} h - Height.
 * @returns {readonly [number, number, number, number]} Device x, y, width, height.
 */
export function snapRect(v, x, y, w, h) {
    const x0 = Math.round((x + v.ox) * v.dpr);
    const y0 = Math.round((y + v.oy) * v.dpr);
    return [
        x0,
        y0,
        Math.round((x + w + v.ox) * v.dpr) - x0,
        Math.round((y + h + v.oy) * v.dpr) - y0,
    ];
}
