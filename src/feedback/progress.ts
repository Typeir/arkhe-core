/**
 * @fileoverview Progress maths: fill ratio, over-limit state and threshold
 * markers for a bar that may run past its maximum (budgets, XP, loads).
 *
 * @module packages/core/src/feedback/progress
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { formatLabel, type ArkheLabels } from '../base/labels.js';

/**
 * A threshold drawn on the track.
 *
 * @interface ProgressMarker
 * @property {number} at - Position along the track, [0, 1].
 * @property {boolean} reached - True when the value is at or past it.
 */
export interface ProgressMarker {
  readonly at: number;
  readonly reached: boolean;
}

/**
 * Everything a port needs to draw a progress bar.
 *
 * @interface ProgressState
 * @property {number} value - Value as drawn; non-finite input reads as 0.
 * @property {boolean} indeterminate - No value given: the amount is unknown.
 * @property {number} ratio - Fill, [0, 1].
 * @property {boolean} over - True when the value exceeds the maximum.
 * @property {number} overBy - Amount past the maximum; 0 when not over.
 * @property {readonly ProgressMarker[]} markers - Thresholds inside (0, max).
 */
export interface ProgressState {
  readonly value: number;
  readonly indeterminate: boolean;
  readonly ratio: number;
  readonly over: boolean;
  readonly overBy: number;
  readonly markers: readonly ProgressMarker[];
}

/**
 * Computes the bar for `value` out of `max`. Markers outside (0, max),
 * repeated markers and non-finite inputs are dropped. No value means the
 * amount is unknown: nothing is reached and nothing is over.
 *
 * @function progressState
 * @param {number | undefined} value - Current amount; none when unknown.
 * @param {number} max - Amount that fills the bar; must be > 0.
 * @param {readonly number[]} [markers] - Thresholds, in the value's units.
 * @returns {ProgressState} Bar state.
 * @throws {RangeError} When `max` is not a positive finite number.
 */
export function progressState(
  value: number | undefined,
  max: number,
  markers: readonly number[] = [],
): ProgressState {
  if (!(max > 0) || !Number.isFinite(max)) {
    throw new RangeError(`Progress max must be a positive number: ${max}.`);
  }
  const safe = value !== undefined && Number.isFinite(value) ? value : 0;
  return {
    value: safe,
    indeterminate: value === undefined,
    ratio: Math.min(1, Math.max(0, safe / max)),
    over: safe > max,
    overBy: Math.max(0, Number((safe - max).toPrecision(12))),
    markers: [...new Set(markers)]
      .filter((at) => Number.isFinite(at) && at > 0 && at < max)
      .map((at) => ({ at: at / max, reached: safe >= at })),
  };
}

/**
 * Returns the announced value text of a progress bar, from the state
 * `progressState` already computed.
 *
 * @function progressValueText
 * @param {ProgressState} state - Bar state.
 * @param {number} max - Amount that fills the bar.
 * @param {ArkheLabels} labels - Label templates.
 * @param {string} [locale] - BCP 47 locale for the numbers.
 * @returns {string} Value text, e.g. `3 of 10`.
 */
export function progressValueText(
  state: ProgressState,
  max: number,
  labels: ArkheLabels,
  locale?: string,
): string {
  return state.over
    ? formatLabel(
        labels.progressOver,
        {
          value: state.value,
          max,
          over: state.overBy,
        },
        locale,
      )
    : formatLabel(labels.progressValue, { value: state.value, max }, locale);
}
