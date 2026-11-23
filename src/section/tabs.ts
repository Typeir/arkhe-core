/**
 * @fileoverview Tabs rules shared by both ports: stable element ids from any
 * value, a fallback when the value matches no tab or the selected tab goes
 * away, and Zag machine props.
 *
 * @module packages/core/src/section/tabs
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { RootNode } from '../base/environment.js';
import { watchFindable } from '../base/dom.js';
import { definedOnly } from '../base/machine.js';

/**
 * One tab.
 *
 * @interface TabItem
 * @property {string} value - Key; any text.
 * @property {string} label - Visible name.
 * @property {boolean} [disabled] - Blocks selection.
 */
export interface TabItem {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * What a port passes to `tabsMachineProps`.
 *
 * @interface TabsMachineInput
 * @property {string} id - Instance id.
 * @property {readonly TabItem[]} items - Tabs, in order.
 * @property {string} label - Accessible name of the tab list.
 * @property {string} [value] - Selected value; makes the tabs controlled.
 * @property {string} [defaultValue] - First value when uncontrolled.
 * @property {(value: string) => void} [onValueChange] - Selection callback.
 * @property {Set<string>} [warned] - Unknown values this instance warned about; the port keeps one per instance.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface TabsMachineInput {
  readonly id: string;
  readonly items: readonly TabItem[];
  readonly label: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly warned?: Set<string>;
  readonly getRootNode: () => RootNode;
}

/**
 * Hashes text to a short base-36 string (djb2).
 *
 * @function hash
 * @param {string} text - Input.
 * @returns {string} Hash.
 */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

/**
 * Turns any value into an id-safe slug. The hash keeps values that slug
 * alike ("A b", "a-b") apart.
 *
 * @function slug
 * @param {string} value - Tab value.
 * @returns {string} Slug.
 */
export function slug(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'tab'}-${hash(value)}`;
}

/**
 * Element ids for Zag, so a trigger and its panel always pair up.
 *
 * @function tabIds
 * @param {string} id - Instance id.
 * @returns {{ trigger: (value: string) => string, content: (value: string) => string }} Id builders.
 */
export function tabIds(id: string): {
  trigger: (value: string) => string;
  content: (value: string) => string;
} {
  return {
    trigger: (value) => `${id}-trigger-${slug(value)}`,
    content: (value) => `${id}-content-${slug(value)}`,
  };
}

/**
 * Returns `value` when it names an enabled tab, else the first enabled tab.
 * Warns once per unknown value held in `warned`; without it, every call
 * with an unknown value warns.
 *
 * @function resolveTabValue
 * @param {string | undefined} value - Requested value.
 * @param {readonly TabItem[]} items - Tabs.
 * @param {Set<string>} [warned] - Unknown values already warned about.
 * @returns {string | null} Value to show; null when no tab is enabled.
 */
export function resolveTabValue(
  value: string | undefined,
  items: readonly TabItem[],
  warned: Set<string> = new Set(),
): string | null {
  const enabled = items.filter((item) => !item.disabled);
  if (value !== undefined && enabled.some((item) => item.value === value)) {
    return value;
  }
  const fallback = enabled[0]?.value ?? null;
  if (value !== undefined && !warned.has(value)) {
    warned.add(value);
    console.warn(
      `[arkhe] Tabs value "${value}" matches no enabled tab; showing "${fallback}".`,
    );
  }
  return fallback;
}

/**
 * Says where uncontrolled tabs must move when `items` change under them:
 * the first enabled tab once `current` is gone or disabled, else nothing.
 *
 * @function staleTabFallback
 * @param {string | null | undefined} current - Value Zag shows now.
 * @param {readonly TabItem[]} items - Current tabs.
 * @returns {string | null} Value to select, or null to stay put.
 */
export function staleTabFallback(
  current: string | null | undefined,
  items: readonly TabItem[],
): string | null {
  const enabled = items.filter((item) => !item.disabled);
  if (enabled.some((item) => item.value === current)) return null;
  return enabled[0]?.value ?? null;
}

/**
 * Zag tabs machine props.
 *
 * @interface TabsMachineProps
 * @property {string} id - Instance id.
 * @property {ReturnType<typeof tabIds>} ids - Trigger and panel ids by value.
 * @property {string | null} [value] - Controlled tab; null for none.
 * @property {string | null} [defaultValue] - First tab when uncontrolled; null for none.
 * @property {{ listLabel: string }} translations - Tab list name.
 * @property {(details: { value: string }) => void} onValueChange - Zag's change callback.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface TabsMachineProps {
  readonly id: string;
  readonly ids: ReturnType<typeof tabIds>;
  readonly value?: string | null;
  readonly defaultValue?: string | null;
  readonly translations: { readonly listLabel: string };
  readonly onValueChange: (details: { value: string }) => void;
  readonly getRootNode: () => RootNode;
}

/**
 * Builds Zag tabs machine props.
 *
 * @function tabsMachineProps
 * @param {TabsMachineInput} input - Port input.
 * @returns {TabsMachineProps} Machine props.
 */
export function tabsMachineProps(input: TabsMachineInput): TabsMachineProps {
  const controlled = input.value !== undefined;
  return definedOnly({
    id: input.id,
    ids: tabIds(input.id),
    value: controlled
      ? resolveTabValue(input.value, input.items, input.warned)
      : undefined,
    defaultValue: controlled
      ? undefined
      : resolveTabValue(input.defaultValue, input.items, input.warned),
    translations: { listLabel: input.label },
    onValueChange: (details: { value: string }) =>
      input.onValueChange?.(details.value),
    getRootNode: input.getRootNode,
  });
}

/**
 * Lets find-in-page reach the panels of enabled tabs. Each panel marked
 * `data-findable` that the framework hides with plain `hidden` becomes
 * `hidden="until-found"`, which the browser can reveal; when it does, it
 * fires `beforematch` and `onFound` hears that panel's `data-value`.
 *
 * @function findablePanels
 * @param {HTMLElement} root - Tabs root; panels are its children.
 * @param {(value: string) => void} onFound - Selects the found tab.
 * @returns {() => void} Stops watching.
 */
export function findablePanels(
  root: HTMLElement,
  onFound: (value: string) => void,
): () => void {
  return watchFindable(root, (panel) => {
    const value = panel.dataset['value'];
    if (value !== undefined) onFound(value);
  });
}
