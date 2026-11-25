/**
 * @fileoverview Checkbox rules shared by both ports: looks, sizes, root
 * attributes and the mixed state, which only the DOM property can set.
 *
 * @module packages/core/src/choice/checkbox
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */
import { flag } from '../base/parts.js';
/**
 * Builds the root attributes, filling in the default look and size.
 *
 * @function checkboxRootAttrs
 * @param {CheckboxRootInput} input - Port input.
 * @returns {CheckboxRootAttrs} Root attributes.
 */
export function checkboxRootAttrs(input) {
    return {
        'data-look': input.look ?? 'pip',
        'data-size': input.size ?? 'm',
        'data-invalid': flag(input.invalid),
        'data-label-hidden': flag(input.labelHidden),
    };
}
/**
 * Sets the mixed state, which has no HTML attribute. Ports call it whenever
 * the host's value changes; a click clears it in the browser meanwhile.
 *
 * @function markIndeterminate
 * @param {HTMLInputElement | null | undefined} input - Checkbox input.
 * @param {boolean | undefined} on - Mixed when true.
 * @returns {void}
 */
export function markIndeterminate(input, on) {
    if (input)
        input.indeterminate = Boolean(on);
}
