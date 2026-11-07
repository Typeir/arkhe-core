/**
 * @fileoverview Watches what invalidates canvases and says how much: a
 * width or DPR change means a rebuild; a height-only change (a phone's URL
 * bar) only resizes viewport-sized things; font loads and theme changes
 * mean a repaint. Caches the viewport size, because reading `innerHeight`
 * after a DOM write forces layout, and caps the DPR backing stores use.
 *
 * @module packages/core/src/canvas/display
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
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
    readonly maxDpr: number;
    private readonly onChange;
    viewW: number;
    viewH: number;
    private size;
    private dprQuery;
    private readonly scheme;
    private readonly themeAttrs;
    /**
     * @param {number} maxDpr - Highest backing scale handed out.
     * @param {(change: DisplayChange) => void} onChange - Receives each change.
     */
    constructor(maxDpr: number, onChange: (change: DisplayChange) => void);
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
    private static sizeKey;
    private watchDpr;
    private readonly onResize;
    private readonly onDpr;
    private readonly onFonts;
    private readonly onTheme;
}
