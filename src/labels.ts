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
 * @property {string} comboboxTrigger - Name of a combobox's open button.
 * @property {string} comboboxClear - Name of a combobox's clear button; `{label}` is the field.
 * @property {string} comboboxEmpty - Shown when nothing matches.
 * @property {string} resultOne - Announced count for one result.
 * @property {string} resultMany - Announced count otherwise; `{count}`.
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
  readonly comboboxTrigger: string;
  readonly comboboxClear: string;
  readonly comboboxEmpty: string;
  readonly resultOne: string;
  readonly resultMany: string;
}

/**
 * English labels, used where an app gives none.
 *
 * @constant DEFAULT_LABELS
 * @type {ArkheLabels}
 */
export const DEFAULT_LABELS: ArkheLabels = {
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
export function resolveLabels(
  overrides: Partial<ArkheLabels> = {},
): ArkheLabels {
  const given = Object.entries(overrides).filter(
    (entry) => typeof entry[1] === 'string',
  );
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
export function formatLabel(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  );
}
