/**
 * @fileoverview Helpers for handing props to Zag machines from either port.
 *
 * @module packages/core/src/machine
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

/**
 * Drops keys whose value is `undefined`. Zag spreads machine props over its
 * defaults, so an explicit `undefined` would erase a default.
 *
 * @function definedOnly
 * @template {object} T
 * @param {T} props - Machine props.
 * @returns {T} The same props without undefined entries.
 */
export function definedOnly<T extends object>(props: T): T {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as T;
}
