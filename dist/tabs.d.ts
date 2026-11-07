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
import type { RootNode } from './environment.js';
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
 * Turns any value into an id-safe slug. The hash keeps values that slug
 * alike ("A b", "a-b") apart.
 *
 * @function slug
 * @param {string} value - Tab value.
 * @returns {string} Slug.
 */
export declare function slug(value: string): string;
/**
 * Element ids for Zag, so a trigger and its panel always pair up.
 *
 * @function tabIds
 * @param {string} id - Instance id.
 * @returns {{ trigger: (value: string) => string, content: (value: string) => string }} Id builders.
 */
export declare function tabIds(id: string): {
    trigger: (value: string) => string;
    content: (value: string) => string;
};
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
export declare function resolveTabValue(value: string | undefined, items: readonly TabItem[], warned?: Set<string>): string | undefined;
/**
 * Says where uncontrolled tabs must move when `items` change under them:
 * the first enabled tab once `current` is gone or disabled, else nothing.
 *
 * @function staleTabFallback
 * @param {string | null | undefined} current - Value Zag shows now.
 * @param {readonly TabItem[]} items - Current tabs.
 * @returns {string | undefined} Value to select, or undefined to stay put.
 */
export declare function staleTabFallback(current: string | null | undefined, items: readonly TabItem[]): string | undefined;
/**
 * Builds Zag tabs machine props.
 *
 * @function tabsMachineProps
 * @param {TabsMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export declare function tabsMachineProps(input: TabsMachineInput): {
    id: string;
    ids: {
        trigger: (value: string) => string;
        content: (value: string) => string;
    };
    value: string | undefined;
    defaultValue: string | undefined;
    translations: {
        listLabel: string;
    };
    onValueChange: (details: {
        value: string;
    }) => void | undefined;
    getRootNode: () => RootNode;
};
