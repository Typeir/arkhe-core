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
export declare const CAP_PX = 16777216;
/**
 * Side cap per canvas, in device px. Many mobile GPUs drop a wider canvas
 * to software raster.
 *
 * @constant MAX_SIDE
 * @type {number}
 */
export declare const MAX_SIDE = 8192;
/**
 * One horizontal slice of an element, in element-local CSS px.
 *
 * @interface Tile
 * @property {number} y - Top.
 * @property {number} h - Height.
 */
export interface Tile {
    readonly y: number;
    readonly h: number;
}
/**
 * How an element is drawn.
 *
 * @interface TilePlan
 * @property {number} dpr - Backing scale: the given DPR, or a lower 1/8 step when a cap forces it, so elements share stamp atlases.
 * @property {number} pxWidth - Backing width in device px.
 * @property {number} cssWidth - CSS width that maps exactly onto `pxWidth` at `dpr`.
 * @property {readonly Tile[]} tiles - Slices, top to bottom.
 */
export interface TilePlan {
    readonly dpr: number;
    readonly pxWidth: number;
    readonly cssWidth: number;
    readonly tiles: readonly Tile[];
}
/**
 * Caps and grid a plan must respect.
 *
 * @interface TileLimits
 * @property {number} [capPx] - Area cap per canvas, device px. Defaults to `CAP_PX`.
 * @property {number} [maxSide] - Side cap per canvas, device px. Defaults to `MAX_SIDE`.
 * @property {number} [step] - Tile heights are multiples of it, CSS px. Defaults to 1.
 */
export interface TileLimits {
    readonly capPx?: number;
    readonly maxSide?: number;
    readonly step?: number;
}
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
export declare function planTiles(width: number, height: number, dpr: number, tileHeight: number, limits?: TileLimits): TilePlan;
/**
 * Backing height in device px of a tile, rounded so CSS and device px agree.
 *
 * @function tilePxHeight
 * @param {Tile} tile - Tile.
 * @param {number} dpr - Plan DPR.
 * @returns {number} Device px.
 */
export declare function tilePxHeight(tile: Tile, dpr: number): number;
