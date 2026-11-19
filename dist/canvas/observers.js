/**
 * @fileoverview Shared observers. `ObserverHub` keeps one
 * IntersectionObserver per root margin and dispatches through an element
 * map. `SizeWatcher` keeps one ResizeObserver and reports only elements
 * whose size really changed, so the callback `observe()` always fires
 * first, and any callback that changes nothing, is skipped.
 *
 * @module packages/core/src/canvas/observers
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * One IntersectionObserver per distinct root margin.
 *
 * @class ObserverHub
 */
export class ObserverHub {
    hubs = new Map();
    /**
     * Watches `el` against `margin`. One watch per element and margin.
     *
     * @param {Element} el - Element.
     * @param {string} margin - Root margin, e.g. `100% 0px`.
     * @param {IntersectionWatch} watch - Receives each report.
     * @returns {void}
     */
    observe(el, margin, watch) {
        let hub = this.hubs.get(margin);
        if (!hub) {
            const watches = new Map();
            const io = new IntersectionObserver((entries) => {
                for (const e of entries)
                    watches.get(e.target)?.(e.isIntersecting);
            }, { rootMargin: margin });
            hub = { io, watches };
            this.hubs.set(margin, hub);
        }
        hub.watches.set(el, watch);
        hub.io.observe(el);
    }
    /**
     * Stops watching `el` against `margin`.
     *
     * @param {Element} el - Element.
     * @param {string} margin - Root margin it was watched with.
     * @returns {void}
     */
    unobserve(el, margin) {
        const hub = this.hubs.get(margin);
        if (!hub)
            return;
        hub.watches.delete(el);
        hub.io.unobserve(el);
    }
    /**
     * Drops every observer.
     *
     * @returns {void}
     */
    disconnect() {
        for (const hub of this.hubs.values())
            hub.io.disconnect();
        this.hubs.clear();
    }
}
/**
 * Size of an element for change detection: its offset box.
 *
 * @function sizeOf
 * @param {HTMLElement} el - Element.
 * @returns {string} Width and height.
 */
export function sizeOf(el) {
    return `${el.offsetWidth}x${el.offsetHeight}`;
}
/**
 * ResizeObserver that reports only real size changes, in batches.
 *
 * @class SizeWatcher
 */
export class SizeWatcher {
    sizes = new Map();
    ro;
    /**
     * @param {(changed: HTMLElement[]) => void} onChange - Receives every changed element of one callback at once.
     */
    constructor(onChange) {
        this.ro = new ResizeObserver((entries) => {
            const changed = entries
                .map((e) => e.target)
                .filter((el) => this.sizes.has(el) && this.update(el));
            if (changed.length)
                onChange(changed);
        });
    }
    /**
     * Watches `el`, taking its size now as the known one.
     *
     * @param {HTMLElement} el - Element.
     * @param {string} [size] - Its size, when already read.
     * @returns {void}
     */
    watch(el, size = sizeOf(el)) {
        this.sizes.set(el, size);
        this.ro.observe(el);
    }
    /**
     * Takes `el`'s size now as the known one.
     *
     * @param {HTMLElement} el - Element.
     * @returns {boolean} True when it differed.
     */
    update(el) {
        const size = sizeOf(el);
        if (this.sizes.get(el) === size)
            return false;
        this.sizes.set(el, size);
        return true;
    }
    /**
     * Stops watching `el`.
     *
     * @param {HTMLElement} el - Element.
     * @returns {void}
     */
    unwatch(el) {
        this.sizes.delete(el);
        this.ro.unobserve(el);
    }
    /**
     * Stops watching everything.
     *
     * @returns {void}
     */
    disconnect() {
        this.sizes.clear();
        this.ro.disconnect();
    }
}
