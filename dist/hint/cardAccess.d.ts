/**
 * @fileoverview Keyboard and assistive access to a hover card (P68). The
 * card is portalled, so Tab is proxied: from the trigger into the open card,
 * back out with Shift+Tab, and on past the trigger from its last stop. Focus
 * leaving an unpinned card closes it. Escape closes the innermost card, a
 * pinned one included (pinned cards stack, last pinned first), and focus
 * inside a closing card returns to its trigger. Escape inside a menu, such
 * as a card's move menu, is the menu's own.
 *
 * @module packages/core/src/hint/cardAccess
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */
import type { EventNames } from '../base/events.js';
import type { HintNode } from './hintTree.js';
import { type RootNode } from '../base/environment.js';
/**
 * What a card hands to `CardAccess`.
 *
 * @interface CardAccessInput
 * @property {() => RootNode} getRootNode - Root node holding trigger and card.
 * @property {() => HTMLElement | null} trigger - The trigger element.
 * @property {() => HTMLElement | null} content - The card content element.
 * @property {HintNode} node - The card's place among nested hints.
 * @property {() => void} close - Closes an unpinned card.
 * @property {() => void} release - Unpins and closes a pinned card.
 */
export interface CardAccessInput {
    readonly getRootNode: () => RootNode;
    readonly trigger: () => HTMLElement | null;
    readonly content: () => HTMLElement | null;
    readonly node: HintNode;
    readonly close: () => void;
    readonly release: () => void;
}
/**
 * Attributes a trigger carries for assistive tech.
 *
 * @interface CardTriggerInput
 * @property {boolean} link - The trigger is a link.
 * @property {boolean} inline - The trigger is inline text.
 * @property {boolean} open - The card shows.
 * @property {string} contentId - Id of the card content.
 * @property {string} bodyId - Id of the card body.
 */
export interface CardTriggerInput {
    readonly link: boolean;
    readonly inline: boolean;
    readonly open: boolean;
    readonly contentId: string;
    readonly bodyId: string;
}
/**
 * The element of `root` with id `id`, if any.
 *
 * @function elementById
 * @param {RootNode} root - Document or shadow root.
 * @param {string} id - Element id.
 * @returns {HTMLElement | null} Element.
 */
export declare function elementById(root: RootNode, id: string): HTMLElement | null;
/**
 * Elements Tab can reach inside `scope`, in order.
 *
 * @function tabbables
 * @param {ParentNode} scope - Where to look.
 * @returns {readonly HTMLElement[]} Tab stops.
 */
export declare function tabbables(scope: ParentNode): readonly HTMLElement[];
/**
 * Trigger attributes: a link is described by the open card's body and never
 * says expanded; a button or inline trigger says whether the card is open.
 *
 * @function cardTriggerAria
 * @param {CardTriggerInput} input - Trigger kind and card state.
 * @returns {Record<string, string | boolean | undefined>} Attributes.
 */
export declare function cardTriggerAria(input: CardTriggerInput): Record<string, string | boolean | undefined>;
/**
 * Zag's card content props. A pinned card drops the pointer leave, so the
 * machine stays open and keeps the layers nested in it, such as the move
 * menu.
 *
 * @function cardContentProps
 * @template {object} P
 * @param {P} props - Zag's content props.
 * @param {boolean} pinned - The card is pinned.
 * @param {EventNames} names - The framework's event prop names.
 * @returns {P} Props to spread on the card.
 */
export declare function cardContentProps<P extends object>(props: P, pinned: boolean, names: EventNames): P;
/**
 * Keyboard access to one hover card.
 *
 * @class CardAccess
 */
export declare class CardAccess {
    #private;
    /**
     * @param {CardAccessInput} input - Trigger, card, nesting, close actions.
     */
    constructor(input: CardAccessInput);
    /**
     * Records whether the card is pinned; the last one pinned answers Escape
     * first.
     *
     * @param {boolean} on - Pinned.
     * @returns {void}
     */
    pin(on: boolean): void;
    /**
     * Listens for Tab, Escape and focus leaving the card. Keys are heard on
     * the window before anything else, so Escape sees the nesting as it stood
     * before Zag closes a layer.
     *
     * @returns {() => void} Stops listening.
     */
    attach(): () => void;
}
