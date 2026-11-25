/**
 * @fileoverview Sleeping hint triggers: a hint renders Zag's closed trigger
 * by hand and starts its machine on the first hover, focus or tap. The
 * sleeping trigger and the live closed one are the same DOM, so waking only
 * adds handlers. The live machine then replays the waking event, and goes
 * back to sleep once it has closed and its exit animations have ended.
 *
 * @module packages/core/src/hint/sleep
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

import type { EventNames } from '../base/events.js';
import { documentOf, type RootNode } from '../base/environment.js';
import { ownsEvent } from './hint.js';

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
 * @property {EventTarget | null} [target] - Element the event started on.
 * @property {EventTarget | null} [currentTarget] - Element the handler sits on.
 * @property {EventTarget | null} [relatedTarget] - Element the pointer moved to, for pointer-out events.
 */
export interface WakeEvent {
  readonly type: string;
  readonly target?: EventTarget | null;
  readonly currentTarget?: EventTarget | null;
  readonly relatedTarget?: EventTarget | null;
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
 * Wakes a sleeping trigger and remembers whether the pointer that woke it
 * is still over the trigger: the live machine replays a hover only then.
 * Events from a trigger nested inside it wake only that one. Leaving is read
 * from the bubbling pointerout, which both ports delegate, so a sleeping
 * trigger holds no listener of its own.
 *
 * @class WakeWatch
 */
export class WakeWatch {
  /**
   * Props to spread on the sleeping trigger.
   *
   * @type {Readonly<Record<string, (event: WakeEvent) => void>>}
   */
  readonly handlers: Readonly<Record<string, (event: WakeEvent) => void>>;
  /**
   * The waking pointer is still over the trigger.
   *
   * @type {boolean}
   */
  #inside = false;
  /**
   * Pointer kind of the press that woke the trigger; null when no press did.
   *
   * @type {string | null}
   */
  #press: string | null = null;

  /**
   * @param {EventNames} names - The framework's event prop names.
   * @param {(wake: HintWake) => void} wake - Starts the machine.
   */
  constructor(names: EventNames, wake: (wake: HintWake) => void) {
    const handle = (event: WakeEvent) => {
      const owner = {
        target: event.target ?? null,
        currentTarget: event.currentTarget ?? null,
      };
      if (!ownsEvent(owner)) return;
      const kind = wakeOf(event);
      if (kind === null) return;
      if (kind === 'hover') this.#inside = true;
      if (event.type === 'pointerdown') {
        this.#press =
          event.pointerType ?? event.nativeEvent?.pointerType ?? null;
      }
      wake(kind);
    };
    this.handlers = {
      [names.pointerover]: handle,
      [names.focus]: handle,
      [names.pointerdown]: handle,
      [names.pointerout]: (event: WakeEvent) => {
        const from = event.currentTarget as Node | null | undefined;
        const to = event.relatedTarget as Node | null | undefined;
        if (from?.contains(to ?? null) !== true) this.leave();
      },
    };
  }

  /**
   * Whether the waking pointer is still over the trigger.
   *
   * @returns {boolean} Inside.
   */
  get hovering(): boolean {
    return this.#inside;
  }

  /**
   * Pointer kind of the press that woke the trigger; null when no press did.
   *
   * @returns {string | null} Pointer kind.
   */
  get press(): string | null {
    return this.#press;
  }

  /**
   * Records the pointer leaving the trigger.
   *
   * @returns {void}
   */
  leave(): void {
    this.#inside = false;
  }

  /**
   * Forgets the waking pointer and press, as the trigger goes back to sleep.
   *
   * @returns {void}
   */
  reset(): void {
    this.#inside = false;
    this.#press = null;
  }
}

/**
 * Calls `done` once the CSS exit animations under the element `id` names
 * have finished: a frame first, so transitions the close started are
 * running and the port has rendered what the machine did, then every
 * animation's end.
 *
 * @function afterExit
 * @param {RootNode} root - Root node holding the element.
 * @param {string} id - Id of the element whose subtree animates out.
 * @param {() => void} done - Runs once it has.
 * @returns {() => void} Cancels.
 */
export function afterExit(
  root: RootNode,
  id: string,
  done: () => void,
): () => void {
  let live = true;
  const view = documentOf(root).defaultView;
  const settle = () => {
    const el = root.getElementById(id);
    const running =
      el !== null && typeof el.getAnimations === 'function'
        ? el.getAnimations({ subtree: true })
        : [];
    void Promise.allSettled(running.map((run) => run.finished)).then(() => {
      if (live) done();
    });
  };
  const frame = view?.requestAnimationFrame(settle) ?? null;
  if (frame === null) settle();
  return () => {
    live = false;
    if (frame !== null) view?.cancelAnimationFrame(frame);
  };
}
