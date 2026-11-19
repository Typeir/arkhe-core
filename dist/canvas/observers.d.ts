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
 * Receives whether an element intersects its margin.
 *
 * @typedef {(inside: boolean) => void} IntersectionWatch
 */
export type IntersectionWatch = (inside: boolean) => void;
/**
 * One IntersectionObserver per distinct root margin.
 *
 * @class ObserverHub
 */
export declare class ObserverHub {
    private readonly hubs;
    /**
     * Watches `el` against `margin`. One watch per element and margin.
     *
     * @param {Element} el - Element.
     * @param {string} margin - Root margin, e.g. `100% 0px`.
     * @param {IntersectionWatch} watch - Receives each report.
     * @returns {void}
     */
    observe(el: Element, margin: string, watch: IntersectionWatch): void;
    /**
     * Stops watching `el` against `margin`.
     *
     * @param {Element} el - Element.
     * @param {string} margin - Root margin it was watched with.
     * @returns {void}
     */
    unobserve(el: Element, margin: string): void;
    /**
     * Drops every observer.
     *
     * @returns {void}
     */
    disconnect(): void;
}
/**
 * Size of an element for change detection: its offset box.
 *
 * @function sizeOf
 * @param {HTMLElement} el - Element.
 * @returns {string} Width and height.
 */
export declare function sizeOf(el: HTMLElement): string;
/**
 * ResizeObserver that reports only real size changes, in batches.
 *
 * @class SizeWatcher
 */
export declare class SizeWatcher {
    private readonly sizes;
    private readonly ro;
    /**
     * @param {(changed: HTMLElement[]) => void} onChange - Receives every changed element of one callback at once.
     */
    constructor(onChange: (changed: HTMLElement[]) => void);
    /**
     * Watches `el`, taking its size now as the known one.
     *
     * @param {HTMLElement} el - Element.
     * @param {string} [size] - Its size, when already read.
     * @returns {void}
     */
    watch(el: HTMLElement, size?: string): void;
    /**
     * Takes `el`'s size now as the known one.
     *
     * @param {HTMLElement} el - Element.
     * @returns {boolean} True when it differed.
     */
    update(el: HTMLElement): boolean;
    /**
     * Stops watching `el`.
     *
     * @param {HTMLElement} el - Element.
     * @returns {void}
     */
    unwatch(el: HTMLElement): void;
    /**
     * Stops watching everything.
     *
     * @returns {void}
     */
    disconnect(): void;
}
