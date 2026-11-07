/**
 * @fileoverview One skeleton owner (canvas-fx R13): the geometry of the
 * `Skeleton` parts it declares, each snapped to its own cell grid size
 * first, and their reveal state. Parts of a nested owner belong to that
 * owner. Geometry is host-local CSS px from the padding-box origin.
 *
 * @module packages/core/src/fx/skeleton/region
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { Region, Slice } from '../../canvas/view.js';
import { type SkeletonStyle } from './painter.js';
import { type Slotted } from './slots.js';
/**
 * Selector of an owner: a `SkeletonGroup` root.
 *
 * @constant OWNER_SELECTOR
 * @type {string}
 */
export declare const OWNER_SELECTOR = "[data-scope=\"skeleton\"][data-part=\"group\"]";
/**
 * Selector of a declared shape: a `Skeleton` root.
 *
 * @constant SHAPE_SELECTOR
 * @type {string}
 */
export declare const SHAPE_SELECTOR = "[data-scope=\"skeleton\"][data-part=\"root\"]";
/**
 * A declared shape, its cell grid and its decode state.
 *
 * @interface SkeletonBox
 * @property {number} cols - Cell columns, at least one.
 * @property {number} rows - Cell rows, at least one.
 * @property {number} cellY - Top of the first cell row, centred in the box.
 * @property {number | null} start - Decode start, ms; null before it is due.
 * @property {number} dur - Decode duration, ms.
 * @property {boolean} visibleAtReady - In view when the content arrived.
 */
export interface SkeletonBox extends Slotted {
    readonly cols: number;
    readonly rows: number;
    readonly cellY: number;
    start: number | null;
    dur: number;
    visibleAtReady: boolean;
}
/**
 * State and geometry of one owner.
 *
 * @class SkeletonRegion
 */
export declare class SkeletonRegion implements Region {
    readonly host: HTMLElement;
    readonly reduced: boolean;
    readonly style: SkeletonStyle;
    boxes: SkeletonBox[];
    width: number;
    height: number;
    readonly step = 12;
    readyAt: number | null;
    swapped: boolean;
    private edges;
    /**
     * @param {HTMLElement} host - Owner element.
     * @param {boolean} reduced - Reduced motion: one still frame, instant reveal.
     * @param {SkeletonStyle} style - Painter and colours, shared by the engine.
     */
    constructor(host: HTMLElement, reduced: boolean, style: SkeletonStyle);
    /**
     * Padding box now, from the border widths of the last measure.
     *
     * @returns {{ left: number; top: number; bottom: number }} Viewport px.
     */
    box(): {
        left: number;
        top: number;
        bottom: number;
    };
    /**
     * Reads the declared shapes from the DOM.
     *
     * @returns {void}
     */
    measure(): void;
    /**
     * Identity of the geometry tiles depend on.
     *
     * @returns {string} Key.
     */
    key(): string;
    /**
     * Content touching rows [y0, y1), one cell row either side.
     *
     * @param {number} y0 - First row.
     * @param {number} y1 - Row after the last.
     * @returns {Slice} Slice.
     */
    slice(y0: number, y1: number): Slice;
    /**
     * Marks the content as arrived. Shapes in view start decoding now; the
     * rest start when they come into view.
     *
     * @param {number} t - Now.
     * @param {number} viewTop - Viewport top, host-local.
     * @param {number} viewBottom - Viewport bottom, host-local.
     * @returns {void}
     */
    ready(t: number, viewTop: number, viewBottom: number): void;
    /**
     * Ends every reveal at once, as after a re-measure past the swap: the
     * shapes no longer match what is underneath.
     *
     * @returns {void}
     */
    settle(): void;
    /**
     * Gives start times to shapes of `idx` that are in view.
     *
     * @param {readonly number[]} idx - Shape indices.
     * @param {number} t - Now.
     * @param {number} top - Viewport top, host-local.
     * @param {number} bottom - Viewport bottom, host-local.
     * @returns {void}
     */
    startVisible(idx: readonly number[], t: number, top: number, bottom: number): void;
    /**
     * Decode front of a shape at `t`, in px from its left edge; null before
     * it starts, Infinity once done.
     *
     * @param {SkeletonBox} c - Shape.
     * @param {number} t - Now.
     * @returns {number | null} Front.
     */
    front(c: SkeletonBox, t: number): number | null;
    /**
     * Shapes of `idx`.
     *
     * @param {readonly number[]} idx - Shape indices.
     * @returns {SkeletonBox[]} Shapes.
     */
    pick(idx: readonly number[]): SkeletonBox[];
}
