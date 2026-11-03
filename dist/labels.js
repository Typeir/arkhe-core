/**
 * @fileoverview Every string Arkhé renders or announces, as templates an app
 * replaces through its i18n layer. Visible text and accessible names alike.
 *
 * @module packages/core/src/labels
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * English labels, used where an app gives none.
 *
 * @constant DEFAULT_LABELS
 * @type {ArkheLabels}
 */
export const DEFAULT_LABELS = {
    chipRemove: 'Remove {label}',
    loading: 'Loading',
    statusEmpty: 'Nothing here yet.',
    statusLoading: 'Loading…',
    statusError: 'Something went wrong.',
    progressValue: '{value} of {max}',
    progressOver: '{value} of {max}, {over} over',
    numericIncrement: 'Increase {label}',
    numericDecrement: 'Decrease {label}',
    close: 'Close',
    pin: 'Pin {label}',
    unpin: 'Unpin {label}',
    comboboxTrigger: 'Show options',
    comboboxClear: 'Clear {label}',
    comboboxEmpty: 'No matches.',
    resultOne: '1 result',
    resultMany: '{count} results',
};
/**
 * Returns `DEFAULT_LABELS` with `overrides` applied.
 *
 * @function resolveLabels
 * @param {Partial<ArkheLabels>} [overrides] - Translated templates.
 * @returns {ArkheLabels} Complete labels.
 */
export function resolveLabels(overrides = {}) {
    const given = Object.entries(overrides).filter((entry) => typeof entry[1] === 'string');
    return { ...DEFAULT_LABELS, ...Object.fromEntries(given) };
}
/**
 * Fills `{name}` placeholders in `template`. Unknown placeholders stay as written.
 *
 * @function formatLabel
 * @param {string} template - Label template.
 * @param {Readonly<Record<string, string | number>>} values - Placeholder values.
 * @returns {string} Filled label.
 */
export function formatLabel(template, values) {
    return template.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
}
