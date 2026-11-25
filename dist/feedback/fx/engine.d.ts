/**
 * @fileoverview The skeleton effect engine: one per app. It owns the frame
 * loop, the canvas budget, the observers and the palette; puts each owner
 * on a surface (canvases in the owner, or the viewport canvas for page-level
 * owners on software raster); reveals on `ready`; and re-measures or
 * repaints on resize, DPR, font and theme changes.
 *
 * @module packages/core/src/feedback/fx/engine
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { type OwnerWindow } from '../../base/dom.js';
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
    #private;
    /**
     * Complete options.
     *
     * @type {FxOptions}
     */
    readonly opts: FxOptions;
    /**
     * Shared frame loop, on the engine window's frames.
     *
     * @type {FrameLoop}
     */
    readonly loop: FrameLoop;
    /**
     * Shared intersection observers.
     *
     * @type {ObserverHub}
     */
    readonly hub: ObserverHub;
    /**
     * Viewport, DPR, font and theme watcher.
     *
     * @type {DisplayWatcher}
     */
    readonly display: DisplayWatcher;
    /**
     * Shared canvas budget.
     *
     * @type {CanvasBudget}
     */
    readonly budget: CanvasBudget;
    /**
     * Reduced motion was asked for when the engine started.
     *
     * @type {boolean}
     */
    readonly reduced: boolean;
    /**
     * Start-up guess at GPU-backed canvases.
     *
     * @type {Acceleration}
     */
    readonly acceleration: Acceleration;
    /**
     * @param {FxOptions} opts - Complete options.
     * @param {OwnerWindow} [view] - Window the engine draws in. Defaults to the window core was loaded in.
     */
    constructor(opts: FxOptions, view?: OwnerWindow);
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
}
