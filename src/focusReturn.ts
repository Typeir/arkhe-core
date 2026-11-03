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
export const FOCUS_RETURN_WIDTH = 10;

/**
 * Ancestor levels climbed above the opener's own siblings.
 *
 * @constant FOCUS_RETURN_DEPTH
 * @type {number}
 */
export const FOCUS_RETURN_DEPTH = 2;

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

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
export function focusCandidates(
  opener: Element,
  width: number = FOCUS_RETURN_WIDTH,
  depth: number = FOCUS_RETURN_DEPTH,
): Element[] {
  const ranked: Element[] = [];
  let node: Element | null = opener;
  for (let level = 0; node && level <= depth; level += 1) {
    let older = node.previousElementSibling;
    let newer = node.nextElementSibling;
    let taken = 0;
    while (taken < width && (older || newer)) {
      if (older) {
        ranked.push(older);
        older = older.previousElementSibling;
        taken += 1;
      }
      if (newer && taken < width) {
        ranked.push(newer);
        newer = newer.nextElementSibling;
        taken += 1;
      }
    }
    node = node.parentElement;
  }
  return ranked;
}

/**
 * Returns `node` when it takes focus, else its first focusable descendant.
 *
 * @function focusableIn
 * @param {Element} node - Candidate.
 * @returns {HTMLElement | null} Element to focus, if any.
 */
export function focusableIn(node: Element): HTMLElement | null {
  if (!node.isConnected || node.closest('[inert],[hidden]')) return null;
  if (node.matches(FOCUSABLE)) return node as HTMLElement;
  return node.querySelector<HTMLElement>(FOCUSABLE);
}

/**
 * Remembers one modal's opener and its neighbours across an open.
 *
 * @class FocusReturn
 */
export class FocusReturn {
  private opened = false;
  private opener: Element | null = null;
  private pressed: Element | null = null;
  private ranked: Element[] = [];

  /**
   * Remembers the last element pressed in `root`, the opener when a click
   * leaves focus on the body. Call while the modal is mounted.
   *
   * @param {RootNode} root - Document or shadow root of the modal.
   * @returns {() => void} Stops listening.
   */
  watch(root: RootNode): () => void {
    const press = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      this.pressed = target.closest(FOCUSABLE) ?? target;
    };
    root.addEventListener('pointerdown', press, true);
    return () => root.removeEventListener('pointerdown', press, true);
  }

  /**
   * Feeds the wanted open state. The first `true` of each opening keeps the
   * root's focused element, else the last one pressed, and ranks its
   * neighbours.
   *
   * @param {boolean} open - Open state about to apply.
   * @param {RootNode} root - Document or shadow root of the modal.
   * @returns {void}
   */
  track(open: boolean, root: RootNode): void {
    if (open && !this.opened) {
      const active = root.activeElement;
      const body = active?.ownerDocument.body;
      const pressed = this.pressed?.isConnected ? this.pressed : null;
      this.opener = active && active !== body ? active : pressed;
      this.ranked = this.opener ? focusCandidates(this.opener) : [];
    }
    this.opened = open;
  }

  /**
   * Element to focus on close: null while the opener is still in the page,
   * so Zag returns there itself.
   *
   * @returns {HTMLElement | null} Nearest focusable neighbour, if needed.
   */
  target(): HTMLElement | null {
    if (!this.opener || this.opener.isConnected) return null;
    for (const node of this.ranked) {
      const found = focusableIn(node);
      if (found) return found;
    }
    return null;
  }
}
