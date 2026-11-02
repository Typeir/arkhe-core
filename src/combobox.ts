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
import { floatingMachineProps, type Placement } from './floating.js';
import { formatLabel, type ArkheLabels } from './labels.js';
import { definedOnly, uniqueByValue } from './machine.js';

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
 * Lowercases and strips accents, so "paa" finds "Pää".
 *
 * @function fold
 * @param {string} text - Input.
 * @returns {string} Folded text.
 */
function fold(text: string): string {
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
export function matchOption(option: ComboboxOption, query: string): boolean {
  const needle = fold(query.trim()) || query.trim();
  return (
    fold(option.label).includes(needle) ||
    fold(option.description ?? '').includes(needle)
  );
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
export function filterOptions<T extends ComboboxOption>(
  options: readonly T[],
  query: string,
  filter: OptionFilter<T> = matchOption,
): T[] {
  const unique = uniqueByValue(options);
  if (filter === false || !query.trim()) return unique;
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
export function queryAfterChange(details: {
  inputValue: string;
  reason?: string;
}): string {
  return details.reason === 'input-change' ? details.inputValue : '';
}

/**
 * Says whether any option names a group, so the list shows headings.
 *
 * @function isGrouped
 * @param {readonly ComboboxOption[]} options - Shown options.
 * @returns {boolean} True when grouped.
 */
export function isGrouped(options: readonly ComboboxOption[]): boolean {
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
export function optionCollection<T extends ComboboxOption>(
  options: readonly T[],
) {
  return definedOnly({
    items: [...options],
    itemToValue: (option: T) => option.value,
    itemToString: (option: T) => option.label,
    isItemDisabled: (option: T) => Boolean(option.disabled),
    groupBy: isGrouped(options) ? (option: T) => option.group ?? '' : undefined,
  });
}

/**
 * Builds Zag combobox machine props, minus the collection and callbacks.
 *
 * @function comboboxMachineProps
 * @param {ComboboxMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function comboboxMachineProps(input: ComboboxMachineInput) {
  const toArray = (value: string | null | undefined) =>
    value === undefined ? undefined : value === null ? [] : [value];
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
      ? ('clear' as const)
      : ('replace' as const),
    inputBehavior: input.submits
      ? ('none' as const)
      : ('autohighlight' as const),
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
      resultsCount: (count: number) =>
        formatLabel(count === 1 ? labels.resultOne : labels.resultMany, {
          count,
        }),
    },
  });
}

/**
 * What `guardComboboxKeys` reads and calls.
 *
 * @interface ComboboxKeyActions
 * @property {() => string | null} highlighted - Highlighted value, if any.
 * @property {() => string} inputValue - Current text.
 * @property {(value: string) => void} select - Selects a value.
 * @property {(text: string) => void} [submit] - Takes free text on Enter.
 */
export interface ComboboxKeyActions {
  readonly highlighted: () => string | null;
  readonly inputValue: () => string;
  readonly select: (value: string) => void;
  readonly submit?: (text: string) => void;
}

/**
 * Wraps Zag's input props. Tab with an option highlighted completes it and
 * keeps focus; Enter with nothing highlighted hands the text to `submit`.
 *
 * @function guardComboboxKeys
 * @template {object} P
 * @param {P} props - Zag input props.
 * @param {ComboboxKeyActions} actions - Reads and actions.
 * @param {EventNames} names - Framework event prop names.
 * @returns {P} Wrapped props.
 */
export function guardComboboxKeys<P extends object>(
  props: P,
  actions: ComboboxKeyActions,
  names: EventNames,
): P {
  const record = { ...props } as Record<string, unknown>;
  const zagKeydown = record[names.keydown] as
    ((event: KeyboardEvent) => void) | undefined;
  record[names.keydown] = (event: KeyboardEvent) => {
    const native =
      (event as { nativeEvent?: KeyboardEvent }).nativeEvent ?? event;
    if (native.isComposing || native.keyCode === 229) {
      zagKeydown?.(event);
      return;
    }
    const highlighted = actions.highlighted();
    if (event.key === 'Tab' && !event.shiftKey && highlighted !== null) {
      event.preventDefault();
      actions.select(highlighted);
      return;
    }
    if (event.key === 'Enter' && highlighted === null && actions.submit) {
      event.preventDefault();
      actions.submit(actions.inputValue());
      return;
    }
    zagKeydown?.(event);
  };
  return record as P;
}
