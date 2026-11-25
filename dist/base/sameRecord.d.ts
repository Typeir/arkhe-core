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
 * Compares two records by their own keys. Values compare with `Object.is`,
 * except plain objects, which compare the same way one level further, so a
 * plural label set written inline still matches.
 *
 * @function sameRecord
 * @param {object | undefined} first - First record.
 * @param {object | undefined} second - Second record.
 * @param {number} [depth] - Levels of plain objects to look into.
 * @returns {boolean} True when both hold the same entries.
 */
export declare function sameRecord(first: object | undefined, second: object | undefined, depth?: number): boolean;
