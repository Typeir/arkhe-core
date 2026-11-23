/**
 * @fileoverview Select rules shared by both ports: machine props for Zag's
 * select, a button that opens a list of options. The searchable Select runs
 * on the combobox machine instead (`combobox.ts`).
 *
 * @module packages/core/src/select/select
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */

import type { RootNode } from '../base/environment.js';
import { type ArkheLabels, formatLabel } from '../base/labels.js';
import { definedOnly, valueArray } from '../base/machine.js';
import {
  floatingMachineProps,
  type FloatingMachineProps,
  type Placement,
} from '../overlay/floating.js';

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
 * @property {boolean} [invalid] - Marks the control invalid.
 * @property {string} [autoComplete] - Autofill hint of the hidden native select, such as `country`.
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
  readonly invalid?: boolean;
  readonly autoComplete?: string;
  readonly disabled?: boolean;
  readonly placement?: Placement;
  readonly getRootNode: () => RootNode;
}

/**
 * Zag select machine props, minus the collection and callbacks.
 *
 * @interface SelectMachineProps
 * @property {string[]} [value] - Controlled selection.
 * @property {string[]} [defaultValue] - First selection when uncontrolled.
 * @property {string} [name] - Form field name.
 * @property {boolean} [required] - A value must be chosen.
 * @property {boolean} [invalid] - Marks the control invalid.
 * @property {string} [autoComplete] - Autofill hint.
 * @property {boolean} [disabled] - Blocks interaction.
 * @property {boolean} loopFocus - Arrows wrap at the ends.
 * @property {{ clearTriggerLabel: string }} translations - Clear button name.
 */
export interface SelectMachineProps extends FloatingMachineProps {
  readonly value?: string[];
  readonly defaultValue?: string[];
  readonly name?: string;
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly autoComplete?: string;
  readonly disabled?: boolean;
  readonly loopFocus: boolean;
  readonly translations: { readonly clearTriggerLabel: string };
}

/**
 * Builds Zag select machine props, minus the collection and callbacks.
 *
 * @function selectMachineProps
 * @param {SelectMachineInput} input - Port input.
 * @returns {SelectMachineProps} Machine props.
 */
export function selectMachineProps(
  input: SelectMachineInput,
): SelectMachineProps {
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
    invalid: input.invalid,
    autoComplete: input.autoComplete,
    disabled: input.disabled,
    loopFocus: true,
    translations: {
      clearTriggerLabel: formatLabel(input.labels.selectClear, {
        label: input.label,
      }),
    },
  });
}
