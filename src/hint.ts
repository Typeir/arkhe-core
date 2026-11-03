/**
 * @fileoverview Trigger behaviour shared by Tooltip and HoverCard. A touch
 * tap toggles the hint: Zag returns early on touch pointers, and Chromium
 * sends a touch `pointerleave` on lift that would close it again, so touch
 * pointer events never reach Zag and the click after a touch press toggles
 * instead. A tap outside the trigger and the hint closes it. A trigger
 * inside another trigger owns its own events: the outer one ignores what
 * bubbles up from it.
 *
 * @module packages/core/src/hint
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { documentOf, type RootNode } from './environment.js';
import type { EventNames } from './events.js';

const OWNERS = ['tooltip', 'hover-card']
  .flatMap((scope) => [
    `[data-scope="${scope}"][data-part="trigger"]`,
    `[data-scope="${scope}"][data-part="positioner"]`,
  ])
  .join(', ');

/**
 * The part of a DOM or framework event the trigger handlers read.
 *
 * @interface HintEvent
 * @property {string} type - Event type.
 * @property {EventTarget | null} target - Element the event started on.
 * @property {EventTarget | null} currentTarget - Element the handler sits on.
 * @property {string} [pointerType] - Pointer kind, for pointer and click events.
 * @property {{ pointerType?: string }} [nativeEvent] - React's underlying event; its click carries the pointer kind.
 * @property {() => void} preventDefault - Cancels the default action.
 */
export interface HintEvent {
  readonly type: string;
  readonly target: EventTarget | null;
  readonly currentTarget: EventTarget | null;
  readonly pointerType?: string;
  readonly nativeEvent?: { readonly pointerType?: string };
  readonly preventDefault: () => void;
}

/**
 * The last pointer kind pressed on a trigger; a React ref fits.
 *
 * @interface PointerMemory
 * @property {string | undefined} current - Pointer kind, until the click that follows.
 */
export interface PointerMemory {
  current: string | undefined;
}

/**
 * What `hintTriggerProps` needs from a port.
 *
 * @interface HintTriggerInput
 * @property {boolean} open - Whether the hint shows.
 * @property {(open: boolean) => void} setOpen - Opens or closes it.
 * @property {PointerMemory} memory - One per trigger, kept across renders.
 * @property {EventNames} names - The framework's event prop names.
 */
export interface HintTriggerInput {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly memory: PointerMemory;
  readonly names: EventNames;
}

/**
 * Whether `event` belongs to the trigger it reached, not to a trigger or
 * hint nested inside it.
 *
 * @function ownsEvent
 * @param {HintEvent} event - Event at the trigger.
 * @returns {boolean} True when no nested trigger or hint sits between.
 */
export function ownsEvent(event: HintEvent): boolean {
  const target = event.target as Element | null;
  if (typeof target?.closest !== 'function') return true;
  return target.closest(OWNERS) === event.currentTarget;
}

/**
 * Whether a tap on `element` should follow it: an open hint's link
 * trigger navigates on the second tap.
 *
 * @function followsLink
 * @param {EventTarget | null} element - Trigger.
 * @returns {boolean} True for a link.
 */
function followsLink(element: EventTarget | null): boolean {
  const node = element as Element | null;
  return typeof node?.matches === 'function' && node.matches('a[href]');
}

/**
 * Wraps the trigger props Zag returned: events from nested triggers are
 * dropped, touch pointer events are kept from Zag, and the click after a
 * touch press toggles the hint. A link trigger's tap opens the hint first
 * and follows the link once it is open.
 *
 * @function hintTriggerProps
 * @template {object} P
 * @param {P} props - Zag's trigger props.
 * @param {HintTriggerInput} input - Open state, memory, event names.
 * @returns {P} Props to spread on the trigger.
 */
export function hintTriggerProps<P extends object>(
  props: P,
  input: HintTriggerInput,
): P {
  const { memory } = input;
  const route = (event: HintEvent, handler?: (event: HintEvent) => void) => {
    if (!ownsEvent(event)) return;
    const pointer = event.pointerType ?? event.nativeEvent?.pointerType;
    if (event.type === 'pointerdown') memory.current = pointer;
    if (event.type === 'click') {
      const tapped = (pointer ?? memory.current) === 'touch';
      memory.current = undefined;
      if (tapped) {
        if (input.open && followsLink(event.currentTarget)) return;
        event.preventDefault();
        input.setOpen(!input.open);
        return;
      }
    }
    if (pointer !== 'touch') handler?.(event);
  };
  const wrapped: Record<string, unknown> = Object.fromEntries(
    Object.entries(props),
  );
  for (const [key, handler] of Object.entries(props)) {
    if (key.startsWith('on') && typeof handler === 'function') {
      wrapped[key] = (event: HintEvent) => route(event, handler);
    }
  }
  for (const key of [input.names.pointerdown, input.names.click]) {
    wrapped[key] ??= (event: HintEvent) => route(event);
  }
  return wrapped as P;
}

/**
 * Closes a hint when a touch lands outside every element in `ids`: its
 * trigger and its positioner. Listens on the root node's document, in the
 * capture phase, so shadow roots and stopped events still count.
 *
 * @function watchOutsideTap
 * @param {RootNode} root - Root node holding the elements.
 * @param {readonly string[]} ids - Ids of the elements that count as inside.
 * @param {() => void} close - Closes the hint.
 * @returns {() => void} Stops listening.
 */
export function watchOutsideTap(
  root: RootNode,
  ids: readonly string[],
  close: () => void,
): () => void {
  const doc = documentOf(root);
  const listener = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    const target = (event.composedPath()[0] ?? event.target) as Node | null;
    const inside = ids.some((id) => {
      const node = root.getElementById(id);
      return node !== null && target !== null && node.contains(target);
    });
    if (!inside) close();
  };
  doc.addEventListener('pointerdown', listener, true);
  return () => doc.removeEventListener('pointerdown', listener, true);
}
