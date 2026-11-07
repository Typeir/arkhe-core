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
 * Derives part ids from one base id. Characters outside `[A-Za-z0-9_-]`
 * become `-`, so framework ids like `:r1:` stay valid IDREFs.
 *
 * @function fieldIds
 * @param {string} base - Unique id of the field.
 * @returns {FieldIds} Part ids.
 */
export function fieldIds(base) {
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
export function fieldControlAttrs(ids, hasHint, hasError) {
    const described = [hasHint ? ids.hint : '', hasError ? ids.error : '']
        .filter(Boolean)
        .join(' ');
    return {
        id: ids.control,
        'aria-describedby': described || undefined,
        'aria-invalid': hasError ? true : undefined,
    };
}
