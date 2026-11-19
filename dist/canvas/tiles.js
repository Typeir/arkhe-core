/**
 * @fileoverview Pure tile maths: how a tall element is cut into canvases
 * that each stay under the area cap and the per-side cap, at the highest
 * DPR that fits. Widths floor to whole device pixels, so a canvas is never
 * wider than its element.
 *
 * @module packages/core/src/canvas/tiles
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Area cap per canvas, in device px (16.7 M, the smallest browser limit).
 *
 * @constant CAP_PX
 * @type {number}
 */
export const CAP_PX = 16_777_216;
/**
 * Side cap per canvas, in device px. Many mobile GPUs drop a wider canvas
 * to software raster.
 *
 * @constant MAX_SIDE
 * @type {number}
 */
export const MAX_SIDE = 8192;
/**
 * Plans the tiles of an element. Tile height is a multiple of `step`, at
 * most `tileHeight`, and keeps each canvas under both caps. When even one
 * step would break a cap, the DPR is lowered instead, as PDF.js does.
 *
 * @function planTiles
 * @param {number} width - Element width, CSS px.
 * @param {number} height - Element height, CSS px.
 * @param {number} dpr - Device pixel ratio.
 * @param {number} tileHeight - Wanted tile height, CSS px (one viewport).
 * @param {TileLimits} [limits] - Caps and grid.
 * @returns {TilePlan} Plan.
 */
export function planTiles(width, height, dpr, tileHeight, limits = {}) {
    const { capPx = CAP_PX, maxSide = MAX_SIDE, step = 1 } = limits;
    const w = Math.max(1, Math.ceil(width));
    let d = Math.min(dpr, maxSide / w, Math.sqrt(capPx / (w * step)));
    const fit = Math.min(tileHeight, (capPx / (w * d) - 1) / d, (maxSide - 1) / d);
    const tileH = Math.max(step, Math.floor(fit / step) * step);
    if (d < dpr)
        d = Math.floor(d * 8) / 8 || d;
    const pxWidth = Math.max(1, Math.floor(Math.max(1, width) * d));
    const tiles = [];
    const fullH = Math.max(1, height);
    for (let y = 0; y < fullH; y += tileH)
        tiles.push({ y, h: Math.min(tileH, fullH - y) });
    return { dpr: d, pxWidth, cssWidth: pxWidth / d, tiles };
}
/**
 * Backing height in device px of a tile, rounded so CSS and device px agree.
 *
 * @function tilePxHeight
 * @param {Tile} tile - Tile.
 * @param {number} dpr - Plan DPR.
 * @returns {number} Device px.
 */
export function tilePxHeight(tile, dpr) {
    return Math.max(1, Math.round(tile.h * dpr));
}
