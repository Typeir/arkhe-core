/**
 * @fileoverview The skeleton effect engine: one per app. It owns the frame
 * loop, the canvas budget, the observers and the palette; puts each owner
 * on a surface (canvases in the owner, or the viewport canvas for page-level
 * owners on software raster); reveals on `ready`; and re-measures or
 * repaints on resize, DPR, font and theme changes.
 *
 * @module packages/core/src/fx/engine
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { CanvasBudget } from '../canvas/budget.js';
import { DisplayWatcher } from '../canvas/display.js';
import { FrameLoop } from '../canvas/loop.js';
import { ObserverHub } from '../canvas/observers.js';
import { type Acceleration } from '../canvas/probe.js';
import { type Fx, type FxOptions, type FxStats } from './api.js';
/**
 * Effect engine.
 *
 * @class FxEngine
 */
export declare class FxEngine implements Fx {
    readonly opts: FxOptions;
    readonly loop: FrameLoop;
    readonly hub: ObserverHub;
    readonly display: DisplayWatcher;
    readonly budget: CanvasBudget;
    readonly reduced: boolean;
    readonly acceleration: Acceleration;
    private revision;
    private readonly style;
    private readonly atlases;
    private readonly entries;
    private readonly sizes;
    private readonly context;
    private readonly useViewport;
    private viewport;
    /**
     * @param {FxOptions} opts - Complete options.
     */
    constructor(opts: FxOptions);
    /**
     * Measures `host`'s skeleton and starts animating it. Attaching again
     * drops the old state and re-measures.
     *
     * @param {HTMLElement} host - Owner element.
     * @returns {void}
     */
    attach(host: HTMLElement): void;
    /**
     * The content has replaced the skeleton under `host`: start the reveal.
     * Live canvases repaint in this task, so the swap never shows uncovered.
     *
     * @param {HTMLElement} host - Owner element.
     * @param {() => void} [onRevealed] - Called once the reveal ends, or now when there is none.
     * @returns {void}
     */
    ready(host: HTMLElement, onRevealed?: () => void): void;
    /**
     * Drops `host` without revealing.
     *
     * @param {HTMLElement} host - Owner element.
     * @returns {void}
     */
    detach(host: HTMLElement): void;
    /**
     * Counters, for tests and tuning.
     *
     * @returns {FxStats} Stats.
     */
    stats(): FxStats;
    /**
     * Restarts the frame and peak counters.
     *
     * @returns {void}
     */
    resetStats(): void;
    /**
     * Removes every canvas, observer and listener.
     *
     * @returns {void}
     */
    destroy(): void;
    private pixelBudget;
    private scan;
    private viewportSurface;
    private painted;
    private finish;
    private kick;
    private remeasure;
    private readonly onDisplay;
    private readonly onScroll;
}
