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
const THEME_ATTRIBUTES = ['class', 'data-theme'];
/**
 * Viewport, DPR, font and theme watcher.
 *
 * @class DisplayWatcher
 */
export class DisplayWatcher {
    maxDpr;
    onChange;
    viewW = innerWidth;
    viewH = innerHeight;
    size = DisplayWatcher.sizeKey();
    dprQuery = null;
    scheme = matchMedia('(prefers-color-scheme: dark)');
    themeAttrs;
    /**
     * @param {number} maxDpr - Highest backing scale handed out.
     * @param {(change: DisplayChange) => void} onChange - Receives each change.
     */
    constructor(maxDpr, onChange) {
        this.maxDpr = maxDpr;
        this.onChange = onChange;
        addEventListener('resize', this.onResize);
        document.fonts?.addEventListener('loadingdone', this.onFonts);
        this.scheme.addEventListener('change', this.onTheme);
        this.themeAttrs = new MutationObserver(this.onTheme);
        this.themeAttrs.observe(document.documentElement, {
            attributes: true,
            attributeFilter: THEME_ATTRIBUTES,
        });
        this.watchDpr();
    }
    /**
     * Backing scale: the device DPR, capped at `maxDpr`.
     *
     * @returns {number} DPR.
     */
    get dpr() {
        return Math.min(devicePixelRatio, this.maxDpr);
    }
    /**
     * Viewport area in device px at the capped DPR.
     *
     * @returns {number} Pixels.
     */
    get screenPixels() {
        return this.viewW * this.viewH * this.dpr ** 2;
    }
    /**
     * Stops watching.
     *
     * @returns {void}
     */
    destroy() {
        removeEventListener('resize', this.onResize);
        document.fonts?.removeEventListener('loadingdone', this.onFonts);
        this.scheme.removeEventListener('change', this.onTheme);
        this.themeAttrs.disconnect();
        this.dprQuery?.removeEventListener('change', this.onDpr);
    }
    static sizeKey() {
        return `${innerWidth}x${devicePixelRatio}`;
    }
    watchDpr() {
        this.dprQuery?.removeEventListener('change', this.onDpr);
        this.dprQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
        this.dprQuery.addEventListener('change', this.onDpr);
    }
    onResize = () => {
        this.viewW = innerWidth;
        this.viewH = innerHeight;
        const size = DisplayWatcher.sizeKey();
        if (size === this.size)
            return this.onChange('height');
        this.size = size;
        this.onChange('size');
    };
    onDpr = () => {
        this.watchDpr();
        this.viewW = innerWidth;
        this.viewH = innerHeight;
        this.size = DisplayWatcher.sizeKey();
        this.onChange('size');
    };
    onFonts = () => this.onChange('fonts');
    onTheme = () => this.onChange('theme');
}
