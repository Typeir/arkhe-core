/**
 * @fileoverview Modal rules shared by both ports. Ports always drive Zag's
 * dialog as controlled, keeping their own open state when the host passes
 * none, so a server-rendered open modal can wait for its content to mount
 * before Zag traps focus. Focus returns to `finalFocus` when it gives an
 * element, else to the trigger part when one renders, else to whatever had
 * focus before opening, else, when that is gone, to its nearest focusable
 * neighbour (`FocusReturn`). Inside a shadow root the rest of that root is hidden
 * from assistive technology too, which Zag's own hiding stops short of.
 * While open, the platform's close request (the back gesture on a phone)
 * closes it; Escape stays Zag's, which cancels the key once it dismisses.
 *
 * @module packages/core/src/overlay/dialog
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { FocusReturn } from '../base/focusReturn.js';
import { documentOf, type RootNode } from '../base/environment.js';
import { definedOnly } from '../base/machine.js';

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
 * @property {() => HTMLElement | null} [initialFocus] - Element to focus on open. Defaults to Zag's first focusable.
 * @property {() => HTMLElement | null} [finalFocus] - Element to focus on close; wins over everything else.
 * @property {FocusReturn} [focusReturn] - The instance's opener memory; the port keeps one per instance.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface DialogMachineInput {
  readonly id: string;
  readonly open: boolean;
  readonly ready?: boolean;
  readonly role?: DialogRole;
  readonly onOpenChange: (open: boolean) => void;
  readonly initialFocus?: () => HTMLElement | null;
  readonly finalFocus?: () => HTMLElement | null;
  readonly focusReturn?: FocusReturn;
  readonly getRootNode: () => RootNode;
}

/**
 * Zag dialog machine props.
 *
 * @interface DialogMachineProps
 * @property {string} id - Instance id.
 * @property {boolean} open - Open state.
 * @property {DialogRole} [role] - Dialog role.
 * @property {() => HTMLElement | null} [initialFocusEl] - Element to focus on open.
 * @property {(details: { open: boolean }) => void} onOpenChange - Zag's open-state callback.
 * @property {() => HTMLElement | null} [finalFocusEl] - Element to focus on close.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface DialogMachineProps {
  readonly id: string;
  readonly open: boolean;
  readonly role?: DialogRole;
  readonly initialFocusEl?: () => HTMLElement | null;
  readonly onOpenChange: (details: { open: boolean }) => void;
  readonly finalFocusEl?: () => HTMLElement | null;
  readonly getRootNode: () => RootNode;
}

/**
 * Builds Zag dialog machine props.
 *
 * @function dialogMachineProps
 * @param {DialogMachineInput} input - Port input.
 * @returns {DialogMachineProps} Machine props.
 */
export function dialogMachineProps(
  input: DialogMachineInput,
): DialogMachineProps {
  const open = input.open && (input.ready ?? true);
  const memory = input.focusReturn;
  memory?.track(open, input.getRootNode());
  return definedOnly({
    id: input.id,
    open,
    role: input.role,
    initialFocusEl: input.initialFocus,
    onOpenChange: (details: { open: boolean }) => {
      input.onOpenChange(details.open);
    },
    finalFocusEl:
      input.finalFocus || memory
        ? () => input.finalFocus?.() ?? memory?.target() ?? null
        : undefined,
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
    if (parent.nodeType === 11) break;
    node = parent as Element;
  }
  return () => {
    for (const sibling of hidden) sibling.removeAttribute('aria-hidden');
  };
}

/**
 * The platform's close watcher, where the window has one.
 *
 * @interface CloseWatcherLike
 * @property {(type: 'close', listener: () => void) => void} addEventListener - Hears the close request.
 * @property {() => void} destroy - Stops watching.
 */
interface CloseWatcherLike {
  addEventListener: (type: 'close', listener: () => void) => void;
  destroy: () => void;
}

/**
 * Calls `onClose` on the platform's close request, such as the back gesture
 * on a phone, until stopped. Does nothing where the window has no
 * `CloseWatcher`.
 *
 * @function watchCloseRequest
 * @param {RootNode} root - Root node.
 * @param {() => void} onClose - Called on the close request.
 * @returns {() => void} Stops watching.
 */
export function watchCloseRequest(
  root: RootNode,
  onClose: () => void,
): () => void {
  const view = documentOf(root).defaultView as
    (Window & { CloseWatcher?: new () => CloseWatcherLike }) | null;
  if (!view?.CloseWatcher) return () => undefined;
  const watcher = new view.CloseWatcher();
  watcher.addEventListener('close', onClose);
  return () => {
    watcher.destroy();
  };
}
