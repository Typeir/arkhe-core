/**
 * @fileoverview The empty option of a Select: a first entry, such as "All",
 * that stands for no choice. Zag keys it by an empty value; the host sees
 * `null`.
 *
 * @module packages/core/src/emptyOption
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */
import type { SelectOption } from './combobox.js';
/**
 * Value Zag keys the empty option by.
 *
 * @constant EMPTY_VALUE
 * @type {string}
 */
export declare const EMPTY_VALUE = "";
/**
 * Puts the empty option first when it has a label; a host option with an
 * empty value is dropped, so the two never collide.
 *
 * @function withEmptyOption
 * @template {SelectOption} T
 * @param {readonly T[]} items - Host options.
 * @param {string} [label] - Text of the empty option, such as "All".
 * @returns {readonly (T | SelectOption)[]} Options Zag lists.
 */
export declare function withEmptyOption<T extends SelectOption>(items: readonly T[], label?: string): readonly (T | SelectOption)[];
/**
 * Turns the host's value into Zag's: no choice is the empty option when
 * there is one.
 *
 * @function toEmptyValue
 * @param {string | null | undefined} value - Host value.
 * @param {string} [label] - Text of the empty option.
 * @returns {string | null | undefined} Zag value.
 */
export declare function toEmptyValue(value: string | null | undefined, label?: string): string | null | undefined;
/**
 * Turns Zag's value into the host's: the empty option is no choice.
 *
 * @function fromEmptyValue
 * @param {string | null} value - Zag value.
 * @returns {string | null} Host value.
 */
export declare function fromEmptyValue(value: string | null): string | null;
