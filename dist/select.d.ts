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
import { type Placement } from './floating.js';
import { type ArkheLabels } from './labels.js';
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
 * Builds Zag select machine props, minus the collection and callbacks.
 *
 * @function selectMachineProps
 * @param {SelectMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export declare function selectMachineProps(input: SelectMachineInput): {
    value: string[] | undefined;
    defaultValue: string[] | undefined;
    name: string | undefined;
    required: boolean | undefined;
    invalid: boolean | undefined;
    autoComplete: string | undefined;
    disabled: boolean | undefined;
    loopFocus: boolean;
    translations: {
        clearTriggerLabel: string;
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
