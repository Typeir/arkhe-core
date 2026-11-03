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
/**
 * Calls `remove`; if `button` had focus and the host then drops the chip,
 * focuses the neighbouring chip's remove button once the port has rendered.
 *
 * @function removeChip
 * @param {HTMLElement} button - Remove button being pressed.
 * @param {() => void} remove - Host's remove handler.
 * @returns {void}
 */
export declare function removeChip(button: HTMLElement, remove: () => void): void;
