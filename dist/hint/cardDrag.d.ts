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
import { type Corner } from './cardPlace.js';
/**
 * Pixels a press must travel before it counts as a drag.
 *
 * @constant DRAG_THRESHOLD
 * @type {number}
 */
export declare const DRAG_THRESHOLD = 4;
/**
 * Pixels an arrow key moves a card, and with Shift held.
 *
 * @constant KEY_STEP
 * @type {{ small: number, large: number }}
 */
export declare const KEY_STEP: {
    readonly small: 8;
    readonly large: 32;
};
/**
 * Milliseconds after the last arrow key before the move is announced.
 *
 * @constant SETTLE_MS
 * @type {number}
 */
export declare const SETTLE_MS = 1000;
/**
 * What a port hands CardDrag.
 *
 * @interface CardDragInput
 * @property {() => HTMLElement | null} frame - Element that holds the position and the detached mark.
 * @property {() => HTMLElement | null} header - Drag surface.
 * @property {() => HTMLElement | null} grip - Grip button.
 * @property {() => HTMLElement | null} card - The card, measured.
 * @property {() => HTMLElement | null} trigger - The card's trigger; Shift held while leaving it pins.
 * @property {() => boolean} detached - The card is detached now.
 * @property {() => void} detach - Pins the card and marks it detached.
 * @property {() => void} pin - Pins the card; a press on the grip does it.
 * @property {() => void} moved - A drag or a run of arrow keys has ended.
 */
export interface CardDragInput {
    readonly frame: () => HTMLElement | null;
    readonly header: () => HTMLElement | null;
    readonly grip: () => HTMLElement | null;
    readonly card: () => HTMLElement | null;
    readonly trigger: () => HTMLElement | null;
    readonly detached: () => boolean;
    readonly detach: () => void;
    readonly pin: () => void;
    readonly moved: () => void;
}
/**
 * Drags, nudges and corners one hover card.
 *
 * @class CardDrag
 */
export declare class CardDrag {
    #private;
    /**
     * @param {CardDragInput} input - Elements and port callbacks.
     */
    constructor(input: CardDragInput);
    /**
     * Detaches the card if it is not, then sends it to `corner`.
     *
     * @param {Corner} corner - Screen corner.
     * @returns {void}
     */
    moveToCorner(corner: Corner): void;
    /**
     * Starts listening on the card. Returns how to stop.
     *
     * @returns {() => void} Stops listening.
     */
    attach(): () => void;
}
