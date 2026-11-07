/**
 * @fileoverview Combobox rules shared by both ports: option matching, the
 * collection Zag reads, machine props, and the keys Zag leaves alone (Tab
 * completes the highlighted option; Enter on free text submits it).
 *
 * @module packages/core/src/combobox
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { RootNode } from './environment.js';
import type { EventNames } from './events.js';
import { type Placement } from './floating.js';
import { type ArkheLabels } from './labels.js';
/**
 * One choice.
 *
 * @interface ComboboxOption
 * @property {string} value - Key reported on select.
 * @property {string} label - Visible text; what typing matches.
 * @property {string} [description] - Second line; also matched.
 * @property {string} [group] - Heading the option sits under.
 * @property {boolean} [disabled] - Blocks selection.
 */
export interface ComboboxOption {
    readonly value: string;
    readonly label: string;
    readonly description?: string;
    readonly group?: string;
    readonly disabled?: boolean;
}
/**
 * Option filter: a predicate, or `false` when the host filters (server search).
 *
 * @typedef {((option: T, query: string) => boolean) | false} OptionFilter
 */
export type OptionFilter<T> = ((option: T, query: string) => boolean) | false;
/**
 * What a port passes to `comboboxMachineProps`.
 *
 * @interface ComboboxMachineInput
 * @property {string} id - Instance id.
 * @property {string} label - Visible label; names the clear button.
 * @property {ArkheLabels} labels - Label templates.
 * @property {string} [locale] - BCP 47 locale of the announced count. Defaults to `DEFAULT_LOCALE`.
 * @property {string | null} [value] - Selected value; makes the selection controlled.
 * @property {string | null} [defaultValue] - First selection when uncontrolled.
 * @property {boolean} [clearOnSelect] - Picker mode: report the choice, then empty the input.
 * @property {boolean} [submits] - The host takes free text on Enter, so nothing is highlighted until the user moves.
 * @property {boolean} [loading] - Results are on their way.
 * @property {boolean} [disabled] - Blocks input.
 * @property {string} [placeholder] - Input placeholder.
 * @property {Placement} [placement] - Side of the list. Defaults to `bottom-start`.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface ComboboxMachineInput {
    readonly id: string;
    readonly label: string;
    readonly labels: ArkheLabels;
    readonly locale?: string;
    readonly value?: string | null;
    readonly defaultValue?: string | null;
    readonly clearOnSelect?: boolean;
    readonly submits?: boolean;
    readonly loading?: boolean;
    readonly disabled?: boolean;
    readonly placeholder?: string;
    readonly placement?: Placement;
    readonly getRootNode: () => RootNode;
}
/**
 * Default match: the folded query occurs in the label or description.
 *
 * @function matchOption
 * @param {ComboboxOption} option - Option.
 * @param {string} query - Typed text.
 * @returns {boolean} True on a match.
 */
export declare function matchOption(option: ComboboxOption, query: string): boolean;
/**
 * Narrows `options` to those matching `query`. An empty query, or a `false`
 * filter, keeps them all. An option repeating an earlier value is dropped.
 *
 * @function filterOptions
 * @template {ComboboxOption} T
 * @param {readonly T[]} options - All options.
 * @param {string} query - Typed text.
 * @param {OptionFilter<T>} [filter] - Match rule. Defaults to `matchOption`.
 * @returns {T[]} Matching options, in order.
 */
export declare function filterOptions<T extends ComboboxOption>(options: readonly T[], query: string, filter?: OptionFilter<T>): T[];
/**
 * Returns the text to filter by after an input change: typed text filters;
 * text written by a selection or a clear shows every option again.
 *
 * @function queryAfterChange
 * @param {{ inputValue: string, reason?: string }} details - Zag change details.
 * @returns {string} Filter query.
 */
export declare function queryAfterChange(details: {
    inputValue: string;
    reason?: string;
}): string;
/**
 * Says whether any option names a group, so the list shows headings.
 *
 * @function isGrouped
 * @param {readonly ComboboxOption[]} options - Shown options.
 * @returns {boolean} True when grouped.
 */
export declare function isGrouped(options: readonly ComboboxOption[]): boolean;
/**
 * Options for Zag's `combobox.collection`. Groups only when an option names one.
 *
 * @function optionCollection
 * @template {ComboboxOption} T
 * @param {readonly T[]} options - Shown options.
 * @returns {object} Collection options.
 */
export declare function optionCollection<T extends ComboboxOption>(options: readonly T[]): {
    items: T[];
    itemToValue: (option: T) => string;
    itemToString: (option: T) => string;
    isItemDisabled: (option: T) => boolean;
    groupBy: ((option: T) => string) | undefined;
};
/**
 * Builds Zag combobox machine props, minus the collection and callbacks.
 *
 * @function comboboxMachineProps
 * @param {ComboboxMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export declare function comboboxMachineProps(input: ComboboxMachineInput): {
    value: string[] | undefined;
    defaultValue: string[] | undefined;
    selectionBehavior: "clear" | "replace";
    inputBehavior: "none" | "autohighlight";
    openOnClick: boolean;
    loopFocus: boolean;
    loading: boolean | undefined;
    disabled: boolean | undefined;
    placeholder: string | undefined;
    translations: {
        triggerLabel: string;
        clearTriggerLabel: string;
        noResults: string;
        loading: string;
        resultsCount: (count: number) => string;
    };
    id: string;
    open: boolean | undefined;
    defaultOpen: boolean | undefined;
    onOpenChange: (details: {
        open: boolean;
    }) => void;
    positioning: {
        placement: Placement | undefined;
        strategy: "absolute" | "fixed" | undefined;
        gutter: number;
    };
    getRootNode: () => RootNode;
};
/**
 * What `guardComboboxKeys` reads and calls.
 *
 * @interface ComboboxKeyActions
 * @property {() => string | null} highlighted - Highlighted value, if any.
 * @property {() => string} inputValue - Current text.
 * @property {(value: string) => void} select - Selects a value.
 * @property {() => void} close - Closes the list and clears the highlight.
 * @property {(text: string) => void} [submit] - Takes free text on Enter.
 */
export interface ComboboxKeyActions {
    readonly highlighted: () => string | null;
    readonly inputValue: () => string;
    readonly select: (value: string) => void;
    readonly close: () => void;
    readonly submit?: (text: string) => void;
}
/**
 * Wraps Zag's input props. Tab with an option highlighted completes it,
 * closes the list and keeps focus, so the next Tab moves on; Enter with
 * nothing highlighted hands the text to `submit`.
 *
 * @function guardComboboxKeys
 * @template {object} P
 * @param {P} props - Zag input props.
 * @param {ComboboxKeyActions} actions - Reads and actions.
 * @param {EventNames} names - Framework event prop names.
 * @returns {P} Wrapped props.
 */
export declare function guardComboboxKeys<P extends object>(props: P, actions: ComboboxKeyActions, names: EventNames): P;
