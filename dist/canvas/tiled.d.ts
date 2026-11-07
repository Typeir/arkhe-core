/**
 * @fileoverview Tiled surface: one region cut into tiles, each an absolute
 * canvas inside the owner, so it scrolls natively with the page. Tiles wake
 * and sleep through shared observers and get their backing stores from the
 * shared budget. A rebuild whose geometry is unchanged just repaints; a real
 * rebuild seeds the new tiles' wake and visibility, so nothing blanks.
 *
 * @module packages/core/src/canvas/tiled
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { type TilePlan } from './tiles.js';
import { type Region, type SurfaceContext } from './view.js';
/**
 * Tiled surface of one region.
 *
 * @class TiledSurface
 */
export declare class TiledSurface {
    readonly ctx: SurfaceContext;
    readonly region: Region;
    plan: TilePlan;
    private tiles;
    private viewT;
    private viewRange;
    private built;
    /**
     * @param {SurfaceContext} ctx - Shared services.
     * @param {Region} region - What it draws.
     */
    constructor(ctx: SurfaceContext, region: Region);
    /**
     * Viewport rows in region-local px, read once per frame time.
     *
     * @param {number} t - Frame time.
     * @returns {readonly [number, number]} Top and bottom.
     */
    view(t: number): readonly [number, number];
    /**
     * Re-plans the tiles after a re-measure.
     *
     * @returns {void}
     */
    rebuild(): void;
    /**
     * False once every tile has been reported outside the wake margin, so a
     * far region can skip layout reads.
     *
     * @returns {boolean} Near, or not yet reported.
     */
    near(): boolean;
    /**
     * Gets every awake tile a canvas and into the loop.
     *
     * @returns {void}
     */
    kick(): void;
    /**
     * Repaints every live tile in the current task, so a DOM swap and its
     * cover land in the same frame. `top` is the host's padding-box top from
     * before the swap, which a swap inside the host does not move.
     *
     * @param {number} top - Host top, viewport px; not finite to re-read it.
     * @returns {void}
     */
    paintNow(top: number): void;
    /**
     * Re-arms visible tiles after a scroll, so rows that scroll into a
     * partly visible tile start.
     *
     * @returns {void}
     */
    scrolled(): void;
    /**
     * A tile finished; the region is done once every tile is.
     *
     * @returns {void}
     */
    tileDone(): void;
    /**
     * Stops observing a tile's sentinel.
     *
     * @param {Element} sentinel - Sentinel.
     * @returns {void}
     */
    unobserve(sentinel: Element): void;
    /**
     * Removes every tile.
     *
     * @returns {void}
     */
    teardown(): void;
    /**
     * Tiles holding a canvas now.
     *
     * @returns {number} Count.
     */
    liveCanvases(): number;
    private key;
    private build;
}
