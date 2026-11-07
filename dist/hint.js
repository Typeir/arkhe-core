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
import { documentOf } from './environment.js';
const OWNERS = ['tooltip', 'hover-card']
    .flatMap((scope) => [
    `[data-scope="${scope}"][data-part="trigger"]`,
    `[data-scope="${scope}"][data-part="positioner"]`,
])
    .join(', ');
/**
 * Whether `event` belongs to the trigger it reached, not to a trigger or
 * hint nested inside it.
 *
 * @function ownsEvent
 * @param {HintEvent} event - Event at the trigger.
 * @returns {boolean} True when no nested trigger or hint sits between.
 */
export function ownsEvent(event) {
    const target = event.target;
    if (typeof target?.closest !== 'function')
        return true;
    return target.closest(OWNERS) === event.currentTarget;
}
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
export function hintTriggerProps(props, input) {
    const { memory } = input;
    const route = (event, handler) => {
        if (!ownsEvent(event))
            return;
        const pointer = event.pointerType ?? event.nativeEvent?.pointerType;
        if (event.type === 'pointerdown') {
            memory.current = pointer;
            if (pointer !== 'touch')
                memory.tapped = false;
        }
        if (event.type === 'blur' || event.type === 'focusout') {
            if (memory.tapped && input.open)
                return;
            if (input.holds?.(event.relatedTarget ?? null))
                return;
        }
        if (event.type === 'click') {
            const tapped = (pointer ?? memory.current) === 'touch';
            memory.current = undefined;
            if (tapped) {
                event.preventDefault();
                memory.tapped = !input.open;
                input.setOpen(!input.open);
                return;
            }
        }
        if (pointer !== 'touch')
            handler?.(event);
    };
    const wrapped = Object.fromEntries(Object.entries(props));
    for (const [key, handler] of Object.entries(props)) {
        if (key.startsWith('on') && typeof handler === 'function') {
            wrapped[key] = (event) => route(event, handler);
        }
    }
    for (const key of [input.names.pointerdown, input.names.click]) {
        wrapped[key] ??= (event) => route(event);
    }
    return wrapped;
}
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
export function watchOutsideTap(root, ids, close) {
    const doc = documentOf(root);
    const listener = (event) => {
        if (event.pointerType !== 'touch')
            return;
        const target = (event.composedPath()[0] ?? event.target);
        const inside = ids().some((id) => (target && root.getElementById(id)?.contains(target)) ?? false);
        if (!inside)
            close();
    };
    doc.addEventListener('pointerdown', listener, true);
    return () => doc.removeEventListener('pointerdown', listener, true);
}
