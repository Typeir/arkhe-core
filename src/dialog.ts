/**
 * @fileoverview Modal rules shared by both ports. Ports always drive Zag's
 * dialog as controlled, keeping their own open state when the host passes
 * none, so a server-rendered open modal can wait for its content to mount
 * before Zag traps focus. Focus returns to `finalFocus` when it gives an
 * element, else to the trigger part when one renders, else to whatever had
 * focus before opening. Inside a shadow root the rest of that root is hidden
 * from assistive technology too, which Zag's own hiding stops short of.
 *
 * @module packages/core/src/dialog
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { RootNode } from './environment.js';
import { definedOnly } from './machine.js';

/**
 * Dialog role: `alertdialog` for confirmations that need an answer.
 *
 * @typedef {'dialog' | 'alertdialog'} DialogRole
 */
export type DialogRole = 'dialog' | 'alertdialog';

/**
 * What a port passes to `dialogMachineProps`.
 *
 * @interface DialogMachineInput
 * @property {string} id - Instance id.
 * @property {boolean} open - Wanted open state.
 * @property {boolean} [ready] - False until content can mount; keeps Zag closed.
 * @property {DialogRole} [role] - Dialog role. Defaults to `dialog`.
 * @property {(open: boolean) => void} onOpenChange - Open-state callback.
 * @property {() => HTMLElement | null} [finalFocus] - Element to focus on close, e.g. when the opener is gone.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface DialogMachineInput {
  readonly id: string;
  readonly open: boolean;
  readonly ready?: boolean;
  readonly role?: DialogRole;
  readonly onOpenChange: (open: boolean) => void;
  readonly finalFocus?: () => HTMLElement | null;
  readonly getRootNode: () => RootNode;
}

/**
 * Builds Zag dialog machine props.
 *
 * @function dialogMachineProps
 * @param {DialogMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function dialogMachineProps(input: DialogMachineInput) {
  return definedOnly({
    id: input.id,
    open: input.open && (input.ready ?? true),
    role: input.role,
    onOpenChange: (details: { open: boolean }) =>
      input.onOpenChange(details.open),
    finalFocusEl: input.finalFocus,
    getRootNode: input.getRootNode,
  });
}

/**
 * Says whether assistive technology must skip `node`: live regions stay
 * audible, as in Zag's own hiding.
 *
 * @function keepsSpeaking
 * @param {Element} node - Sibling of the dialog's path.
 * @returns {boolean} True to leave it alone.
 */
function keepsSpeaking(node: Element): boolean {
  return (
    ['script', 'style', 'output'].includes(node.localName) ||
    node.getAttribute('role') === 'status' ||
    node.hasAttribute('aria-live')
  );
}

/**
 * Hides from assistive technology everything in `content`'s shadow root
 * beside the path down to `content`. Outside a shadow root it does nothing:
 * Zag already hides the document around the dialog.
 *
 * @function hideShadowSiblings
 * @param {Element} content - Open dialog content.
 * @returns {() => void} Restores what it hid.
 */
export function hideShadowSiblings(content: Element): () => void {
  const root = content.getRootNode();
  if (root.nodeType !== 11 || !('host' in root)) return () => undefined;
  const hidden: Element[] = [];
  let node: Element = content;
  while (node.parentNode) {
    const parent = node.parentNode as ParentNode;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || keepsSpeaking(sibling)) continue;
      if (sibling.getAttribute('aria-hidden') === 'true') continue;
      sibling.setAttribute('aria-hidden', 'true');
      hidden.push(sibling);
    }
    if (parent === root) break;
    node = parent as Element;
  }
  return () => {
    for (const sibling of hidden) sibling.removeAttribute('aria-hidden');
  };
}
