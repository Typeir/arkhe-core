/**
 * @fileoverview Dragging a hover card free of its trigger (P77). The whole
 * header drags for the pointer, except presses on its controls; the grip
 * button is the handle for the keyboard and assistive tech. Moving detaches
 * and pins the card: its frame then holds the position as `--card-x` /
 * `--card-y`, which CSS uses in place of Zag's placement. The card stays
 * whole inside the viewport.
 *
 * @module packages/core/src/hint/cardDrag
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */
var _a;
import { clampPoint, cornerPoint, } from './cardPlace.js';
/**
 * Pixels a press must travel before it counts as a drag.
 *
 * @constant DRAG_THRESHOLD
 * @type {number}
 */
export const DRAG_THRESHOLD = 4;
/**
 * Pixels an arrow key moves a card, and with Shift held.
 *
 * @constant KEY_STEP
 * @type {{ small: number, large: number }}
 */
export const KEY_STEP = { small: 8, large: 32 };
/**
 * Milliseconds after the last arrow key before the move is announced.
 *
 * @constant SETTLE_MS
 * @type {number}
 */
export const SETTLE_MS = 1000;
/**
 * Header elements whose presses stay theirs instead of starting a drag.
 *
 * @constant CONTROLS
 * @type {string}
 */
const CONTROLS = 'button, a, input, select, textarea, [role="menuitem"]';
/**
 * Unit move of each arrow key.
 *
 * @constant ARROWS
 * @type {Readonly<Record<string, Point>>}
 */
const ARROWS = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
};
/**
 * Drags, nudges and corners one hover card.
 *
 * @class CardDrag
 */
export class CardDrag {
    /**
     * Stacking layer handed to the card brought to the front last.
     *
     * @type {number}
     */
    static #layer = 0;
    /**
     * Elements and port callbacks.
     *
     * @type {CardDragInput}
     */
    #input;
    /**
     * Card position while detached, in viewport pixels.
     *
     * @type {Point}
     */
    #at = { x: 0, y: 0 };
    /**
     * Where the pointer grabbed the card, from its top left.
     *
     * @type {Point}
     */
    #offset = { x: 0, y: 0 };
    /**
     * Where the press began.
     *
     * @type {Point}
     */
    #start = { x: 0, y: 0 };
    /**
     * Id of the pressing pointer, `null` when none presses.
     *
     * @type {number | null}
     */
    #pointer = null;
    /**
     * The press has passed the threshold and drags.
     *
     * @type {boolean}
     */
    #dragging = false;
    /**
     * Swallows the click that ends a drag.
     *
     * @type {boolean}
     */
    #swallow = false;
    /**
     * Timer announcing a run of arrow keys, `null` when none runs.
     *
     * @type {ReturnType<typeof setTimeout> | null}
     */
    #settle = null;
    /**
     * @param {CardDragInput} input - Elements and port callbacks.
     */
    constructor(input) {
        this.#input = input;
    }
    /**
     * Detaches the card if it is not, then sends it to `corner`.
     *
     * @param {Corner} corner - Screen corner.
     * @returns {void}
     */
    moveToCorner(corner) {
        const card = this.#input.card();
        if (!card)
            return;
        this.#detach();
        const { width, height } = card.getBoundingClientRect();
        this.#write(cornerPoint(corner, { width, height }, this.#view()));
        this.#front();
    }
    /**
     * Starts listening on the card. Returns how to stop.
     *
     * @returns {() => void} Stops listening.
     */
    attach() {
        const header = this.#input.header();
        const frame = this.#input.frame();
        const view = header?.ownerDocument.defaultView;
        if (!header || !frame || !view)
            return () => undefined;
        this.#at = {
            x: parseFloat(frame.style.getPropertyValue('--card-x')) || 0,
            y: parseFloat(frame.style.getPropertyValue('--card-y')) || 0,
        };
        const refit = () => {
            if (this.#input.detached())
                this.#write(this.#at);
        };
        const front = () => {
            if (this.#input.detached())
                this.#front();
        };
        const Observer = view.ResizeObserver;
        const observer = Observer === undefined ? null : new Observer(refit);
        const card = this.#input.card();
        const trigger = this.#input.trigger();
        if (card)
            observer?.observe(card);
        const shift = (event) => {
            if (event.shiftKey)
                this.#input.pin();
        };
        card?.addEventListener('pointerleave', shift);
        trigger?.addEventListener('pointerleave', shift);
        header.addEventListener('pointerdown', this.#press);
        header.addEventListener('click', this.#click, true);
        header.addEventListener('keydown', this.#key);
        frame.addEventListener('focusin', front);
        frame.addEventListener('pointerdown', front);
        view.addEventListener('resize', refit);
        return () => {
            observer?.disconnect();
            card?.removeEventListener('pointerleave', shift);
            trigger?.removeEventListener('pointerleave', shift);
            this.#stop();
            this.#unsettle();
            header.removeEventListener('pointerdown', this.#press);
            header.removeEventListener('click', this.#click, true);
            header.removeEventListener('keydown', this.#key);
            frame.removeEventListener('focusin', front);
            frame.removeEventListener('pointerdown', front);
            view.removeEventListener('resize', refit);
        };
    }
    /**
     * Size of the card's viewport, scrollbars left out.
     *
     * @returns {Size} Viewport size.
     */
    #view() {
        const root = this.#input.frame()?.ownerDocument.documentElement;
        return { width: root?.clientWidth ?? 0, height: root?.clientHeight ?? 0 };
    }
    /**
     * Moves the card to `point`, kept inside the viewport.
     *
     * @param {Point} point - Wanted top left.
     * @returns {void}
     */
    #write(point) {
        const frame = this.#input.frame();
        const card = this.#input.card();
        if (!frame || !card)
            return;
        const { width, height } = card.getBoundingClientRect();
        this.#at = clampPoint(point, { width, height }, this.#view());
        frame.style.setProperty('--card-x', `${this.#at.x}px`);
        frame.style.setProperty('--card-y', `${this.#at.y}px`);
    }
    /**
     * Detaches the card where it stands, unless it already is.
     *
     * @returns {void}
     */
    #detach() {
        if (this.#input.detached())
            return;
        const rect = this.#input.card()?.getBoundingClientRect();
        if (rect)
            this.#write({ x: rect.left, y: rect.top });
        this.#input.detach();
    }
    /**
     * Brings the card above every other card.
     *
     * @returns {void}
     */
    #front() {
        _a.#layer += 1;
        this.#input
            .frame()
            ?.style.setProperty('--card-layer', `${_a.#layer}`);
    }
    /**
     * Starts a possible drag on a primary press outside the header's controls,
     * the grip excepted.
     *
     * @param {PointerEvent} event - Press on the header.
     * @returns {void}
     */
    #press = (event) => {
        this.#swallow = false;
        if (event.button !== 0)
            return;
        const control = event.target.closest(CONTROLS);
        const grip = this.#input.grip();
        if (control && !(grip && grip.contains(control)))
            return;
        const rect = this.#input.card()?.getBoundingClientRect();
        if (!rect)
            return;
        this.#offset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
        this.#start = { x: event.clientX, y: event.clientY };
        this.#pointer = event.pointerId;
        const view = event.target.ownerDocument.defaultView;
        view?.addEventListener('pointermove', this.#move);
        view?.addEventListener('pointerup', this.#end);
        view?.addEventListener('pointercancel', this.#end);
        this.#input.header()?.addEventListener('lostpointercapture', this.#end);
    };
    /**
     * Follows the pointer; past the threshold, detaches and drags the card.
     *
     * @param {PointerEvent} event - Pointer move on the window.
     * @returns {void}
     */
    #move = (event) => {
        if (event.pointerId !== this.#pointer)
            return;
        const header = this.#input.header();
        if (!this.#dragging) {
            const travel = Math.hypot(event.clientX - this.#start.x, event.clientY - this.#start.y);
            if (travel < DRAG_THRESHOLD)
                return;
            this.#dragging = true;
            header?.setPointerCapture?.(event.pointerId);
            header?.setAttribute('data-dragging', '');
            this.#detach();
            this.#front();
        }
        this.#write({
            x: event.clientX - this.#offset.x,
            y: event.clientY - this.#offset.y,
        });
    };
    /**
     * Ends the press; after a drag, swallows the click and reports the move.
     *
     * @returns {void}
     */
    #end = () => {
        const dragged = this.#dragging;
        this.#stop();
        if (!dragged)
            return;
        this.#swallow = true;
        this.#input.moved();
    };
    /**
     * Drops the press listeners and the pointer capture.
     *
     * @returns {void}
     */
    #stop() {
        const header = this.#input.header();
        const view = header?.ownerDocument.defaultView;
        view?.removeEventListener('pointermove', this.#move);
        view?.removeEventListener('pointerup', this.#end);
        view?.removeEventListener('pointercancel', this.#end);
        header?.removeEventListener('lostpointercapture', this.#end);
        if (this.#pointer !== null && header?.hasPointerCapture?.(this.#pointer)) {
            header.releasePointerCapture(this.#pointer);
        }
        header?.removeAttribute('data-dragging');
        this.#dragging = false;
        this.#pointer = null;
    }
    /**
     * Cancels a pending arrow-key announcement.
     *
     * @returns {void}
     */
    #unsettle() {
        if (this.#settle !== null)
            clearTimeout(this.#settle);
        this.#settle = null;
    }
    /**
     * Swallows the click ending a drag; a click on the grip pins the card.
     *
     * @param {MouseEvent} event - Click on the header.
     * @returns {void}
     */
    #click = (event) => {
        if (this.#swallow) {
            this.#swallow = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        const grip = this.#input.grip();
        if (grip && grip.contains(event.target))
            this.#input.pin();
    };
    /**
     * Arrow keys on the grip detach the card and move it a step, Shift a
     * larger one; the move is announced once the keys settle.
     *
     * @param {KeyboardEvent} event - Key press on the header.
     * @returns {void}
     */
    #key = (event) => {
        const way = ARROWS[event.key];
        const grip = this.#input.grip();
        if (!way || !grip || !grip.contains(event.target))
            return;
        event.preventDefault();
        this.#detach();
        const step = event.shiftKey ? KEY_STEP.large : KEY_STEP.small;
        this.#write({ x: this.#at.x + way.x * step, y: this.#at.y + way.y * step });
        this.#front();
        this.#unsettle();
        this.#settle = setTimeout(() => {
            this.#settle = null;
            this.#input.moved();
        }, SETTLE_MS);
    };
}
_a = CardDrag;
