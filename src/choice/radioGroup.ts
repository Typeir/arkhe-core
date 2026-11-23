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

import type { CheckboxSize } from './checkbox.js';
import { flag } from '../base/parts.js';

/**
 * One choice.
 *
 * @interface RadioItem
 * @property {string} value - Submitted value.
 * @property {string} label - Visible name.
 * @property {boolean} [disabled] - Blocks this choice.
 */
export interface RadioItem {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * How a radio group draws: rhombus pips or joined segments.
 *
 * @typedef {'pip' | 'segmented'} RadioLook
 */
export type RadioLook = 'pip' | 'segmented';

/**
 * Which way the choices run.
 *
 * @typedef {'horizontal' | 'vertical'} RadioOrientation
 */
export type RadioOrientation = 'horizontal' | 'vertical';

/**
 * What a port passes to `radioRootAttrs`.
 *
 * @interface RadioRootInput
 * @property {RadioLook} [look] - Look. Defaults to `pip`.
 * @property {CheckboxSize} [size] - Pip size. Defaults to `m`.
 * @property {RadioOrientation} [orientation] - Direction. Defaults to `horizontal`.
 * @property {boolean} [invalid] - True while an error shows.
 * @property {boolean} [labelHidden] - Hides the legend visually; it still names the group.
 */
export interface RadioRootInput {
  readonly look?: RadioLook;
  readonly size?: CheckboxSize;
  readonly orientation?: RadioOrientation;
  readonly invalid?: boolean;
  readonly labelHidden?: boolean;
}

/**
 * Attributes of a radio group root.
 *
 * @interface RadioRootAttrs
 * @property {RadioLook} data-look - Look.
 * @property {CheckboxSize} data-size - Pip size.
 * @property {RadioOrientation} data-orientation - Direction.
 * @property {'' | undefined} data-invalid - Present while an error shows.
 * @property {'' | undefined} data-label-hidden - Present while the legend is hidden.
 */
export interface RadioRootAttrs {
  readonly 'data-look': RadioLook;
  readonly 'data-size': CheckboxSize;
  readonly 'data-orientation': RadioOrientation;
  readonly 'data-invalid': '' | undefined;
  readonly 'data-label-hidden': '' | undefined;
}

/**
 * Builds the root attributes, filling in look, size and direction.
 *
 * @function radioRootAttrs
 * @param {RadioRootInput} input - Port input.
 * @returns {RadioRootAttrs} Root attributes.
 */
export function radioRootAttrs(input: RadioRootInput): RadioRootAttrs {
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
export function radioChecked(
  value: string | null | undefined,
  item: RadioItem,
): boolean | undefined {
  return value === undefined ? undefined : value === item.value;
}
