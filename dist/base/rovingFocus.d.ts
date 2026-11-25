/**
 * @fileoverview Roving focus for a toolbar where the browser lacks
 * `focusgroup`: one item in the tab order, arrows and Home / End move it,
 * and it is remembered after a click. Installed only without native
 * support, never beside it.
 *
 * @module packages/core/src/base/rovingFocus
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */
/**
 * Says whether the browser moves focus inside a `focusgroup` itself.
 *
 * @function hasFocusgroup
 * @param {HTMLElement} element - Any element of the document.
 * @returns {boolean} True with native support.
 */
export declare function hasFocusgroup(element: HTMLElement): boolean;
/**
 * Keeps one button of `root` in the tab order and moves it with arrows,
 * wrapping at the ends, and Home / End. Does nothing where the browser has
 * `focusgroup`. Buttons added later join; the remembered one stays.
 *
 * @function rovingFocus
 * @param {HTMLElement} root - Toolbar.
 * @returns {() => void} Stops it.
 */
export declare function rovingFocus(root: HTMLElement): () => void;
