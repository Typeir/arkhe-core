/**
 * @fileoverview Machine props shared by every floating part: tooltip, hover
 * card, popover, menu. Zag places them through floating-ui (ruling Q13).
 *
 * @module packages/core/src/floating
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { definedOnly } from './machine.js';
/**
 * Gap between trigger and floating part, in pixels.
 *
 * @constant FLOATING_GUTTER
 * @type {number}
 */
export const FLOATING_GUTTER = 6;
/**
 * Builds the open-state and placement props every floating machine takes.
 *
 * @function floatingMachineProps
 * @param {FloatingMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function floatingMachineProps(input) {
    return definedOnly({
        id: input.id,
        open: input.hold ? true : input.open,
        defaultOpen: input.defaultOpen,
        onOpenChange: (details) => {
            if (input.hold && !details.open)
                return;
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
