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

import { documentOf, type RootNode } from './environment.js';
import type { HintNode } from './hintTree.js';

const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]',
].join(', ');

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
export function elementById(root: RootNode, id: string): HTMLElement | null {
  return id ? (root.getElementById(id) as HTMLElement | null) : null;
}

/**
 * Elements Tab can reach inside `scope`, in order.
 *
 * @function tabbables
 * @param {ParentNode} scope - Where to look.
 * @returns {HTMLElement[]} Tab stops.
 */
export function tabbables(scope: ParentNode): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => element.tabIndex >= 0 && !element.closest('[hidden], [inert]'),
  );
}

/**
 * Trigger attributes: a link is described by the open card's body and never
 * says expanded; a button or inline trigger says whether the card is open.
 *
 * @function cardTriggerAria
 * @param {CardTriggerInput} input - Trigger kind and card state.
 * @returns {Record<string, string | boolean | undefined>} Attributes.
 */
export function cardTriggerAria(
  input: CardTriggerInput,
): Record<string, string | boolean | undefined> {
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
  static #pinned: CardAccess[] = [];
  readonly #input: CardAccessInput;

  /**
   * @param {CardAccessInput} input - Trigger, card, nesting, close actions.
   */
  constructor(input: CardAccessInput) {
    this.#input = input;
  }

  /**
   * Records whether the card is pinned; the last one pinned answers Escape
   * first.
   *
   * @param {boolean} on - Pinned.
   */
  pin(on: boolean): void {
    CardAccess.#pinned = CardAccess.#pinned.filter((card) => card !== this);
    if (on) CardAccess.#pinned.push(this);
  }

  /**
   * Listens for Tab, Escape and focus leaving the card. Keys are heard on
   * the window before anything else, so Escape sees the nesting as it stood
   * before Zag closes a layer.
   *
   * @returns {() => void} Stops listening.
   */
  attach(): () => void {
    const doc = documentOf(this.#input.getRootNode());
    const view = doc.defaultView ?? doc;
    const keydown = (event: Event) => this.#key(event as KeyboardEvent);
    const focusout = (event: FocusEvent) => this.#left(event);
    view.addEventListener('keydown', keydown, true);
    doc.addEventListener('focusout', focusout);
    return () => {
      this.pin(false);
      view.removeEventListener('keydown', keydown, true);
      doc.removeEventListener('focusout', focusout);
    };
  }

  #key(event: KeyboardEvent): void {
    const trigger = this.#input.trigger();
    const content = this.#input.content();
    if (!trigger || !content || content.closest('[hidden]')) return;
    const at = event.composedPath()[0] as Node | undefined;
    const inside = at !== undefined && content.contains(at);
    if (event.key === 'Escape') {
      if (this.#input.node.nested()) return;
      const pinned = CardAccess.#pinned.includes(this);
      if (pinned && CardAccess.#pinned.at(-1) !== this) return;
      if (inside) trigger.focus();
      if (pinned) this.#input.release();
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = tabbables(content);
    const first = stops[0];
    const last = stops.at(-1);
    let next: HTMLElement | undefined;
    if (at === trigger && !event.shiftKey) next = first;
    else if (inside && event.shiftKey && at === first) next = trigger;
    else if (inside && !event.shiftKey && at === last)
      next = this.#after(trigger, content);
    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  #after(trigger: HTMLElement, content: HTMLElement): HTMLElement | undefined {
    const root = this.#input.getRootNode() as unknown as ParentNode;
    const order = tabbables(root).filter((stop) => !content.contains(stop));
    return order[order.indexOf(trigger) + 1];
  }

  #left(event: FocusEvent): void {
    const content = this.#input.content();
    const from = event.target as Node | null;
    if (!content || !from || !content.contains(from)) return;
    const to = event.relatedTarget as Node | null;
    if (to && (content.contains(to) || this.#input.trigger()?.contains(to))) {
      return;
    }
    if (this.#input.node.holds(this.#input.getRootNode(), to)) return;
    if (CardAccess.#pinned.includes(this)) return;
    this.#input.close();
  }
}
