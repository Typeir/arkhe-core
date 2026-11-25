/**
 * @fileoverview Virtual rows: a long list of fixed-pitch rows draws only the
 * rows in view plus an overscan margin. Spacers before and after stand in
 * for the rest, and each row says its place in the whole set.
 *
 * @module packages/core/src/list/virtual
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */
/**
 * Rows drawn past each edge of the view.
 *
 * @constant VIRTUAL_OVERSCAN
 * @type {number}
 */
export declare const VIRTUAL_OVERSCAN = 8;
/**
 * Rows drawn: `start` inclusive, `end` exclusive.
 *
 * @interface VirtualRange
 * @property {number} start - First row drawn.
 * @property {number} end - One past the last row drawn.
 */
export interface VirtualRange {
    readonly start: number;
    readonly end: number;
}
/**
 * The scroll box as measured, in pixels.
 *
 * @interface VirtualView
 * @property {number} offset - Scroll offset.
 * @property {number} viewport - Visible height.
 * @property {number} inset - Space above the first row.
 * @property {number} pitch - Height of one row.
 */
export interface VirtualView {
    readonly offset: number;
    readonly viewport: number;
    readonly inset: number;
    readonly pitch: number;
}
/**
 * View before the box is measured: nothing visible yet.
 *
 * @constant UNMEASURED_VIEW
 * @type {VirtualView}
 */
export declare const UNMEASURED_VIEW: VirtualView;
/**
 * Spacer and pitch custom properties for the scroll box.
 *
 * @typedef {Record<'--row-pitch' | '--virtual-before' | '--virtual-after', string>} VirtualVars
 */
export type VirtualVars = Record<'--row-pitch' | '--virtual-before' | '--virtual-after', string>;
/**
 * Place of one row in the whole set, for assistive tech.
 *
 * @interface RowPosition
 * @property {number} aria-posinset - One-based place.
 * @property {number} aria-setsize - Rows in the set.
 */
export interface RowPosition {
    readonly 'aria-posinset': number;
    readonly 'aria-setsize': number;
}
/**
 * Returns the rows to draw for `count` rows seen through `view`.
 *
 * @function virtualRange
 * @param {number} count - Rows in the set.
 * @param {VirtualView} view - Measured box.
 * @param {number} [overscan] - Rows past each edge.
 * @returns {VirtualRange} Rows to draw.
 */
export declare function virtualRange(count: number, view: VirtualView, overscan?: number): VirtualRange;
/**
 * Returns the scroll offset that brings row `index` fully into view, or
 * null when it is already. A box with no height yet puts the row at the
 * top.
 *
 * @function rowScrollTop
 * @param {number} index - Row.
 * @param {VirtualView} view - Measured box.
 * @returns {number | null} New offset.
 */
export declare function rowScrollTop(index: number, view: VirtualView): number | null;
/**
 * Returns the spacer heights and pitch, in rem, for the drawn rows.
 *
 * @function virtualVars
 * @param {VirtualRange} range - Rows drawn.
 * @param {number} count - Rows in the set.
 * @param {number} pitch - Row height in rem.
 * @returns {VirtualVars} Custom properties.
 */
export declare function virtualVars(range: VirtualRange, count: number, pitch: number): VirtualVars;
/**
 * Returns the set position attributes of row `index`.
 *
 * @function rowPosition
 * @param {number} index - Row.
 * @param {number} count - Rows in the set.
 * @returns {RowPosition} Attributes.
 */
export declare function rowPosition(index: number, count: number): RowPosition;
/**
 * Measures `box`, a scroll box of rows `pitch` rem high.
 *
 * @function measureView
 * @param {HTMLElement} box - Scroll box.
 * @param {number} pitch - Row height in rem.
 * @returns {VirtualView} Measured view.
 */
export declare function measureView(box: HTMLElement, pitch: number): VirtualView;
/**
 * Reports `box`'s view now, then on every scroll or resize that changes it.
 *
 * @function watchView
 * @param {HTMLElement} box - Scroll box.
 * @param {number} pitch - Row height in rem.
 * @param {(view: VirtualView) => void} report - Hears each new view.
 * @returns {() => void} Stops watching.
 */
export declare function watchView(box: HTMLElement, pitch: number, report: (view: VirtualView) => void): () => void;
/**
 * Scrolls `box` just enough to show row `index` whole. Returns the view as
 * it now stands, so the row is drawn before the scroll event arrives, or
 * null when nothing moved.
 *
 * @function scrollToRow
 * @param {HTMLElement} box - Scroll box.
 * @param {number} index - Row.
 * @param {number} pitch - Row height in rem.
 * @returns {VirtualView | null} New view.
 */
export declare function scrollToRow(box: HTMLElement, index: number, pitch: number): VirtualView | null;
