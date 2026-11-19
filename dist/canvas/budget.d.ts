/**
 * @fileoverview Budget of live canvases and device pixels, one per app and
 * shared by every canvas feature. It grants backing stores and evicts the
 * least recently seen holder, sleeping ones first. It bounds what is kept
 * off screen: a visible requester is always granted, even past the budget,
 * once every off-screen holder is gone, as PDF.js treats visible pages.
 *
 * @module packages/core/src/canvas/budget
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Something that can hold a budgeted canvas.
 *
 * @interface BudgetClient
 * @property {boolean} asleep - Outside the wake margin.
 * @property {boolean} visible - On screen; never evicted.
 * @property {number} lastSeen - Time it last woke.
 * @property {() => void} evict - Drops its canvas; must call `release`.
 */
export interface BudgetClient {
    readonly asleep: boolean;
    readonly visible: boolean;
    readonly lastSeen: number;
    evict(): void;
}
/**
 * Canvas budget.
 *
 * @class CanvasBudget
 */
export declare class CanvasBudget {
    readonly maxCount: number;
    maxPixels: number;
    private readonly held;
    private pixels;
    peakCount: number;
    peakPixels: number;
    /**
     * @param {number} maxCount - Live canvas budget.
     * @param {number} maxPixels - Device pixel budget.
     */
    constructor(maxCount: number, maxPixels: number);
    /**
     * Live canvases.
     *
     * @returns {number} Count.
     */
    get count(): number;
    /**
     * Live device pixels.
     *
     * @returns {number} Pixels.
     */
    get livePixels(): number;
    /**
     * True while visible holders keep the budget overspent.
     *
     * @returns {boolean} Over budget.
     */
    get over(): boolean;
    /**
     * Grants `px` device pixels to `client`, evicting others if it must.
     *
     * @param {BudgetClient} client - Requester.
     * @param {number} px - Device pixels wanted.
     * @returns {boolean} True when granted.
     */
    grant(client: BudgetClient, px: number): boolean;
    /**
     * Returns a client's pixels to the budget.
     *
     * @param {BudgetClient} client - Holder.
     * @returns {void}
     */
    release(client: BudgetClient): void;
    /**
     * Starts peak tracking again from what is live now.
     *
     * @returns {void}
     */
    resetPeaks(): void;
    private victim;
}
