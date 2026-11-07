/**
 * @fileoverview Where focus goes when a modal closes and its opener is gone.
 * On open, the element that had focus is kept, or, when focus sits on the
 * body (a page that cancels `mousedown` on its buttons), the last element
 * pressed. With it goes a ranked list of nearby nodes: its siblings, then
 * its parent's, then its grandparent's, nearest first, alternating older
 * and newer. On close, a live opener wins; else the first node still in the
 * page gives itself or its first focusable child; else nothing, and focus
 * falls to the body.
 *
 * @module packages/core/src/focusReturn
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { RootNode } from './environment.js';
/**
 * Siblings looked at per level.
 *
 * @constant FOCUS_RETURN_WIDTH
 * @type {number}
 */
export declare const FOCUS_RETURN_WIDTH = 10;
/**
 * Ancestor levels climbed above the opener's own siblings.
 *
 * @constant FOCUS_RETURN_DEPTH
 * @type {number}
 */
export declare const FOCUS_RETURN_DEPTH = 2;
/**
 * Ranks the nodes near `opener`: per level, nearest first, older before
 * newer, at most `width` nodes; then one level up, `depth` times.
 *
 * @function focusCandidates
 * @param {Element} opener - Element that had focus on open.
 * @param {number} [width] - Siblings per level. Defaults to `FOCUS_RETURN_WIDTH`.
 * @param {number} [depth] - Levels above the opener. Defaults to `FOCUS_RETURN_DEPTH`.
 * @returns {Element[]} Candidates, best first.
 */
export declare function focusCandidates(opener: Element, width?: number, depth?: number): Element[];
/**
 * Returns `node` when it takes focus, else its first focusable descendant.
 *
 * @function focusableIn
 * @param {Element} node - Candidate.
 * @returns {HTMLElement | null} Element to focus, if any.
 */
export declare function focusableIn(node: Element): HTMLElement | null;
/**
 * Remembers one modal's opener and its neighbours across an open.
 *
 * @class FocusReturn
 */
export declare class FocusReturn {
    private opened;
    private opener;
    private pressed;
    private ranked;
    /**
     * Remembers the last element pressed in `root`, the opener when a click
     * leaves focus on the body. Call while the modal is mounted.
     *
     * @param {RootNode} root - Document or shadow root of the modal.
     * @returns {() => void} Stops listening.
     */
    watch(root: RootNode): () => void;
    /**
     * Feeds the wanted open state. The first `true` of each opening keeps the
     * root's focused element, else the last one pressed, and ranks its
     * neighbours.
     *
     * @param {boolean} open - Open state about to apply.
     * @param {RootNode} root - Document or shadow root of the modal.
     * @returns {void}
     */
    track(open: boolean, root: RootNode): void;
    /**
     * Element to focus on close: null while the opener is still in the page,
     * so Zag returns there itself.
     *
     * @returns {HTMLElement | null} Nearest focusable neighbour, if needed.
     */
    target(): HTMLElement | null;
}
