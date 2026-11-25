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
import { documentOf } from '../base/environment.js';
import { ownsEvent } from './hint.js';
/**
 * The trigger Zag renders while the hint is closed.
 *
 * @function sleepingTrigger
 * @param {HintScope} scope - Machine scope.
 * @param {string} id - Machine id.
 * @returns {SleepingTrigger} Attributes.
 */
export function sleepingTrigger(scope, id) {
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
export function wakeOf(event) {
    const pointer = event.pointerType ?? event.nativeEvent?.pointerType;
    if (event.type === 'focus' || event.type === 'focusin')
        return 'focus';
    if (event.type === 'pointerdown') {
        return pointer === 'touch' ? 'touch' : 'hover';
    }
    if (event.type === 'pointerover' && pointer !== 'touch')
        return 'hover';
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
    handlers;
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
    #press = null;
    /**
     * @param {EventNames} names - The framework's event prop names.
     * @param {(wake: HintWake) => void} wake - Starts the machine.
     */
    constructor(names, wake) {
        const handle = (event) => {
            const owner = {
                target: event.target ?? null,
                currentTarget: event.currentTarget ?? null,
            };
            if (!ownsEvent(owner))
                return;
            const kind = wakeOf(event);
            if (kind === null)
                return;
            if (kind === 'hover')
                this.#inside = true;
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
            [names.pointerout]: (event) => {
                const from = event.currentTarget;
                const to = event.relatedTarget;
                if (from?.contains(to ?? null) !== true)
                    this.leave();
            },
        };
    }
    /**
     * Whether the waking pointer is still over the trigger.
     *
     * @returns {boolean} Inside.
     */
    get hovering() {
        return this.#inside;
    }
    /**
     * Pointer kind of the press that woke the trigger; null when no press did.
     *
     * @returns {string | null} Pointer kind.
     */
    get press() {
        return this.#press;
    }
    /**
     * Records the pointer leaving the trigger.
     *
     * @returns {void}
     */
    leave() {
        this.#inside = false;
    }
    /**
     * Forgets the waking pointer and press, as the trigger goes back to sleep.
     *
     * @returns {void}
     */
    reset() {
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
export function afterExit(root, id, done) {
    let live = true;
    const view = documentOf(root).defaultView;
    const settle = () => {
        const el = root.getElementById(id);
        const running = el !== null && typeof el.getAnimations === 'function'
            ? el.getAnimations({ subtree: true })
            : [];
        void Promise.allSettled(running.map((run) => run.finished)).then(() => {
            if (live)
                done();
        });
    };
    const frame = view?.requestAnimationFrame(settle) ?? null;
    if (frame === null)
        settle();
    return () => {
        live = false;
        if (frame !== null)
            view?.cancelAnimationFrame(frame);
    };
}
