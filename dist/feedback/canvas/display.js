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
import { windowOf } from '../../base/dom.js';
/**
 * Root attributes a theme switch writes.
 *
 * @constant THEME_ATTRIBUTES
 * @type {string[]}
 */
const THEME_ATTRIBUTES = ['class', 'data-theme'];
/**
 * Viewport, DPR, font and theme watcher.
 *
 * @class DisplayWatcher
 */
export class DisplayWatcher {
    /**
     * Viewport width, CSS px, as of the last resize.
     *
     * @type {number}
     */
    viewW;
    /**
     * Viewport height, CSS px, as of the last resize.
     *
     * @type {number}
     */
    viewH;
    /**
     * Highest backing scale handed out.
     *
     * @type {number}
     */
    maxDpr;
    /**
     * Window whose viewport, fonts and theme are watched.
     *
     * @type {OwnerWindow}
     */
    #view;
    /**
     * Width and DPR of the last report, to tell a height-only resize.
     *
     * @type {string}
     */
    #size;
    /**
     * Media query that fires when the DPR leaves its current value; null
     * before the first watch.
     *
     * @type {MediaQueryList | null}
     */
    #dprQuery = null;
    /**
     * Media query of the dark colour scheme.
     *
     * @type {MediaQueryList}
     */
    #scheme;
    /**
     * Observer of the theme attributes on the root element.
     *
     * @type {MutationObserver}
     */
    #themeAttrs;
    /**
     * Receives each change.
     *
     * @type {(change: DisplayChange) => void}
     */
    #onChange;
    /**
     * @param {number} maxDpr - Highest backing scale handed out.
     * @param {(change: DisplayChange) => void} onChange - Receives each change.
     * @param {OwnerWindow} [view] - Window to watch. Defaults to the window core was loaded in.
     */
    constructor(maxDpr, onChange, view = windowOf()) {
        this.maxDpr = maxDpr;
        this.#onChange = onChange;
        this.#view = view;
        this.viewW = view.innerWidth;
        this.viewH = view.innerHeight;
        this.#size = this.#sizeKey();
        this.#scheme = view.matchMedia('(prefers-color-scheme: dark)');
        view.addEventListener('resize', this.#onResize);
        view.document.fonts?.addEventListener('loadingdone', this.#onFonts);
        this.#scheme.addEventListener('change', this.#onTheme);
        this.#themeAttrs = new view.MutationObserver(this.#onTheme);
        this.#themeAttrs.observe(view.document.documentElement, {
            attributes: true,
            attributeFilter: THEME_ATTRIBUTES,
        });
        this.#watchDpr();
    }
    /**
     * Window being watched.
     *
     * @returns {OwnerWindow} Window.
     */
    get view() {
        return this.#view;
    }
    /**
     * Backing scale: the device DPR, capped at `maxDpr`.
     *
     * @returns {number} DPR.
     */
    get dpr() {
        return Math.min(this.#view.devicePixelRatio, this.maxDpr);
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
        this.#view.removeEventListener('resize', this.#onResize);
        this.#view.document.fonts?.removeEventListener('loadingdone', this.#onFonts);
        this.#scheme.removeEventListener('change', this.#onTheme);
        this.#themeAttrs.disconnect();
        this.#dprQuery?.removeEventListener('change', this.#onDpr);
    }
    /**
     * Width and DPR now, as one comparable key.
     *
     * @returns {string} Key.
     */
    #sizeKey() {
        return `${this.#view.innerWidth}x${this.#view.devicePixelRatio}`;
    }
    /**
     * Re-arms the DPR query on the current DPR.
     *
     * @returns {void}
     */
    #watchDpr() {
        this.#dprQuery?.removeEventListener('change', this.#onDpr);
        this.#dprQuery = this.#view.matchMedia(`(resolution: ${this.#view.devicePixelRatio}dppx)`);
        this.#dprQuery.addEventListener('change', this.#onDpr);
    }
    /**
     * Caches the viewport and reports a height-only or a full size change.
     *
     * @returns {void}
     */
    #onResize = () => {
        this.viewW = this.#view.innerWidth;
        this.viewH = this.#view.innerHeight;
        const size = this.#sizeKey();
        if (size === this.#size) {
            this.#onChange('height');
            return;
        }
        this.#size = size;
        this.#onChange('size');
    };
    /**
     * Re-arms the DPR query and reports a size change.
     *
     * @returns {void}
     */
    #onDpr = () => {
        this.#watchDpr();
        this.viewW = this.#view.innerWidth;
        this.viewH = this.#view.innerHeight;
        this.#size = this.#sizeKey();
        this.#onChange('size');
    };
    /**
     * Reports a finished font load.
     *
     * @returns {void}
     */
    #onFonts = () => {
        this.#onChange('fonts');
    };
    /**
     * Reports a colour scheme or theme attribute change.
     *
     * @returns {void}
     */
    #onTheme = () => {
        this.#onChange('theme');
    };
}
