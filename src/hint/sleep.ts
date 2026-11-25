/**
 * @fileoverview Sleeping hint triggers: a hint renders Zag's closed trigger
 * by hand and starts its machine on the first hover, focus or tap. The
 * sleeping trigger and the live closed one are the same DOM, so waking only
 * adds handlers. The live machine then replays the waking event.
 *
 * @module packages/core/src/hint/sleep
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

import type { EventNames } from '../base/events.js';

/**
 * What woke a hint: a hovering pointer, keyboard focus, or a touch press.
 *
 * @typedef {'hover' | 'focus' | 'touch'} HintWake
 */
export type HintWake = 'hover' | 'focus' | 'touch';

/**
 * Hint machines that sleep.
 *
 * @typedef {'tooltip' | 'hover-card'} HintScope
 */
export type HintScope = 'tooltip' | 'hover-card';

/**
 * The closed trigger attributes Zag renders, without handlers.
 *
 * @interface SleepingTrigger
 * @property {string} id - Zag's trigger id.
 * @property {HintScope} data-scope - Machine scope.
 * @property {'trigger'} data-part - Part.
 * @property {string} data-ownedby - Machine id.
 * @property {'closed'} data-state - State.
 */
export interface SleepingTrigger {
  readonly id: string;
  readonly 'data-scope': HintScope;
  readonly 'data-part': 'trigger';
  readonly 'data-ownedby': string;
  readonly 'data-state': 'closed';
}

/**
 * The part of a waking event the handlers read.
 *
 * @interface WakeEvent
 * @property {string} type - Event type.
 * @property {string} [pointerType] - Pointer kind, for pointer events.
 * @property {{ pointerType?: string }} [nativeEvent] - React's underlying event.
 */
export interface WakeEvent {
  readonly type: string;
  readonly pointerType?: string;
  readonly nativeEvent?: { readonly pointerType?: string };
}

/**
 * The trigger Zag renders while the hint is closed.
 *
 * @function sleepingTrigger
 * @param {HintScope} scope - Machine scope.
 * @param {string} id - Machine id.
 * @returns {SleepingTrigger} Attributes.
 */
export function sleepingTrigger(scope: HintScope, id: string): SleepingTrigger {
  return {
    id: `${scope}:${id}:trigger`,
    'data-scope': scope,
    'data-part': 'trigger',
    'data-ownedby': id,
    'data-state': 'closed',
  };
}

/**
 * What an event on a sleeping trigger wakes it for; null when it does not.
 * A touch `pointerover` waits for the press; a mouse press wakes as hover.
 *
 * @function wakeOf
 * @param {WakeEvent} event - Event on the trigger.
 * @returns {HintWake | null} Wake, or null.
 */
export function wakeOf(event: WakeEvent): HintWake | null {
  const pointer = event.pointerType ?? event.nativeEvent?.pointerType;
  if (event.type === 'focus' || event.type === 'focusin') return 'focus';
  if (event.type === 'pointerdown') {
    return pointer === 'touch' ? 'touch' : 'hover';
  }
  if (event.type === 'pointerover' && pointer !== 'touch') return 'hover';
  return null;
}

/**
 * Handlers that wake a sleeping trigger.
 *
 * @function wakeHandlers
 * @param {EventNames} names - The framework's event prop names.
 * @param {(wake: HintWake) => void} wake - Starts the machine.
 * @returns {Record<string, (event: WakeEvent) => void>} Props to spread.
 */
export function wakeHandlers(
  names: EventNames,
  wake: (wake: HintWake) => void,
): Record<string, (event: WakeEvent) => void> {
  const handle = (event: WakeEvent) => {
    const kind = wakeOf(event);
    if (kind !== null) wake(kind);
  };
  return {
    [names.pointerover]: handle,
    [names.focus]: handle,
    [names.pointerdown]: handle,
  };
}
