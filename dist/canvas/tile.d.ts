/**
 * @fileoverview One tile of a tiled surface: a sentinel that drives wake
 * and visibility, and a budgeted canvas allocated lazily. It paints in full
 * once when it gets a canvas, then only its visible slice. Off screen it
 * waits for spare frame time. Once nothing in view animates, it finishes
 * on a timer when its last started reveal ends, on screen or off, so a
 * reveal never waits for a scroll. It gives its canvas back on eviction or
 * context loss.
 *
 * @module packages/core/src/canvas/tile
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { BudgetClient } from './budget.js';
import type { Frameable } from './loop.js';
import { type Tile } from './tiles.js';
import type { TiledSurface } from './tiled.js';
import type { Slice } from './view.js';
/**
 * Attribute that marks a tile's sentinel.
 *
 * @constant SENTINEL_ATTR
 * @type {string}
 */
export declare const SENTINEL_ATTR = "data-canvas-sentinel";
/**
 * Rows painted beyond the viewport on a partial repaint, CSS px.
 *
 * @constant SLICE_MARGIN
 * @type {number}
 */
export declare const SLICE_MARGIN = 64;
/**
 * One tile.
 *
 * @class CanvasTile
 */
export declare class CanvasTile implements BudgetClient, Frameable {
    private readonly owner;
    readonly tile: Tile;
    readonly slice: Slice;
    asleep: boolean;
    reported: boolean;
    visible: boolean;
    lastSeen: number;
    done: boolean;
    readonly sentinel: HTMLElement;
    private fresh;
    private settle;
    private revision;
    private readonly canvas;
    /**
     * @param {TiledSurface} owner - Surface.
     * @param {Tile} tile - Rows it covers.
     * @param {Slice} slice - What it draws.
     */
    constructor(owner: TiledSurface, tile: Tile, slice: Slice);
    /**
     * Off-screen work: the loop runs it only while frame time is left.
     *
     * @returns {boolean} Idle.
     */
    get idle(): boolean;
    /**
     * True while it holds a canvas.
     *
     * @returns {boolean} Has a canvas.
     */
    get hasCanvas(): boolean;
    /**
     * Enters the wake margin.
     *
     * @param {number} now - Time.
     * @returns {void}
     */
    wake(now: number): void;
    /**
     * Gets a canvas if awake and unfinished, and joins the loop. A visible
     * tile paints a new canvas before returning, so it never shows blank.
     *
     * @returns {void}
     */
    ensure(): void;
    /**
     * Redraws in full: now when `now`, else on the next frame.
     *
     * @param {number} t - Time.
     * @param {boolean} [now] - Paint in this task. Defaults to `visible`.
     * @returns {void}
     */
    repaint(t: number, now?: boolean): void;
    /**
     * Leaves the wake margin.
     *
     * @returns {void}
     */
    sleep(): void;
    /**
     * Gives its canvas back; the budget calls it.
     *
     * @returns {void}
     */
    evict(): void;
    /**
     * Draws one frame.
     *
     * @param {number} t - Time.
     * @returns {boolean} Still animating.
     */
    frame(t: number): boolean;
    /**
     * Enters or leaves the screen.
     *
     * @param {boolean} visible - On screen.
     * @returns {void}
     */
    setVisible(visible: boolean): void;
    /**
     * Removes its canvas, sentinel and observers.
     *
     * @returns {void}
     */
    destroy(): void;
    private settleLater;
    private allocate;
    private finish;
}
