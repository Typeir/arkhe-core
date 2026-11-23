/**
 * @fileoverview Phone-width check. At this width and below, Select, Picker
 * and Search open a sheet from the bottom instead of a dropdown, so the
 * search box and its results stay above the on-screen keyboard.
 *
 * @module packages/core/src/base/narrow
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */

import { documentOf, type RootNode } from './environment.js';

/**
 * Media query for phone widths.
 *
 * @constant NARROW_QUERY
 * @type {string}
 */
export const NARROW_QUERY = '(max-width: 40rem)';

/**
 * Returns the phone-width media query list of `root`'s window, if it has one.
 *
 * @function narrowQuery
 * @param {RootNode} root - Root node.
 * @returns {MediaQueryList | null} Query list, `null` without one.
 */
function narrowQuery(root: RootNode): MediaQueryList | null {
  const view = documentOf(root).defaultView;
  return typeof view?.matchMedia === 'function'
    ? view.matchMedia(NARROW_QUERY)
    : null;
}

/**
 * Says whether `root`'s window is phone-width now.
 *
 * @function isNarrow
 * @param {RootNode} root - Root node.
 * @returns {boolean} True at phone width.
 */
export function isNarrow(root: RootNode): boolean {
  return narrowQuery(root)?.matches ?? false;
}

/**
 * Calls `onChange` whenever `root`'s window crosses phone width.
 *
 * @function watchNarrow
 * @param {RootNode} root - Root node.
 * @param {() => void} onChange - Called on each crossing.
 * @returns {() => void} Stops watching.
 */
export function watchNarrow(root: RootNode, onChange: () => void): () => void {
  const query = narrowQuery(root);
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}
