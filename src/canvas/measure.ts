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
export function borderEdges(el: Element): Edges {
  const cs = getComputedStyle(el);
  return {
    left: parseFloat(cs.borderLeftWidth) || 0,
    top: parseFloat(cs.borderTopWidth) || 0,
    right: parseFloat(cs.borderRightWidth) || 0,
    bottom: parseFloat(cs.borderBottomWidth) || 0,
  };
}

/**
 * Padding box of `el` from known border widths: one rect read, no style
 * read, cheap enough for every frame.
 *
 * @function boxFromEdges
 * @param {Element} el - Element.
 * @param {Edges} edges - Its border widths.
 * @returns {PaddingBox} Box.
 */
export function boxFromEdges(el: Element, edges: Edges): PaddingBox {
  const r = el.getBoundingClientRect();
  return {
    left: r.left + edges.left,
    top: r.top + edges.top,
    width: r.width - edges.left - edges.right,
    height: r.height - edges.top - edges.bottom,
    edges,
  };
}

/**
 * Padding box of `el`.
 *
 * @function paddingBox
 * @param {Element} el - Element.
 * @returns {PaddingBox} Box.
 */
export function paddingBox(el: Element): PaddingBox {
  return boxFromEdges(el, borderEdges(el));
}

/**
 * True when `el` sits inside a scroll container, a dialog or a popover,
 * where one fixed viewport canvas can neither follow nor stack correctly,
 * so it needs canvases in its own flow.
 *
 * @function needsInFlowCanvas
 * @param {Element} el - Element.
 * @returns {boolean} Needs in-flow canvases.
 */
export function needsInFlowCanvas(el: Element): boolean {
  if (el.closest('dialog,[role="dialog"],[role="alertdialog"],[popover]'))
    return true;
  const doc = el.ownerDocument;
  for (
    let e = el.parentElement;
    e && e !== doc.body && e !== doc.documentElement;
    e = e.parentElement
  ) {
    const o = getComputedStyle(e);
    if (/(auto|scroll)/.test(o.overflowY + o.overflowX)) return true;
  }
  return false;
}
