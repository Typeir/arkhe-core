/**
 * @fileoverview Keyboard and assistive access to a hover card (P68). The
 * card is portalled, so Tab is proxied: from the trigger into the open card,
 * back out with Shift+Tab, and on past the trigger from its last stop. Focus
 * leaving an unpinned card closes it. Escape closes the innermost card, a
 * pinned one included (pinned cards stack, last pinned first), and focus
 * inside a closing card returns to its trigger.
 *
 * @module packages/core/src/cardAccess
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */
var _a;
import { documentOf } from './environment.js';
const FOCUSABLE = [
    'a[href]',
    'button:not(:disabled)',
    'input:not(:disabled)',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]',
].join(', ');
/**
 * The element of `root` with id `id`, if any.
 *
 * @function elementById
 * @param {RootNode} root - Document or shadow root.
 * @param {string} id - Element id.
 * @returns {HTMLElement | null} Element.
 */
export function elementById(root, id) {
    return id ? root.getElementById(id) : null;
}
/**
 * Elements Tab can reach inside `scope`, in order.
 *
 * @function tabbables
 * @param {ParentNode} scope - Where to look.
 * @returns {HTMLElement[]} Tab stops.
 */
export function tabbables(scope) {
    return [...scope.querySelectorAll(FOCUSABLE)].filter((element) => element.tabIndex >= 0 && !element.closest('[hidden], [inert]'));
}
/**
 * Trigger attributes: a link is described by the open card's body and never
 * says expanded; a button or inline trigger says whether the card is open.
 *
 * @function cardTriggerAria
 * @param {CardTriggerInput} input - Trigger kind and card state.
 * @returns {Record<string, string | boolean | undefined>} Attributes.
 */
export function cardTriggerAria(input) {
    if (input.link) {
        return { 'aria-describedby': input.open ? input.bodyId : undefined };
    }
    return {
        role: input.inline ? 'button' : undefined,
        'aria-expanded': input.open,
        'aria-controls': input.open ? input.contentId : undefined,
    };
}
/**
 * Keyboard access to one hover card.
 *
 * @class CardAccess
 */
export class CardAccess {
    static #pinned = [];
    #input;
    /**
     * @param {CardAccessInput} input - Trigger, card, nesting, close actions.
     */
    constructor(input) {
        this.#input = input;
    }
    /**
     * Records whether the card is pinned; the last one pinned answers Escape
     * first.
     *
     * @param {boolean} on - Pinned.
     */
    pin(on) {
        _a.#pinned = _a.#pinned.filter((card) => card !== this);
        if (on)
            _a.#pinned.push(this);
    }
    /**
     * Listens for Tab, Escape and focus leaving the card. Keys are heard on
     * the window before anything else, so Escape sees the nesting as it stood
     * before Zag closes a layer.
     *
     * @returns {() => void} Stops listening.
     */
    attach() {
        const doc = documentOf(this.#input.getRootNode());
        const view = doc.defaultView ?? doc;
        const keydown = (event) => this.#key(event);
        const focusout = (event) => this.#left(event);
        view.addEventListener('keydown', keydown, true);
        doc.addEventListener('focusout', focusout);
        return () => {
            this.pin(false);
            view.removeEventListener('keydown', keydown, true);
            doc.removeEventListener('focusout', focusout);
        };
    }
    #key(event) {
        const trigger = this.#input.trigger();
        const content = this.#input.content();
        if (!trigger || !content || content.closest('[hidden]'))
            return;
        const at = event.composedPath()[0];
        const inside = at !== undefined && content.contains(at);
        if (event.key === 'Escape') {
            if (this.#input.node.nested())
                return;
            const pinned = _a.#pinned.includes(this);
            if (pinned && _a.#pinned.at(-1) !== this)
                return;
            if (inside)
                trigger.focus();
            if (pinned)
                this.#input.release();
            return;
        }
        if (event.key !== 'Tab')
            return;
        const stops = tabbables(content);
        const first = stops[0];
        const last = stops.at(-1);
        let next;
        if (at === trigger && !event.shiftKey)
            next = first;
        else if (inside && event.shiftKey && at === first)
            next = trigger;
        else if (inside && !event.shiftKey && at === last)
            next = this.#after(trigger, content);
        if (!next)
            return;
        event.preventDefault();
        next.focus();
    }
    #after(trigger, content) {
        const root = this.#input.getRootNode();
        const order = tabbables(root).filter((stop) => !content.contains(stop));
        return order[order.indexOf(trigger) + 1];
    }
    #left(event) {
        const content = this.#input.content();
        const from = event.target;
        if (!content || !from || !content.contains(from))
            return;
        const to = event.relatedTarget;
        if (to && (content.contains(to) || this.#input.trigger()?.contains(to))) {
            return;
        }
        if (this.#input.node.holds(this.#input.getRootNode(), to))
            return;
        if (_a.#pinned.includes(this))
            return;
        this.#input.close();
    }
}
_a = CardAccess;
