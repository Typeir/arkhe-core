/**
 * @fileoverview Number field rules shared by both ports. Zag holds the draft
 * text and formats and parses it in the provider's locale (fi: "1 234,5";
 * typing 1,5 works); the outside world sees a number or `null`. `NumericSync` keeps a
 * controlled value and Zag's draft in step without eating keystrokes.
 *
 * @module packages/core/src/numeric
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { formatLabel } from './labels.js';
import { DEFAULT_LOCALE, NUMERIC_FORMAT, formatNumber } from './locale.js';
import { definedOnly } from './machine.js';
/**
 * Maps Zag's parsed number to a field value.
 *
 * @function toNumericValue
 * @param {number} valueAsNumber - Parsed draft.
 * @returns {NumericValue} Number, or null for NaN.
 */
export function toNumericValue(valueAsNumber) {
    return Number.isNaN(valueAsNumber) ? null : valueAsNumber;
}
/**
 * Renders a field value as draft text in `locale`.
 *
 * @function formatDraft
 * @param {NumericValue | undefined} value - Field value.
 * @param {string} [locale] - BCP 47 locale. Defaults to `DEFAULT_LOCALE`.
 * @returns {string} Draft; empty for null or undefined.
 */
export function formatDraft(value, locale = DEFAULT_LOCALE) {
    return value === null || value === undefined
        ? ''
        : formatNumber(value, locale);
}
/**
 * Clamps a value into `bounds`; null passes through. A missing or non-finite
 * bound falls back to Zag's own default, the safe-integer range.
 *
 * @function clampToBounds
 * @param {NumericValue} value - Field value.
 * @param {NumericBounds} bounds - Limits.
 * @returns {NumericValue} Clamped value.
 */
export function clampToBounds(value, bounds) {
    if (value === null)
        return null;
    const finite = (bound, fallback) => bound !== undefined && Number.isFinite(bound) ? bound : fallback;
    return Math.min(Math.max(value, finite(bounds.min, Number.MIN_SAFE_INTEGER)), finite(bounds.max, Number.MAX_SAFE_INTEGER));
}
/**
 * Builds Zag number-input machine props, with Arkhé's step button names.
 *
 * @function numericMachineProps
 * @param {NumericMachineInput} input - Port input.
 * @returns {object} Machine props, minus change callbacks.
 */
export function numericMachineProps(input) {
    const initial = input.value !== undefined ? input.value : input.defaultValue;
    const locale = input.locale ?? DEFAULT_LOCALE;
    return definedOnly({
        id: input.id,
        locale,
        formatOptions: NUMERIC_FORMAT,
        defaultValue: formatDraft(initial, locale),
        min: input.min,
        max: input.max,
        step: input.step,
        translations: {
            incrementLabel: formatLabel(input.labels.numericIncrement, {
                label: input.label,
            }),
            decrementLabel: formatLabel(input.labels.numericDecrement, {
                label: input.label,
            }),
        },
        getRootNode: input.getRootNode,
    });
}
