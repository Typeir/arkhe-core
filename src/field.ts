/**
 * @fileoverview Field wiring: ids that tie a label, hint and error to one
 * control, and the attributes the control receives.
 *
 * @module packages/core/src/field
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

/**
 * Ids of a field's parts.
 *
 * @interface FieldIds
 * @property {string} control - Id of the control.
 * @property {string} label - Id of the label.
 * @property {string} hint - Id of the hint.
 * @property {string} error - Id of the error message.
 */
export interface FieldIds {
  readonly control: string;
  readonly label: string;
  readonly hint: string;
  readonly error: string;
}

/**
 * Attributes a field hands to its control.
 *
 * @interface FieldControlAttrs
 * @property {string} id - Control id; the label's `for` points here.
 * @property {string | undefined} aria-describedby - Hint and error ids, when shown.
 * @property {true | undefined} aria-invalid - Set while an error shows.
 */
export interface FieldControlAttrs {
  readonly id: string;
  readonly 'aria-describedby': string | undefined;
  readonly 'aria-invalid': true | undefined;
}

/**
 * Derives part ids from one base id. Characters outside `[A-Za-z0-9_-]`
 * become `-`, so framework ids like `:r1:` stay valid IDREFs.
 *
 * @function fieldIds
 * @param {string} base - Unique id of the field.
 * @returns {FieldIds} Part ids.
 */
export function fieldIds(base: string): FieldIds {
  const safe = base.replace(/[^\w-]/g, '-');
  return {
    control: `${safe}-control`,
    label: `${safe}-label`,
    hint: `${safe}-hint`,
    error: `${safe}-error`,
  };
}

/**
 * Returns the attributes for the control of a field.
 *
 * @function fieldControlAttrs
 * @param {FieldIds} ids - Part ids.
 * @param {boolean} hasHint - True when a hint renders.
 * @param {boolean} hasError - True when an error renders.
 * @returns {FieldControlAttrs} Control attributes.
 */
export function fieldControlAttrs(
  ids: FieldIds,
  hasHint: boolean,
  hasError: boolean,
): FieldControlAttrs {
  const described = [hasHint ? ids.hint : '', hasError ? ids.error : '']
    .filter(Boolean)
    .join(' ');
  return {
    id: ids.control,
    'aria-describedby': described || undefined,
    'aria-invalid': hasError ? true : undefined,
  };
}
