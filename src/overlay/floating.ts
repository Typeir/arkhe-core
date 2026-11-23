/**
 * @fileoverview Machine props shared by every floating part: tooltip, hover
 * card, popover, menu. Zag places them through floating-ui (ruling Q13).
 *
 * @module packages/core/src/overlay/floating
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { RootNode } from '../base/environment.js';
import { definedOnly } from '../base/machine.js';

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
 * Gap between a hint (tooltip or hover card) and its trigger, in pixels.
 *
 * @constant HINT_GUTTER
 * @type {number}
 */
export const HINT_GUTTER = 8;

/**
 * Edge of a tooltip's tail, in pixels. Zag adds half of it to the gap, so a
 * tooltip asks for `TOOLTIP_GUTTER` to land `HINT_GUTTER` from its trigger.
 *
 * @constant TOOLTIP_ARROW
 * @type {number}
 */
export const TOOLTIP_ARROW = 8;

/**
 * Gap a tooltip asks Zag for, its tail's half taken off `HINT_GUTTER`.
 *
 * @constant TOOLTIP_GUTTER
 * @type {number}
 */
export const TOOLTIP_GUTTER = HINT_GUTTER - TOOLTIP_ARROW / 2;

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
 * @property {number} [gutter] - Gap to the trigger in pixels. Defaults to `FLOATING_GUTTER`.
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
  readonly gutter?: number;
  readonly getRootNode: () => RootNode;
}

/**
 * Open-state and placement props every Zag floating machine takes.
 *
 * @interface FloatingMachineProps
 * @property {string} id - Instance id.
 * @property {boolean} [open] - Open state, when controlled or held.
 * @property {boolean} [defaultOpen] - First open state when uncontrolled.
 * @property {(details: { open: boolean }) => void} onOpenChange - Zag's open-state callback.
 * @property {{ placement?: Placement, strategy?: 'absolute' | 'fixed', gutter: number }} positioning - Zag's placement options.
 * @property {() => RootNode} getRootNode - Root node for Zag.
 */
export interface FloatingMachineProps {
  readonly id: string;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange: (details: { open: boolean }) => void;
  readonly positioning: {
    readonly placement?: Placement;
    readonly strategy?: 'absolute' | 'fixed';
    readonly gutter: number;
  };
  readonly getRootNode: () => RootNode;
}

/**
 * Builds the open-state and placement props every floating machine takes.
 *
 * @function floatingMachineProps
 * @param {FloatingMachineInput} input - Port input.
 * @returns {FloatingMachineProps} Machine props.
 */
export function floatingMachineProps(
  input: FloatingMachineInput,
): FloatingMachineProps {
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
      gutter: input.gutter ?? FLOATING_GUTTER,
    }),
    getRootNode: input.getRootNode,
  });
}
