/**
 * @fileoverview Machine props shared by every floating part: tooltip, hover
 * card, popover, menu. Zag places them through floating-ui (ruling Q13).
 *
 * @module packages/core/src/floating
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { RootNode } from './environment.js';
import { definedOnly } from './machine.js';

/**
 * Side, and optional alignment, of a floating part against its trigger.
 *
 * @typedef {string} Placement
 */
export type Placement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

/**
 * Gap between trigger and floating part, in pixels.
 *
 * @constant FLOATING_GUTTER
 * @type {number}
 */
export const FLOATING_GUTTER = 6;

/**
 * What a port passes to `floatingMachineProps`.
 *
 * @interface FloatingMachineInput
 * @property {string} id - Instance id.
 * @property {boolean} [open] - Open state; makes the part controlled.
 * @property {boolean} [defaultOpen] - First open state when uncontrolled.
 * @property {boolean} [hold] - Keeps the part open and ignores close requests, e.g. a pinned card.
 * @property {(open: boolean) => void} [onOpenChange] - Open-state callback.
 * @property {Placement} [placement] - Wanted side. Flips when it does not fit.
 * @property {'absolute' | 'fixed'} [strategy] - Zag's positioning strategy. Defaults to `absolute`.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface FloatingMachineInput {
  readonly id: string;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly hold?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly placement?: Placement;
  readonly strategy?: 'absolute' | 'fixed';
  readonly getRootNode: () => RootNode;
}

/**
 * Builds the open-state and placement props every floating machine takes.
 *
 * @function floatingMachineProps
 * @param {FloatingMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function floatingMachineProps(input: FloatingMachineInput) {
  return definedOnly({
    id: input.id,
    open: input.hold ? true : input.open,
    defaultOpen: input.defaultOpen,
    onOpenChange: (details: { open: boolean }) => {
      if (input.hold && !details.open) return;
      input.onOpenChange?.(details.open);
    },
    positioning: definedOnly({
      placement: input.placement,
      strategy: input.strategy,
      gutter: FLOATING_GUTTER,
    }),
    getRootNode: input.getRootNode,
  });
}
