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
import { clampToBounds, toNumericValue, } from './numeric.js';
/**
 * Says whether two field values are the same, treating -0 and 0 apart.
 *
 * @function sameValue
 * @param {NumericValue} a - First value.
 * @param {NumericValue} b - Second value.
 * @returns {boolean} True when equal.
 */
function sameValue(a, b) {
    return a === b || (a !== null && b !== null && Object.is(a, b));
}
/**
 * Sync state for one field. Ports call `emit` and `commit` from Zag's
 * callbacks, `receive` when the controlled value changes, and `focus` and
 * `blur` from the input.
 *
 * @class NumericSync
 */
export class NumericSync {
    api;
    controlled;
    awaitingAnswer = false;
    focused = false;
    silent = 0;
    /**
     * @param {() => NumericMachineApi} api - Returns the live Zag API.
     */
    constructor(api) {
        this.api = api;
    }
    /**
     * Reports a draft change, unless the change came from `receive` or
     * `blur`. Zag's React binding runs a sent event in a later microtask, so
     * the silence lasts until the microtask after the send.
     *
     * @param {number} valueAsNumber - Parsed draft.
     * @param {(value: NumericValue) => void} [onValueChange] - Host callback.
     * @returns {void}
     */
    emit(valueAsNumber, onValueChange) {
        if (this.silent > 0)
            return;
        this.awaitingAnswer = this.controlled !== undefined;
        onValueChange?.(toNumericValue(valueAsNumber));
    }
    /**
     * Reports a committed value, clamped. Zag's React binding reports the
     * pre-clamp number when blur clamps (field shows 10, commit says 710).
     *
     * @param {number} valueAsNumber - Parsed draft.
     * @param {(value: NumericValue) => void} [onValueCommit] - Host callback.
     * @param {NumericBounds} [bounds] - Limits.
     * @returns {void}
     */
    commit(valueAsNumber, onValueCommit, bounds = {}) {
        onValueCommit?.(clampToBounds(toNumericValue(valueAsNumber), bounds));
    }
    /**
     * Takes a new controlled value. While focused, the answer to the field's
     * own change is held until blur.
     *
     * @param {NumericValue | undefined} value - Controlled value.
     * @returns {void}
     */
    receive(value) {
        this.controlled = value;
        if (value === undefined || sameValue(value, this.current())) {
            this.awaitingAnswer = false;
            return;
        }
        if (this.focused && this.awaitingAnswer) {
            this.awaitingAnswer = false;
            return;
        }
        this.apply(value);
    }
    /**
     * Marks the input focused.
     *
     * @returns {void}
     */
    focus() {
        this.focused = true;
    }
    /**
     * Marks the input blurred and applies any held controlled value.
     *
     * @returns {void}
     */
    blur() {
        this.focused = false;
        this.awaitingAnswer = false;
        const value = this.controlled;
        if (value !== undefined && !sameValue(value, this.current())) {
            this.apply(value);
        }
    }
    current() {
        return toNumericValue(this.api().valueAsNumber);
    }
    apply(value) {
        this.silent += 1;
        try {
            if (value === null)
                this.api().clearValue();
            else
                this.api().setValue(value);
        }
        finally {
            queueMicrotask(() => {
                this.silent -= 1;
            });
        }
    }
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
export function guardInputProps(props, bounds, sync, names) {
    const record = { ...props };
    const zagFocus = record[names.focus];
    const zagBlur = record[names.blur];
    const zagKeydown = record[names.keydown];
    if (bounds.min === undefined)
        delete record['aria-valuemin'];
    if (bounds.max === undefined)
        delete record['aria-valuemax'];
    record[names.focus] = (event) => {
        zagFocus?.(event);
        sync.focus();
    };
    record[names.blur] = (event) => {
        zagBlur?.(event);
        sync.blur();
    };
    record[names.keydown] = (event) => {
        if (event.key === 'Home' && bounds.min === undefined)
            return;
        if (event.key === 'End' && bounds.max === undefined)
            return;
        zagKeydown?.(event);
    };
    return record;
}
