/**
 * @fileoverview Tabs rules shared by both ports: stable element ids from any
 * value, a fallback when the value matches no tab or the selected tab goes
 * away, and Zag machine props.
 *
 * @module packages/core/src/tabs
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { definedOnly } from './machine.js';
/**
 * Hashes text to a short base-36 string (djb2).
 *
 * @function hash
 * @param {string} text - Input.
 * @returns {string} Hash.
 */
function hash(text) {
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
export function slug(value) {
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
export function tabIds(id) {
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
 * @returns {string | undefined} Value to show; undefined when no tab is enabled.
 */
export function resolveTabValue(value, items, warned = new Set()) {
    const enabled = items.filter((item) => !item.disabled);
    if (value !== undefined && enabled.some((item) => item.value === value)) {
        return value;
    }
    const fallback = enabled[0]?.value;
    if (value !== undefined && !warned.has(value)) {
        warned.add(value);
        console.warn(`[arkhe] Tabs value "${value}" matches no enabled tab; showing "${fallback}".`);
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
 * @returns {string | undefined} Value to select, or undefined to stay put.
 */
export function staleTabFallback(current, items) {
    const enabled = items.filter((item) => !item.disabled);
    if (enabled.some((item) => item.value === current))
        return undefined;
    return enabled[0]?.value;
}
/**
 * Builds Zag tabs machine props.
 *
 * @function tabsMachineProps
 * @param {TabsMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function tabsMachineProps(input) {
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
        onValueChange: (details) => input.onValueChange?.(details.value),
        getRootNode: input.getRootNode,
    });
}
