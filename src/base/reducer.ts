/**
 * @fileoverview The one template every state transition in Arkhé follows: a
 * pure reducer in core, `(state, action, rules) => state`, and a dispatch
 * that commits only a changed state. Ports never decide a transition
 * themselves; they dispatch actions and commit what comes back.
 *
 * @module packages/core/src/base/reducer
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

/**
 * An action: what happened, tagged by `type`, with its payload.
 *
 * @interface Action
 * @template {string} T
 * @property {T} type - Action name.
 */
export interface Action<T extends string = string> {
  readonly type: T;
}

/**
 * A pure transition. It returns the same `state` object when the action
 * changes nothing, so a dispatch can skip the commit.
 *
 * @typedef {(state: S, action: A, rules: R) => S} Reducer
 * @template S, A, R
 */
export type Reducer<S, A extends Action, R> = (
  state: S,
  action: A,
  rules: R,
) => S;

/**
 * Runs `action` through `reduce` and commits the next state when it
 * differs from `state`.
 *
 * @function dispatch
 * @template S, A, R
 * @param {Reducer<S, A, R>} reduce - Component reducer.
 * @param {S} state - State now.
 * @param {A} action - What happened.
 * @param {R} rules - How the component combines actions.
 * @param {(next: S) => void} commit - Stores the next state or reports it to the host.
 * @returns {void}
 */
export function dispatch<S, A extends Action, R>(
  reduce: Reducer<S, A, R>,
  state: S,
  action: A,
  rules: R,
  commit: (next: S) => void,
): void {
  const next = reduce(state, action, rules);
  if (!Object.is(next, state)) commit(next);
}
