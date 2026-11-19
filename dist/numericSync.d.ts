/**
 * @fileoverview Keeps a controlled number field and Zag's draft in step.
 * The parent's answer to the field's own change waits until blur, so a
 * parent that clamps or rounds cannot eat keystrokes mid-typing.
 *
 * @module packages/core/src/numericSync
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { type NumericBounds, type NumericMachineApi, type NumericValue } from './numeric.js';
import type { EventNames } from './events.js';
/**
 * Sync state for one field. Ports call `emit` and `commit` from Zag's
 * callbacks, `receive` when the controlled value changes, and `focus` and
 * `blur` from the input.
 *
 * @class NumericSync
 */
export declare class NumericSync {
    private readonly api;
    private controlled;
    private awaitingAnswer;
    private focused;
    private silent;
    /**
     * @param {() => NumericMachineApi} api - Returns the live Zag API.
     */
    constructor(api: () => NumericMachineApi);
    /**
     * Reports a draft change, unless the change came from `receive` or
     * `blur`. Zag's React binding runs a sent event in a later microtask, so
     * the silence lasts until the microtask after the send.
     *
     * @param {number} valueAsNumber - Parsed draft.
     * @param {(value: NumericValue) => void} [onValueChange] - Host callback.
     * @returns {void}
     */
    emit(valueAsNumber: number, onValueChange?: (value: NumericValue) => void): void;
    /**
     * Reports a committed value, clamped. Zag's React binding reports the
     * pre-clamp number when blur clamps (field shows 10, commit says 710).
     *
     * @param {number} valueAsNumber - Parsed draft.
     * @param {(value: NumericValue) => void} [onValueCommit] - Host callback.
     * @param {NumericBounds} [bounds] - Limits.
     * @returns {void}
     */
    commit(valueAsNumber: number, onValueCommit?: (value: NumericValue) => void, bounds?: NumericBounds): void;
    /**
     * Takes a new controlled value. While focused, the answer to the field's
     * own change is held until blur.
     *
     * @param {NumericValue | undefined} value - Controlled value.
     * @returns {void}
     */
    receive(value: NumericValue | undefined): void;
    /**
     * Marks the input focused.
     *
     * @returns {void}
     */
    focus(): void;
    /**
     * Marks the input blurred and applies any held controlled value.
     *
     * @returns {void}
     */
    blur(): void;
    private current;
    private apply;
}
/**
 * Wraps Zag's input props: reports focus and blur to `sync`, drops
 * `aria-valuemin`/`max` for missing bounds, and keeps Home and End as caret
 * moves when unbounded (Zag would jump to ±MAX_SAFE_INTEGER).
 *
 * @function guardInputProps
 * @template {object} P
 * @param {P} props - Zag input props.
 * @param {NumericBounds} bounds - Limits.
 * @param {NumericSync} sync - Field sync.
 * @param {EventNames} names - Framework event prop names.
 * @returns {P} Wrapped props.
 */
export declare function guardInputProps<P extends object>(props: P, bounds: NumericBounds, sync: NumericSync, names: EventNames): P;
