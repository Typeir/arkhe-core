/**
 * @fileoverview Locale-aware numbers and plural forms through `Intl`, with
 * one cached formatter per locale and options, so labels and number fields
 * format the same way.
 *
 * @module packages/core/src/locale
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Locale used where an app gives none.
 *
 * @constant DEFAULT_LOCALE
 * @type {string}
 */
export declare const DEFAULT_LOCALE = "en";
/**
 * How number fields format and parse: grouped digits, and every fraction
 * digit the user typed (`Intl` rounds to 3 by default).
 *
 * @constant NUMERIC_FORMAT
 * @type {Intl.NumberFormatOptions}
 */
export declare const NUMERIC_FORMAT: Intl.NumberFormatOptions;
/**
 * Formats `value` in `locale` (fi: "1 234,5").
 *
 * @function formatNumber
 * @param {number} value - Number.
 * @param {string} locale - BCP 47 locale.
 * @param {Intl.NumberFormatOptions} [options] - Format options. Defaults to `NUMERIC_FORMAT`.
 * @returns {string} Formatted number.
 */
export declare function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string;
/**
 * Returns the plural category of `count` in `locale`.
 *
 * @function pluralCategory
 * @param {number} count - Count.
 * @param {string} locale - BCP 47 locale.
 * @returns {Intl.LDMLPluralRule} Category: `one`, `few`, `many`, `other`…
 */
export declare function pluralCategory(count: number, locale: string): Intl.LDMLPluralRule;
