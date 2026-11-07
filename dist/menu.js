/**
 * @fileoverview Menu entries: actions and separators, as plain data both
 * ports render.
 *
 * @module packages/core/src/menu
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Says whether an entry is a separator.
 *
 * @function isSeparator
 * @param {MenuEntry} entry - Entry.
 * @returns {boolean} True for a separator.
 */
export function isSeparator(entry) {
    return 'separator' in entry;
}
/**
 * Builds a stable key for an entry: its value, or its position for a rule.
 * Prefixes keep the two apart, so no value can collide with a rule.
 *
 * @function entryKey
 * @param {MenuEntry} entry - Entry.
 * @param {number} index - Position in the menu.
 * @returns {string} Key.
 */
export function entryKey(entry, index) {
    return isSeparator(entry) ? `separator:${index}` : `item:${entry.value}`;
}
