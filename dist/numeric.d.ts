/**
 * @fileoverview Number field rules shared by both ports. Zag holds the draft
 * text; the outside world sees a number or `null`. `NumericSync` keeps a
 * controlled value and Zag's draft in step without eating keystrokes.
 *
 * @module packages/core/src/numeric
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { RootNode } from './environment.js';
import { type ArkheLabels } from './labels.js';
/**
 * A field's value: a number, or `null` when empty or unparseable.
 *
 * @typedef {number | null} NumericValue
 */
export type NumericValue = number | null;
/**
 * Optional limits.
 *
 * @interface NumericBounds
 * @property {number} [min] - Lowest value.
 * @property {number} [max] - Highest value.
 */
export interface NumericBounds {
    readonly min?: number;
    readonly max?: number;
}
/**
 * The slice of Zag's number-input API that `NumericSync` drives.
 *
 * @interface NumericMachineApi
 * @property {number} valueAsNumber - Parsed draft; NaN when empty.
 * @property {(value: number) => void} setValue - Replaces the draft.
 * @property {() => void} clearValue - Empties the draft.
 */
export interface NumericMachineApi {
    readonly valueAsNumber: number;
    setValue(value: number): void;
    clearValue(): void;
}
/**
 * What a port passes to `numericMachineProps`.
 *
 * @interface NumericMachineInput
 * @property {string} id - Instance id.
 * @property {string} label - Visible label; names the step buttons.
 * @property {ArkheLabels} labels - Label templates.
 * @property {NumericValue} [value] - Controlled value.
 * @property {NumericValue} [defaultValue] - First value when uncontrolled.
 * @property {number} [min] - Lowest value.
 * @property {number} [max] - Highest value.
 * @property {number} [step] - Step size.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface NumericMachineInput extends NumericBounds {
    readonly id: string;
    readonly label: string;
    readonly labels: ArkheLabels;
    readonly value?: NumericValue;
    readonly defaultValue?: NumericValue;
    readonly step?: number;
    readonly getRootNode: () => RootNode;
}
/**
 * Maps Zag's parsed number to a field value.
 *
 * @function toNumericValue
 * @param {number} valueAsNumber - Parsed draft.
 * @returns {NumericValue} Number, or null for NaN.
 */
export declare function toNumericValue(valueAsNumber: number): NumericValue;
/**
 * Renders a field value as draft text.
 *
 * @function formatDraft
 * @param {NumericValue | undefined} value - Field value.
 * @returns {string} Draft; empty for null or undefined.
 */
export declare function formatDraft(value: NumericValue | undefined): string;
/**
 * Clamps a value into `bounds`; null passes through. A missing or non-finite
 * bound falls back to Zag's own default, the safe-integer range.
 *
 * @function clampToBounds
 * @param {NumericValue} value - Field value.
 * @param {NumericBounds} bounds - Limits.
 * @returns {NumericValue} Clamped value.
 */
export declare function clampToBounds(value: NumericValue, bounds: NumericBounds): NumericValue;
/**
 * Builds Zag number-input machine props, with Arkhé's step button names.
 *
 * @function numericMachineProps
 * @param {NumericMachineInput} input - Port input.
 * @returns {object} Machine props, minus change callbacks.
 */
export declare function numericMachineProps(input: NumericMachineInput): {
    id: string;
    defaultValue: string;
    min: number | undefined;
    max: number | undefined;
    step: number | undefined;
    translations: {
        incrementLabel: string;
        decrementLabel: string;
    };
    getRootNode: () => RootNode;
};
