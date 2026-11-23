/**
 * @fileoverview Markup contract shared by every port: the `arkhe` scope
 * class and the `data-scope` / `data-part` attributes styles select on.
 *
 * @module packages/core/src/base/parts
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
 * Attributes that name one part of one component.
 *
 * @interface PartAttributes
 * @property {string} data-scope - Component name, kebab-case.
 * @property {string} data-part - Part name, kebab-case.
 */
export interface PartAttributes {
  readonly 'data-scope': string;
  readonly 'data-part': string;
}

/**
 * Returns the attributes that mark `part` of component `scope`.
 *
 * @function partAttrs
 * @param {string} scope - Component name, kebab-case.
 * @param {string} part - Part name, kebab-case.
 * @returns {PartAttributes} Attributes to spread on the element.
 */
export function partAttrs(scope: string, part: string): PartAttributes {
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
export function flag(on: boolean | undefined): '' | undefined {
  if (on) return '';
  return undefined;
}

/**
 * True when `text` has something to show: an empty string counts as absent,
 * so an empty icon name, label, hint or error renders nothing.
 *
 * @function hasText
 * @param {string | null} [text] - Optional text.
 * @returns {boolean} Non-empty.
 */
export function hasText(text?: string | null): text is string {
  return text !== undefined && text !== null && text !== '';
}
