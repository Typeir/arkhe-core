/**
 * @fileoverview A canvas whose backing store comes from the shared budget:
 * placed absolutely at its parent's padding-box origin, sized in CSS px and
 * device px separately, zeroed and handed back on release, and told when the GPU
 * drops or restores its 2D context.
 *
 * @module packages/core/src/feedback/canvas/managed
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { BudgetClient, CanvasBudget } from './budget.js';
/**
 * Attribute that marks a budgeted canvas.
 *
 * @constant TILE_ATTR
 * @type {string}
 */
export declare const TILE_ATTR = "data-canvas-tile";
/**
 * Where a canvas sits inside its parent, CSS px.
 *
 * @interface Placement
 * @property {number} top - Top, from the padding-box origin.
 * @property {number} width - CSS width.
 * @property {number} height - CSS height.
 */
export interface Placement {
    readonly top: number;
    readonly width: number;
    readonly height: number;
}
/**
 * What a managed canvas reports to its holder.
 *
 * @interface LossHandlers
 * @property {() => void} lost - The 2D context was lost.
 * @property {() => void} restored - The 2D context is back, blank.
 */
export interface LossHandlers {
    lost: () => void;
    restored: () => void;
}
/**
 * Budgeted canvas.
 *
 * @class ManagedCanvas
 */
export declare class ManagedCanvas {
    #private;
    /**
     * The canvas while a backing store is held; null otherwise.
     *
     * @type {HTMLCanvasElement | null}
     */
    canvas: HTMLCanvasElement | null;
    /**
     * Its 2D context while held; null otherwise.
     *
     * @type {CanvasRenderingContext2D | null}
     */
    ctx: CanvasRenderingContext2D | null;
    /**
     * @param {CanvasBudget} budget - Shared budget.
     * @param {BudgetClient} client - Holder the budget sees.
     * @param {LossHandlers} handlers - Context loss callbacks.
     */
    constructor(budget: CanvasBudget, client: BudgetClient, handlers: LossHandlers);
    /**
     * True while a backing store is held.
     *
     * @returns {boolean} Live.
     */
    get live(): boolean;
    /**
     * Asks the budget for `pxWidth × pxHeight` device px and, when granted,
     * puts a canvas of that size into `parent`.
     *
     * @param {HTMLElement} parent - Positioned parent.
     * @param {number} pxWidth - Backing width, device px.
     * @param {number} pxHeight - Backing height, device px.
     * @param {Placement} place - CSS placement.
     * @returns {boolean} True when the canvas and its context exist.
     */
    allocate(parent: HTMLElement, pxWidth: number, pxHeight: number, place: Placement): boolean;
    /**
     * Zeroes and removes the canvas and returns its pixels to the budget. The
     * canvas can allocate again afterwards.
     *
     * @returns {void}
     */
    release(): void;
}
