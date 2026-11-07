/**
 * @fileoverview Trigger behaviour shared by Tooltip and HoverCard. A touch
 * tap toggles the hint: Zag returns early on touch pointers, and Chromium
 * sends a touch `pointerleave` on lift that would close it again, so touch
 * pointer events never reach Zag and the click after a touch press toggles
 * instead. A tap never follows a link trigger. A tap outside the trigger and the hint closes it; a tap in the
 * hint does not, though it moves focus off the trigger. Focus moving from
 * the trigger into its hint keeps it open. A trigger inside another
 * trigger owns its own events: the outer one ignores what bubbles up from
 * it.
 *
 * @module packages/core/src/hint
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { type RootNode } from './environment.js';
import type { EventNames } from './events.js';
/**
 * The part of a DOM or framework event the trigger handlers read.
 *
 * @interface HintEvent
 * @property {string} type - Event type.
 * @property {EventTarget | null} target - Element the event started on.
 * @property {EventTarget | null} currentTarget - Element the handler sits on.
 * @property {EventTarget | null} [relatedTarget] - Element focus moves to, for blur events.
 * @property {string} [pointerType] - Pointer kind, for pointer and click events.
 * @property {{ pointerType?: string }} [nativeEvent] - React's underlying event; its click carries the pointer kind.
 * @property {() => void} preventDefault - Cancels the default action.
 */
export interface HintEvent {
    readonly type: string;
    readonly target: EventTarget | null;
    readonly currentTarget: EventTarget | null;
    readonly relatedTarget?: EventTarget | null;
    readonly pointerType?: string;
    readonly nativeEvent?: {
        readonly pointerType?: string;
    };
    readonly preventDefault: () => void;
}
/**
 * The last pointer kind pressed on a trigger, and whether a tap opened
 * the hint.
 *
 * @interface PointerMemory
 * @property {string | undefined} current - Pointer kind, until the click that follows.
 * @property {boolean} [tapped] - A tap opened the hint; only a tap outside or Escape closes it.
 */
export interface PointerMemory {
    current: string | undefined;
    tapped?: boolean;
}
/**
 * What `hintTriggerProps` needs from a port.
 *
 * @interface HintTriggerInput
 * @property {boolean} open - Whether the hint shows.
 * @property {(open: boolean) => void} setOpen - Opens or closes it.
 * @property {PointerMemory} memory - One per trigger, kept across renders.
 * @property {EventNames} names - The framework's event prop names.
 * @property {(target: EventTarget | null) => boolean} [holds] - Whether an element is inside the hint or a hint it holds.
 */
export interface HintTriggerInput {
    readonly open: boolean;
    readonly setOpen: (open: boolean) => void;
    readonly memory: PointerMemory;
    readonly names: EventNames;
    readonly holds?: (target: EventTarget | null) => boolean;
}
/**
 * Whether `event` belongs to the trigger it reached, not to a trigger or
 * hint nested inside it.
 *
 * @function ownsEvent
 * @param {HintEvent} event - Event at the trigger.
 * @returns {boolean} True when no nested trigger or hint sits between.
 */
export declare function ownsEvent(event: HintEvent): boolean;
/**
 * Wraps the trigger props Zag returned: events from nested triggers are
 * dropped, touch pointer events are kept from Zag, and the click after a
 * touch press toggles the hint. A tap never follows a link trigger; the
 * hint offers the link instead. A blur is dropped while a tap holds the
 * hint open or when focus moves into the hint.
 *
 * @function hintTriggerProps
 * @template {object} P
 * @param {P} props - Zag's trigger props.
 * @param {HintTriggerInput} input - Open state, memory, event names.
 * @returns {P} Props to spread on the trigger.
 */
export declare function hintTriggerProps<P extends object>(props: P, input: HintTriggerInput): P;
/**
 * Closes a hint when a touch lands outside every element `ids` names: its
 * trigger, its positioner and those of the hints it holds, read at each
 * tap. Listens on the root node's document, in the capture phase, so
 * shadow roots and stopped events still count.
 *
 * @function watchOutsideTap
 * @param {RootNode} root - Root node holding the elements.
 * @param {() => readonly string[]} ids - Ids of the elements that count as inside.
 * @param {() => void} close - Closes the hint.
 * @returns {() => void} Stops listening.
 */
export declare function watchOutsideTap(root: RootNode, ids: () => readonly string[], close: () => void): () => void;
