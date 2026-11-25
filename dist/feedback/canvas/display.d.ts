/**
 * @fileoverview Watches what invalidates canvases and says how much: a
 * width or DPR change means a rebuild; a height-only change (a phone's URL
 * bar) only resizes viewport-sized things; font loads and theme changes
 * mean a repaint. Caches the viewport size, because reading `innerHeight`
 * after a DOM write forces layout, and caps the DPR backing stores use.
 *
 * @module packages/core/src/feedback/canvas/display
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { type OwnerWindow } from '../../base/dom.js';
/**
 * What changed: `size` (width or DPR), `height` (height only), `fonts`
 * (a font finished loading) or `theme` (colour scheme or theme attribute).
 *
 * @typedef {'size' | 'height' | 'fonts' | 'theme'} DisplayChange
 */
export type DisplayChange = 'size' | 'height' | 'fonts' | 'theme';
/**
 * Viewport, DPR, font and theme watcher.
 *
 * @class DisplayWatcher
 */
export declare class DisplayWatcher {
    #private;
    /**
     * Viewport width, CSS px, as of the last resize.
     *
     * @type {number}
     */
    viewW: number;
    /**
     * Viewport height, CSS px, as of the last resize.
     *
     * @type {number}
     */
    viewH: number;
    /**
     * Highest backing scale handed out.
     *
     * @type {number}
     */
    readonly maxDpr: number;
    /**
     * @param {number} maxDpr - Highest backing scale handed out.
     * @param {(change: DisplayChange) => void} onChange - Receives each change.
     * @param {OwnerWindow} [view] - Window to watch. Defaults to the window core was loaded in.
     */
    constructor(maxDpr: number, onChange: (change: DisplayChange) => void, view?: OwnerWindow);
    /**
     * Window being watched.
     *
     * @returns {OwnerWindow} Window.
     */
    get view(): OwnerWindow;
    /**
     * Backing scale: the device DPR, capped at `maxDpr`.
     *
     * @returns {number} DPR.
     */
    get dpr(): number;
    /**
     * Viewport area in device px at the capped DPR.
     *
     * @returns {number} Pixels.
     */
    get screenPixels(): number;
    /**
     * Stops watching.
     *
     * @returns {void}
     */
    destroy(): void;
}
