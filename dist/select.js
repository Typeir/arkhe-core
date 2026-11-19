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
import { floatingMachineProps } from './floating.js';
import { formatLabel } from './labels.js';
import { definedOnly, valueArray } from './machine.js';
/**
 * Builds Zag select machine props, minus the collection and callbacks.
 *
 * @function selectMachineProps
 * @param {SelectMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function selectMachineProps(input) {
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
