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

/**
 * Keeps the first item for each value and drops later repeats. Zag keys
 * items, ids and selection by value, and Svelte's keyed each throws on a
 * repeated key, so both ports render the same unique list.
 *
 * @function uniqueByValue
 * @template {{ value: unknown }} T
 * @param {readonly T[]} items - Items, possibly with repeated values.
 * @returns {T[]} Items with unique values, in order.
 */
export function uniqueByValue<T extends { readonly value: unknown }>(
  items: readonly T[],
): T[] {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}
