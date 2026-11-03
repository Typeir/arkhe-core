/**
 * @fileoverview Viewport surface: one fixed canvas the size of the
 * viewport, redrawn from each region's position every frame while anything
 * in view animates, at the full display rate while scrolling so it stays
 * aligned. It shrinks to 0×0 when no region is left. Used for page-level
 * regions when canvases are software-rastered.
 *
 * @module packages/core/src/canvas/viewport
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { Frameable } from './loop.js';
import type { Region, SurfaceContext } from './view.js';
/**
 * Attribute that marks the viewport canvas.
 *
 * @constant VIEWPORT_ATTR
 * @type {string}
 */
export declare const VIEWPORT_ATTR = "data-canvas-viewport";
/**
 * Root margin within which a region on the viewport surface counts as near.
 *
 * @constant HOST_MARGIN
 * @type {string}
 */
export declare const HOST_MARGIN = "25% 0px";
/**
 * How long the frame cap stays lifted after a scroll event, ms.
 *
 * @constant SCROLL_UNCAP_MS
 * @type {number}
 */
export declare const SCROLL_UNCAP_MS = 150;
/**
 * One fixed canvas for many regions.
 *
 * @class ViewportSurface
 */
export declare class ViewportSurface implements Frameable {
    private readonly ctx;
    private readonly canvas;
    private readonly ctx2d;
    private readonly regions;
    private readonly visible;
    private readonly seen;
    private dpr;
    private dirty;
    private settle;
    /**
     * @param {SurfaceContext} ctx - Shared services.
     * @param {Document} [doc] - Document whose body holds the canvas.
     */
    constructor(ctx: SurfaceContext, doc?: Document);
    /**
     * Draws `region` from now on.
     *
     * @param {Region} region - Region.
     * @returns {void}
     */
    add(region: Region): void;
    /**
     * Takes a re-measured region's new content.
     *
     * @param {Region} region - Region.
     * @returns {void}
     */
    remeasured(region: Region): void;
    /**
     * True unless the region was reported outside the near margin.
     *
     * @param {Region} region - Region.
     * @returns {boolean} Near.
     */
    near(region: Region): boolean;
    /**
     * Stops drawing `region`.
     *
     * @param {Region} region - Region.
     * @returns {void}
     */
    remove(region: Region): void;
    /**
     * Draws on the next frame.
     *
     * @returns {void}
     */
    kick(): void;
    /**
     * Repaints in the current task, so a DOM swap and its cover land in the
     * same frame.
     *
     * @returns {void}
     */
    paintNow(): void;
    /**
     * Matches the canvas to the viewport and the capped DPR.
     *
     * @returns {void}
     */
    resize(): void;
    /**
     * Draws every visible region.
     *
     * @param {number} t - Time.
     * @returns {boolean} Still animating, or a stale frame to clear.
     */
    frame(t: number): boolean;
    /**
     * Removes the canvas and every observer.
     *
     * @returns {void}
     */
    destroy(): void;
    /**
     * Backing store size, device px.
     *
     * @returns {number} Pixels.
     */
    pixels(): number;
    private settleLater;
    private readonly onScroll;
}
