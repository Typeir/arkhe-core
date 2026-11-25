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
import { type RootNode } from './environment.js';
/**
 * Media query for phone widths.
 *
 * @constant NARROW_QUERY
 * @type {string}
 */
export declare const NARROW_QUERY = "(max-width: 40rem)";
/**
 * Says whether `root`'s window is phone-width now.
 *
 * @function isNarrow
 * @param {RootNode} root - Root node.
 * @returns {boolean} True at phone width.
 */
export declare function isNarrow(root: RootNode): boolean;
/**
 * Calls `onChange` whenever `root`'s window crosses phone width.
 *
 * @function watchNarrow
 * @param {RootNode} root - Root node.
 * @param {() => void} onChange - Called on each crossing.
 * @returns {() => void} Stops watching.
 */
export declare function watchNarrow(root: RootNode, onChange: () => void): () => void;
