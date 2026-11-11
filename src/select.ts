/**
 * @fileoverview Select rules shared by both ports: machine props for Zag's
 * select, a button that opens a list of options. The searchable Select runs
 * on the combobox machine instead (`combobox.ts`).
 *
 * @module packages/core/src/select
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */

import type { RootNode } from './environment.js';
import { floatingMachineProps, type Placement } from './floating.js';
import { formatLabel, type ArkheLabels } from './labels.js';
import { definedOnly, valueArray } from './machine.js';

/**
 * What a port passes to `selectMachineProps`.
 *
 * @interface SelectMachineInput
 * @property {string} id - Instance id.
 * @property {string} label - Visible label; names the clear button.
 * @property {ArkheLabels} labels - Label templates.
 * @property {string | null} [value] - Selected value; makes the selection controlled.
 * @property {string | null} [defaultValue] - First selection when uncontrolled.
 * @property {string} [name] - Form field name, carried by the hidden native select.
 * @property {boolean} [required] - A value must be chosen.
 * @property {boolean} [disabled] - Blocks interaction.
 * @property {Placement} [placement] - Side of the list. Defaults to `bottom-start`.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface SelectMachineInput {
  readonly id: string;
  readonly label: string;
  readonly labels: ArkheLabels;
  readonly value?: string | null;
  readonly defaultValue?: string | null;
  readonly name?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly placement?: Placement;
  readonly getRootNode: () => RootNode;
}

/**
 * Builds Zag select machine props, minus the collection and callbacks.
 *
 * @function selectMachineProps
 * @param {SelectMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function selectMachineProps(input: SelectMachineInput) {
  return definedOnly({
    ...floatingMachineProps({
      id: input.id,
      placement: input.placement ?? 'bottom-start',
      getRootNode: input.getRootNode,
    }),
    value: valueArray(input.value),
    defaultValue: valueArray(input.defaultValue),
    name: input.name,
    required: input.required,
    disabled: input.disabled,
    loopFocus: true,
    translations: {
      clearTriggerLabel: formatLabel(input.labels.comboboxClear, {
        label: input.label,
      }),
    },
  });
}
