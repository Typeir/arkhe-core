/**
 * @fileoverview Machine props shared by every floating part: tooltip, hover
 * card, popover, menu. Zag places them through floating-ui (ruling Q13).
 *
 * @module packages/core/src/overlay/floating
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { definedOnly } from '../base/machine.js';
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
 * Builds the open-state and placement props every floating machine takes.
 *
 * @function floatingMachineProps
 * @param {FloatingMachineInput} input - Port input.
 * @returns {FloatingMachineProps} Machine props.
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
            gutter: input.gutter ?? FLOATING_GUTTER,
        }),
        getRootNode: input.getRootNode,
    });
}
