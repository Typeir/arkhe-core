/**
 * @fileoverview Content equality for the plain objects an app hands the
 * provider (labels, icon sets), so a literal written inline counts as the
 * same value while its contents are.
 *
 * @module packages/core/src/base/sameRecord
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

/**
 * Says whether `value` is a plain object: made by a literal or with a null
 * prototype, not a class instance, function or array.
 *
 * @function isPlain
 * @param {unknown} value - Any value.
 * @returns {boolean} True for a plain object.
 */
function isPlain(value: unknown): value is Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}

/**
 * Compares two records by their own keys. Values compare with `Object.is`,
 * except plain objects, which compare the same way one level further, so a
 * plural label set written inline still matches.
 *
 * @function sameRecord
 * @param {object | undefined} a - First record.
 * @param {object | undefined} b - Second record.
 * @param {number} [depth] - Levels of plain objects to look into.
 * @returns {boolean} True when both hold the same entries.
 */
export function sameRecord(
  a: object | undefined,
  b: object | undefined,
  depth = 1,
): boolean {
  if (Object.is(a, b)) return true;
  if (!isPlain(a) || !isPlain(b)) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => {
    if (!Object.hasOwn(b, key)) return false;
    const left = a[key];
    const right = b[key];
    if (Object.is(left, right)) return true;
    return (
      depth > 0 && isPlain(left) && sameRecord(left, right as object, depth - 1)
    );
  });
}
