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
/**
 * A counted label: one template per plural category the language uses
 * (`one`, `few`, `many`…), with `other` always present. `{count}` is the
 * count, formatted in the locale.
 *
 * @typedef {object} PluralLabel
 */
export type PluralLabel = Readonly<Partial<Record<Intl.LDMLPluralRule, string>> & {
    other: string;
}>;
/**
 * Label templates. `{name}` placeholders are filled by `formatLabel`.
 *
 * @interface ArkheLabels
 * @property {string} chipRemove - Accessible name of a chip's remove button; `{label}` is the chip.
 * @property {string} loading - Accessible name of a loading region.
 * @property {string} statusEmpty - Default text of an empty status.
 * @property {string} statusLoading - Default text of a loading status.
 * @property {string} statusError - Default text of an error status.
 * @property {string} progressValue - Value text of a progress bar; `{value}` and `{max}`.
 * @property {string} progressOver - Value text when past the maximum; `{value}`, `{max}`, `{over}`.
 * @property {string} numericIncrement - Name of a number field's step-up button; `{label}` is the field.
 * @property {string} numericDecrement - Name of a number field's step-down button; `{label}` is the field.
 * @property {string} close - Name of a close button on a modal or popover.
 * @property {string} pin - Name of a hover card's pin button; `{label}` is the card.
 * @property {string} unpin - Name of a pinned card's unpin button; `{label}` is the card.
 * @property {string} openLink - Name of a hover card's link to its address; `{label}` is the card.
 * @property {string} comboboxTrigger - Name of a combobox's open button.
 * @property {string} comboboxClear - Name of a combobox's clear button; `{label}` is the field.
 * @property {string} comboboxEmpty - Shown when nothing matches.
 * @property {PluralLabel} results - Announced count of results; `{count}`.
 */
export interface ArkheLabels {
    readonly chipRemove: string;
    readonly loading: string;
    readonly statusEmpty: string;
    readonly statusLoading: string;
    readonly statusError: string;
    readonly progressValue: string;
    readonly progressOver: string;
    readonly numericIncrement: string;
    readonly numericDecrement: string;
    readonly close: string;
    readonly pin: string;
    readonly unpin: string;
    readonly openLink: string;
    readonly comboboxTrigger: string;
    readonly comboboxClear: string;
    readonly comboboxEmpty: string;
    readonly results: PluralLabel;
}
/**
 * English labels, used where an app gives none.
 *
 * @constant DEFAULT_LABELS
 * @type {ArkheLabels}
 */
export declare const DEFAULT_LABELS: ArkheLabels;
/**
 * Returns `DEFAULT_LABELS` with `overrides` applied. A plural set replaces
 * the default set whole, so one language's forms never mix with another's.
 *
 * @function resolveLabels
 * @param {Partial<ArkheLabels>} [overrides] - Translated templates.
 * @returns {ArkheLabels} Complete labels.
 */
export declare function resolveLabels(overrides?: Partial<ArkheLabels>): ArkheLabels;
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
export declare function formatLabel(template: string, values: Readonly<Record<string, string | number>>, locale?: string): string;
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
export declare function formatPlural(label: PluralLabel, count: number, locale: string, values?: Readonly<Record<string, string | number>>): string;
