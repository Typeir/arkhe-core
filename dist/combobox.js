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
import { floatingMachineProps } from './floating.js';
import { formatLabel } from './labels.js';
import { definedOnly, uniqueByValue } from './machine.js';
/**
 * Lowercases and strips accents, so "paa" finds "Pää".
 *
 * @function fold
 * @param {string} text - Input.
 * @returns {string} Folded text.
 */
function fold(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
/**
 * Default match: the folded query occurs in the label or description.
 *
 * @function matchOption
 * @param {ComboboxOption} option - Option.
 * @param {string} query - Typed text.
 * @returns {boolean} True on a match.
 */
export function matchOption(option, query) {
    const needle = fold(query.trim()) || query.trim();
    return (fold(option.label).includes(needle) ||
        fold(option.description ?? '').includes(needle));
}
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
export function filterOptions(options, query, filter = matchOption) {
    const unique = uniqueByValue(options);
    if (filter === false || !query.trim())
        return unique;
    return unique.filter((option) => filter(option, query));
}
/**
 * Returns the text to filter by after an input change: typed text filters;
 * text written by a selection or a clear shows every option again.
 *
 * @function queryAfterChange
 * @param {{ inputValue: string, reason?: string }} details - Zag change details.
 * @returns {string} Filter query.
 */
export function queryAfterChange(details) {
    return details.reason === 'input-change' ? details.inputValue : '';
}
/**
 * Says whether any option names a group, so the list shows headings.
 *
 * @function isGrouped
 * @param {readonly ComboboxOption[]} options - Shown options.
 * @returns {boolean} True when grouped.
 */
export function isGrouped(options) {
    return options.some((option) => option.group !== undefined);
}
/**
 * Options for Zag's `combobox.collection`. Groups only when an option names one.
 *
 * @function optionCollection
 * @template {ComboboxOption} T
 * @param {readonly T[]} options - Shown options.
 * @returns {object} Collection options.
 */
export function optionCollection(options) {
    return definedOnly({
        items: [...options],
        itemToValue: (option) => option.value,
        itemToString: (option) => option.label,
        isItemDisabled: (option) => Boolean(option.disabled),
        groupBy: isGrouped(options) ? (option) => option.group ?? '' : undefined,
    });
}
/**
 * Builds Zag combobox machine props, minus the collection and callbacks.
 *
 * @function comboboxMachineProps
 * @param {ComboboxMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function comboboxMachineProps(input) {
    const toArray = (value) => value === undefined ? undefined : value === null ? [] : [value];
    const { labels } = input;
    return definedOnly({
        ...floatingMachineProps({
            id: input.id,
            placement: input.placement ?? 'bottom-start',
            getRootNode: input.getRootNode,
        }),
        value: toArray(input.value),
        defaultValue: toArray(input.defaultValue),
        selectionBehavior: input.clearOnSelect
            ? 'clear'
            : 'replace',
        inputBehavior: input.submits
            ? 'none'
            : 'autohighlight',
        openOnClick: true,
        loopFocus: true,
        loading: input.loading,
        disabled: input.disabled,
        placeholder: input.placeholder,
        translations: {
            triggerLabel: labels.comboboxTrigger,
            clearTriggerLabel: formatLabel(labels.comboboxClear, {
                label: input.label,
            }),
            noResults: labels.comboboxEmpty,
            loading: labels.loading,
            resultsCount: (count) => formatLabel(count === 1 ? labels.resultOne : labels.resultMany, {
                count,
            }),
        },
    });
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
export function guardComboboxKeys(props, actions, names) {
    const record = { ...props };
    const zagKeydown = record[names.keydown];
    record[names.keydown] = (event) => {
        const native = event.nativeEvent ?? event;
        if (native.isComposing || native.keyCode === 229) {
            zagKeydown?.(event);
            return;
        }
        const highlighted = actions.highlighted();
        if (event.key === 'Tab' && !event.shiftKey && highlighted !== null) {
            event.preventDefault();
            actions.select(highlighted);
            actions.close();
            return;
        }
        if (event.key === 'Enter' && highlighted === null && actions.submit) {
            event.preventDefault();
            actions.submit(actions.inputValue());
            return;
        }
        zagKeydown?.(event);
    };
    return record;
}
