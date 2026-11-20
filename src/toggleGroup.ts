/**
 * @fileoverview Toggle group rules shared by both ports: what a press does
 * to the pressed values, which items show under a limit, and the toolbar
 * attributes that let the browser's focusgroup move focus with arrows.
 *
 * @module packages/core/src/toggleGroup
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

/**
 * One toggle.
 *
 * @interface ToggleItem
 * @property {string} value - Key; any text.
 * @property {string} label - Accessible name; shown unless the port renders its own content.
 * @property {string} [icon] - Lucide name of a leading icon.
 * @property {boolean} [disabled] - Ignores presses; arrows still reach it.
 */
export interface ToggleItem {
  readonly value: string;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

/**
 * Which way the toggles run.
 *
 * @typedef {'horizontal' | 'vertical'} ToggleOrientation
 */
export type ToggleOrientation = 'horizontal' | 'vertical';

/**
 * How presses combine.
 *
 * @interface TogglePressRules
 * @property {boolean} [multiple] - Several items may be pressed at once.
 * @property {boolean} [deselectable] - A single pressed item may be released.
 */
export interface TogglePressRules {
  readonly multiple?: boolean;
  readonly deselectable?: boolean;
}

/**
 * Attributes of a toggle group root.
 *
 * @interface ToggleRootAttrs
 * @property {'toolbar'} role - Toolbar role; one tab stop.
 * @property {string} aria-label - Group name.
 * @property {'vertical' | undefined} aria-orientation - Set when vertical.
 * @property {string} focusgroup - Browser focus movement: wraps, along the block axis when vertical.
 * @property {ToggleOrientation} data-orientation - Direction.
 */
export interface ToggleRootAttrs {
  readonly role: 'toolbar';
  readonly 'aria-label': string;
  readonly 'aria-orientation': 'vertical' | undefined;
  readonly focusgroup: string;
  readonly 'data-orientation': ToggleOrientation;
}

/**
 * Builds the root attributes.
 *
 * @function toggleRootAttrs
 * @param {string} label - Group name.
 * @param {ToggleOrientation} [orientation] - Direction; horizontal by default.
 * @returns {ToggleRootAttrs} Root attributes.
 */
export function toggleRootAttrs(
  label: string,
  orientation: ToggleOrientation = 'horizontal',
): ToggleRootAttrs {
  const vertical = orientation === 'vertical';
  return {
    role: 'toolbar',
    'aria-label': label,
    'aria-orientation': vertical ? 'vertical' : undefined,
    focusgroup: vertical ? 'toolbar wrap block' : 'toolbar wrap',
    'data-orientation': orientation,
  };
}

/**
 * Returns the pressed values after a press on `item`. Several may stay
 * pressed under `multiple`; otherwise the press takes over, and a press on
 * the pressed item releases it only when `deselectable`.
 *
 * @function togglePress
 * @param {readonly string[]} pressed - Values pressed now.
 * @param {ToggleItem} item - Item pressed.
 * @param {TogglePressRules} rules - How presses combine.
 * @returns {readonly string[]} Values pressed after.
 */
export function togglePress(
  pressed: readonly string[],
  item: ToggleItem,
  rules: TogglePressRules,
): readonly string[] {
  if (item.disabled) return pressed;
  const on = pressed.includes(item.value);
  if (rules.multiple) {
    return on
      ? pressed.filter((value) => value !== item.value)
      : [...pressed, item.value];
  }
  if (!on) return [item.value];
  return rules.deselectable ? [] : pressed;
}

/**
 * Returns the items to draw: all of them when there is no limit or the
 * group is expanded, else the first `limit` plus every pressed item past
 * it, in order.
 *
 * @function toggleShown
 * @param {readonly ToggleItem[]} items - Items, in order.
 * @param {readonly string[]} pressed - Values pressed now.
 * @param {number | undefined} limit - Items shown while collapsed.
 * @param {boolean} expanded - True once the reader asked for more.
 * @returns {readonly ToggleItem[]} Items to draw.
 */
export function toggleShown(
  items: readonly ToggleItem[],
  pressed: readonly string[],
  limit: number | undefined,
  expanded: boolean,
): readonly ToggleItem[] {
  if (limit === undefined || expanded || items.length <= limit) return items;
  return items.filter(
    (item, index) => index < limit || pressed.includes(item.value),
  );
}
