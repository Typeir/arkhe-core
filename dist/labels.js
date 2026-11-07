/**
 * @fileoverview Every string Arkhé renders or announces, as templates an app
 * replaces through its i18n layer. Visible text and accessible names alike.
 * Counts are plural sets: `Intl.PluralRules` picks the form for the
 * provider's locale, and numbers in a template format in that locale.
 *
 * @module packages/core/src/labels
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { formatNumber, pluralCategory } from './locale.js';
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
    openLink: 'Open {label}',
    comboboxTrigger: 'Show options',
    comboboxClear: 'Clear {label}',
    comboboxEmpty: 'No matches.',
    results: { one: '{count} result', other: '{count} results' },
};
/**
 * Says whether `value` can stand in for the default label `fallback`: a
 * string for a template, a plural set with `other` for a plural set.
 *
 * @function fits
 * @param {unknown} value - Override.
 * @param {string | PluralLabel} fallback - Default label.
 * @returns {boolean} True when it fits.
 */
function fits(value, fallback) {
    if (typeof fallback === 'string')
        return typeof value === 'string';
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.other === 'string');
}
/**
 * Returns `DEFAULT_LABELS` with `overrides` applied. A plural set replaces
 * the default set whole, so one language's forms never mix with another's.
 *
 * @function resolveLabels
 * @param {Partial<ArkheLabels>} [overrides] - Translated templates.
 * @returns {ArkheLabels} Complete labels.
 */
export function resolveLabels(overrides = {}) {
    const given = Object.entries(overrides).filter(([key, value]) => Object.hasOwn(DEFAULT_LABELS, key) &&
        fits(value, DEFAULT_LABELS[key]));
    return { ...DEFAULT_LABELS, ...Object.fromEntries(given) };
}
/**
 * Fills `{name}` placeholders in `template`. Unknown placeholders stay as
 * written. With a locale, number values format in it.
 *
 * @function formatLabel
 * @param {string} template - Label template.
 * @param {Readonly<Record<string, string | number>>} values - Placeholder values.
 * @param {string} [locale] - BCP 47 locale for number values.
 * @returns {string} Filled label.
 */
export function formatLabel(template, values, locale) {
    return template.replace(/\{(\w+)\}/g, (match, name) => {
        if (!Object.hasOwn(values, name))
            return match;
        const value = values[name];
        return typeof value === 'number' && locale
            ? formatNumber(value, locale)
            : String(value);
    });
}
/**
 * Picks the form of `label` for `count` in `locale` and fills it; `{count}`
 * is the count, formatted in the locale.
 *
 * @function formatPlural
 * @param {PluralLabel} label - Plural set.
 * @param {number} count - Count.
 * @param {string} locale - BCP 47 locale.
 * @param {Readonly<Record<string, string | number>>} [values] - Other placeholder values.
 * @returns {string} Filled label.
 */
export function formatPlural(label, count, locale, values = {}) {
    const template = label[pluralCategory(count, locale)] ?? label.other;
    return formatLabel(template, { ...values, count }, locale);
}
