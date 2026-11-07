/**
 * @fileoverview Markup contract shared by every port: the `arkhe` scope
 * class and the `data-scope` / `data-part` attributes styles select on.
 *
 * @module packages/core/src/parts
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Class on every Arkhé component root. Styles apply only inside it.
 *
 * @constant ARKHE_CLASS
 * @type {string}
 */
export const ARKHE_CLASS = 'arkhe';
/**
 * Returns the attributes that mark `part` of component `scope`.
 *
 * @function partAttrs
 * @param {string} scope - Component name, kebab-case.
 * @param {string} part - Part name, kebab-case.
 * @returns {PartAttributes} Attributes to spread on the element.
 */
export function partAttrs(scope, part) {
    return { 'data-scope': scope, 'data-part': part };
}
/**
 * Returns `''` when `on`, else `undefined`: a boolean data attribute that is
 * present or absent, never `"false"`.
 *
 * @function flag
 * @param {boolean | undefined} on - State.
 * @returns {'' | undefined} Attribute value.
 */
export function flag(on) {
    return on ? '' : undefined;
}
