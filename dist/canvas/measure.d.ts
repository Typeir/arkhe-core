/**
 * @fileoverview Measuring for canvases. An absolute canvas sits at its
 * element's padding-box origin, so everything is measured from there:
 * measuring the border box would paint over the border. And a test for
 * elements one fixed viewport canvas cannot follow.
 *
 * @module packages/core/src/canvas/measure
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Border widths around a padding box.
 *
 * @interface Edges
 * @property {number} left - Left border, CSS px.
 * @property {number} top - Top border, CSS px.
 * @property {number} right - Right border, CSS px.
 * @property {number} bottom - Bottom border, CSS px.
 */
export interface Edges {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}
/**
 * A padding box in viewport coordinates.
 *
 * @interface PaddingBox
 * @property {number} left - Left, viewport px.
 * @property {number} top - Top, viewport px.
 * @property {number} width - Width, CSS px.
 * @property {number} height - Height, CSS px.
 * @property {Edges} edges - Border widths, for cheap re-reads with `boxFromEdges`.
 */
export interface PaddingBox {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
    readonly edges: Edges;
}
/**
 * Reads `el`'s border widths.
 *
 * @function borderEdges
 * @param {Element} el - Element.
 * @returns {Edges} Edges.
 */
export declare function borderEdges(el: Element): Edges;
/**
 * Padding box of `el` from known border widths: one rect read, no style
 * read, cheap enough for every frame.
 *
 * @function boxFromEdges
 * @param {Element} el - Element.
 * @param {Edges} edges - Its border widths.
 * @returns {PaddingBox} Box.
 */
export declare function boxFromEdges(el: Element, edges: Edges): PaddingBox;
/**
 * Padding box of `el`.
 *
 * @function paddingBox
 * @param {Element} el - Element.
 * @returns {PaddingBox} Box.
 */
export declare function paddingBox(el: Element): PaddingBox;
/**
 * True when `el` sits inside a scroll container, a dialog or a popover,
 * where one fixed viewport canvas can neither follow nor stack correctly,
 * so it needs canvases in its own flow.
 *
 * @function needsInFlowCanvas
 * @param {Element} el - Element.
 * @returns {boolean} Needs in-flow canvases.
 */
export declare function needsInFlowCanvas(el: Element): boolean;
