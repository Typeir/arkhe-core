/**
 * @fileoverview One `requestAnimationFrame` loop for every canvas surface.
 * It runs only while something animates and cancels itself otherwise. It
 * can cap its rate, lift the cap for a while (scrolling), keep off-screen
 * work to spare frame time, and step its rate down when frames run slow.
 *
 * @module packages/core/src/canvas/loop
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Frame time, in ms, after which off-screen work waits for a later frame.
 *
 * @constant IDLE_BUDGET
 * @type {number}
 */
export declare const IDLE_BUDGET = 6;
/**
 * Rates the watchdog steps down to, in frames per second, in order.
 *
 * @constant WATCHDOG_TIERS
 * @type {readonly number[]}
 */
export declare const WATCHDOG_TIERS: readonly number[];
/**
 * Something the loop draws.
 *
 * @interface Frameable
 * @property {(t: number) => boolean} frame - Draws at time `t`; false once it stops animating.
 * @property {boolean} [idle] - Off-screen work, run only while frame time is left.
 */
export interface Frameable {
    frame(t: number): boolean;
    readonly idle?: boolean;
}
/**
 * Shared frame loop.
 *
 * @class FrameLoop
 */
export declare class FrameLoop {
    private readonly raf;
    private readonly caf;
    private readonly now;
    private readonly active;
    private handle;
    private last;
    private slow;
    private seen;
    private tiers;
    frames: number;
    drawMs: number;
    minInterval: number;
    uncapUntil: number;
    tier: number;
    onSlow: (() => void) | null;
    /**
     * @param {(cb: FrameRequestCallback) => number} [raf] - Frame request.
     * @param {(id: number) => void} [caf] - Frame cancel.
     * @param {() => number} [now] - Clock for draw timing.
     */
    constructor(raf?: (cb: FrameRequestCallback) => number, caf?: (id: number) => void, now?: () => number);
    /**
     * True while a frame is pending.
     *
     * @returns {boolean} Running.
     */
    get running(): boolean;
    /**
     * Caps the rate at `fps`; 0 or less removes the cap.
     *
     * @param {number} fps - Frames per second.
     * @returns {void}
     */
    cap(fps: number): void;
    /**
     * Steps the rate down through `tiers` each time more than 15 of 60
     * frames clearly miss their budget (`> 1.5 × budget + 2 ms`).
     *
     * @param {readonly number[]} [tiers] - Rates, in frames per second.
     * @returns {void}
     */
    watchdog(tiers?: readonly number[]): void;
    /**
     * Adds a surface and starts the loop if needed.
     *
     * @param {Frameable} f - Surface.
     * @returns {void}
     */
    add(f: Frameable): void;
    /**
     * Removes a surface; the loop stops on its own when none are left.
     *
     * @param {Frameable} f - Surface.
     * @returns {void}
     */
    delete(f: Frameable): void;
    /**
     * Stops everything.
     *
     * @returns {void}
     */
    clear(): void;
    private readonly degrade;
    private readonly tick;
    private watch;
}
