/**
 * @fileoverview Modal rules shared by both ports. Ports always drive Zag's
 * dialog as controlled, keeping their own open state when the host passes
 * none, so a server-rendered open modal can wait for its content to mount
 * before Zag traps focus. Focus returns to the trigger part when one
 * renders, else to whatever had focus before opening.
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
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface DialogMachineInput {
  readonly id: string;
  readonly open: boolean;
  readonly ready?: boolean;
  readonly role?: DialogRole;
  readonly onOpenChange: (open: boolean) => void;
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
    getRootNode: input.getRootNode,
  });
}
