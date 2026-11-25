/**
 * @fileoverview Radio group rules shared by both ports: items, looks,
 * root attributes and the group name. Native radios sharing one name give
 * one tab stop and arrow keys, so no script moves focus.
 *
 * @module packages/core/src/choice/radioGroup
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */
import { flag } from '../base/parts.js';
/**
 * Builds the root attributes, filling in look, size and direction.
 *
 * @function radioRootAttrs
 * @param {RadioRootInput} input - Port input.
 * @returns {RadioRootAttrs} Root attributes.
 */
export function radioRootAttrs(input) {
    return {
        'data-look': input.look ?? 'pip',
        'data-size': input.size ?? 'm',
        'data-orientation': input.orientation ?? 'horizontal',
        'data-invalid': flag(input.invalid),
        'data-label-hidden': flag(input.labelHidden),
    };
}
/**
 * Says whether the radio for `item` is checked, or undefined when the group
 * is uncontrolled and the browser keeps the state.
 *
 * @function radioChecked
 * @param {string | null | undefined} value - Controlled value; null checks none.
 * @param {RadioItem} item - Choice.
 * @returns {boolean | undefined} Checked state, or undefined.
 */
export function radioChecked(value, item) {
    return value === undefined ? undefined : value === item.value;
}
