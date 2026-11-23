/**
 * @fileoverview Measuring for canvases. An absolute canvas sits at its
 * element's padding-box origin, so everything is measured from there:
 * measuring the border box would paint over the border. And a test for
 * elements one fixed viewport canvas cannot follow.
 *
 * @module packages/core/src/feedback/canvas/measure
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { windowOf } from '../../base/dom.js';

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
  const style = windowOf(el).getComputedStyle(el);
  return {
    left: parseFloat(style.borderLeftWidth) || 0,
    top: parseFloat(style.borderTopWidth) || 0,
    right: parseFloat(style.borderRightWidth) || 0,
    bottom: parseFloat(style.borderBottomWidth) || 0,
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
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + edges.left,
    top: rect.top + edges.top,
    width: rect.width - edges.left - edges.right,
    height: rect.height - edges.top - edges.bottom,
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
  if (el.closest('dialog,[role="dialog"],[role="alertdialog"],[popover]')) {
    return true;
  }
  const doc = el.ownerDocument;
  const view = windowOf(el);
  for (
    let parent = el.parentElement;
    parent && parent !== doc.body && parent !== doc.documentElement;
    parent = parent.parentElement
  ) {
    const style = view.getComputedStyle(parent);
    if (/(auto|scroll)/.test(style.overflowY + style.overflowX)) return true;
  }
  return false;
}
