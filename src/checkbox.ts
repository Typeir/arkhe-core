/**
 * @fileoverview Checkbox rules shared by both ports: looks, sizes, root
 * attributes and the mixed state, which only the DOM property can set.
 *
 * @module packages/core/src/checkbox
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

import { flag } from './parts.js';

/**
 * How a checkbox draws: a rhombus pip or a square box with a mark.
 *
 * @typedef {'pip' | 'box'} CheckboxLook
 */
export type CheckboxLook = 'pip' | 'box';

/**
 * Checkbox size: s, m or l.
 *
 * @typedef {'s' | 'm' | 'l'} CheckboxSize
 */
export type CheckboxSize = 's' | 'm' | 'l';

/**
 * What a port passes to `checkboxRootAttrs`.
 *
 * @interface CheckboxRootInput
 * @property {CheckboxLook} [look] - Look; pip by default.
 * @property {CheckboxSize} [size] - Size; m by default.
 * @property {boolean} [invalid] - True while an error shows.
 * @property {boolean} [labelHidden] - Hides the label visually; it still names the box.
 */
export interface CheckboxRootInput {
  readonly look?: CheckboxLook;
  readonly size?: CheckboxSize;
  readonly invalid?: boolean;
  readonly labelHidden?: boolean;
}

/**
 * Attributes of a checkbox root.
 *
 * @interface CheckboxRootAttrs
 * @property {CheckboxLook} data-look - Look.
 * @property {CheckboxSize} data-size - Size.
 * @property {'' | undefined} data-invalid - Present while an error shows.
 * @property {'' | undefined} data-label-hidden - Present while the label is hidden.
 */
export interface CheckboxRootAttrs {
  readonly 'data-look': CheckboxLook;
  readonly 'data-size': CheckboxSize;
  readonly 'data-invalid': '' | undefined;
  readonly 'data-label-hidden': '' | undefined;
}

/**
 * Builds the root attributes, filling in the default look and size.
 *
 * @function checkboxRootAttrs
 * @param {CheckboxRootInput} input - Port input.
 * @returns {CheckboxRootAttrs} Root attributes.
 */
export function checkboxRootAttrs(input: CheckboxRootInput): CheckboxRootAttrs {
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
export function markIndeterminate(
  input: HTMLInputElement | null | undefined,
  on: boolean | undefined,
): void {
  if (input) input.indeterminate = Boolean(on);
}
