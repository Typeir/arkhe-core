/**
 * @fileoverview Chip removal: when the host drops a chip whose remove button
 * had focus, focus moves to a neighbouring chip's remove button rather than
 * falling to the page.
 *
 * @module packages/core/src/chip
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

const CHIP_ROOT = '[data-scope="chip"][data-part="root"]';
const CHIP_REMOVE = '[data-scope="chip"][data-part="remove"]';

/**
 * Finds the remove button after `button` among its chip's siblings, else the
 * one before. A chip alone in a wrapper (a list item) looks one level up.
 *
 * @function neighbourRemove
 * @param {HTMLElement} button - Remove button being pressed.
 * @returns {HTMLElement | null} Neighbouring remove button.
 */
function neighbourRemove(button: HTMLElement): HTMLElement | null {
  const chip = button.closest(CHIP_ROOT);
  const parent = chip?.parentElement;
  const scope = parent?.childElementCount === 1 ? parent.parentElement : parent;
  if (!scope) return null;
  const buttons = Array.from(scope.querySelectorAll<HTMLElement>(CHIP_REMOVE));
  const at = buttons.indexOf(button);
  return buttons[at + 1] ?? buttons[at - 1] ?? null;
}

/**
 * Calls `remove`; if `button` had focus and the host then drops the chip,
 * focuses the neighbouring chip's remove button once the port has rendered.
 *
 * @function removeChip
 * @param {HTMLElement} button - Remove button being pressed.
 * @param {() => void} remove - Host's remove handler.
 * @returns {void}
 */
export function removeChip(button: HTMLElement, remove: () => void): void {
  const root = button.getRootNode() as Document | ShadowRoot;
  const next = root.activeElement === button ? neighbourRemove(button) : null;
  remove();
  if (!next) return;
  setTimeout(() => {
    if (!button.isConnected && next.isConnected) next.focus();
  }, 0);
}
