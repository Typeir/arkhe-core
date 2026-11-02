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
 * One action.
 *
 * @interface MenuItem
 * @property {string} value - Key reported on select.
 * @property {string} label - Visible text.
 * @property {string} [icon] - Lucide name of a leading icon.
 * @property {boolean} [disabled] - Blocks selection.
 * @property {boolean} [danger] - Marks a destructive action.
 */
export interface MenuItem {
  readonly value: string;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
  readonly danger?: boolean;
}

/**
 * A rule between groups of actions.
 *
 * @interface MenuSeparator
 * @property {true} separator - Marks the entry as a rule.
 */
export interface MenuSeparator {
  readonly separator: true;
}

/**
 * A menu entry.
 *
 * @typedef {MenuItem | MenuSeparator} MenuEntry
 */
export type MenuEntry = MenuItem | MenuSeparator;

/**
 * Says whether an entry is a separator.
 *
 * @function isSeparator
 * @param {MenuEntry} entry - Entry.
 * @returns {boolean} True for a separator.
 */
export function isSeparator(entry: MenuEntry): entry is MenuSeparator {
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
export function entryKey(entry: MenuEntry, index: number): string {
  return isSeparator(entry) ? `separator:${index}` : `item:${entry.value}`;
}
