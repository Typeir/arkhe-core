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
import { type RootNode } from '../base/environment.js';
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
    readonly onOpenChange: (details: {
        open: boolean;
    }) => void;
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
export declare function dialogMachineProps(input: DialogMachineInput): DialogMachineProps;
/**
 * Hides from assistive technology everything in `content`'s shadow root
 * beside the path down to `content`. Outside a shadow root it does nothing:
 * Zag already hides the document around the dialog.
 *
 * @function hideShadowSiblings
 * @param {Element} content - Open dialog content.
 * @returns {() => void} Restores what it hid.
 */
export declare function hideShadowSiblings(content: Element): () => void;
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
export declare function watchCloseRequest(root: RootNode, onClose: () => void): () => void;
