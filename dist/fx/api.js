/**
 * @fileoverview Public shape of the effect engine: its options and their
 * ruled defaults (canvas-fx R15), the calls an owner makes, its stats, and
 * the inert engine used where canvases cannot run (no observers, forced
 * colours), which reveals at once and leaves the CSS skeleton in place.
 *
 * @module packages/core/src/fx/api
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Ruled defaults (canvas-fx R15).
 *
 * @constant DEFAULT_FX_OPTIONS
 * @type {FxOptions}
 */
export const DEFAULT_FX_OPTIONS = {
    surface: 'auto',
    maxFps: 30,
    watchdog: true,
    painter: 'path',
    sleep: 'keep',
    wakeMargin: 1,
    maxCanvases: 24,
    pixelBudget: 4,
    bandScale: 1,
    maxDpr: 2,
};
/**
 * Attribute set on an owner once a canvas has painted it; the CSS skeleton
 * goes transparent under it.
 *
 * @constant PAINTED_ATTR
 * @type {string}
 */
export const PAINTED_ATTR = 'data-painted';
/**
 * True where the engine can run: a browser with observers and media queries.
 *
 * @function canRunFx
 * @returns {boolean} Capable.
 */
export function canRunFx() {
    return (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        typeof window.IntersectionObserver === 'function' &&
        typeof window.ResizeObserver === 'function' &&
        typeof window.requestAnimationFrame === 'function');
}
/**
 * Engine that draws nothing: the CSS skeleton stays, and reveals end at once.
 *
 * @class InertFx
 */
export class InertFx {
    /**
     * Does nothing.
     *
     * @returns {void}
     */
    attach() { }
    /**
     * Reports the reveal as finished.
     *
     * @param {HTMLElement} _host - Owner.
     * @param {() => void} [onRevealed] - Called now.
     * @returns {void}
     */
    ready(_host, onRevealed) {
        onRevealed?.();
    }
    /**
     * Does nothing.
     *
     * @returns {void}
     */
    detach() { }
    /**
     * Counters of an engine that never runs.
     *
     * @returns {FxStats} Zeroes.
     */
    stats() {
        return { frames: 0, running: 0, regions: 0, liveCanvases: 0 };
    }
    /**
     * Does nothing.
     *
     * @returns {void}
     */
    resetStats() { }
    /**
     * Does nothing.
     *
     * @returns {void}
     */
    destroy() { }
}
