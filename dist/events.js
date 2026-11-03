/**
 * @fileoverview Event prop names per framework, for core helpers that wrap
 * the props Zag hands a port.
 *
 * @module packages/core/src/events
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * React event prop names.
 *
 * @constant REACT_EVENTS
 * @type {EventNames}
 */
export const REACT_EVENTS = {
    focus: 'onFocus',
    blur: 'onBlur',
    keydown: 'onKeyDown',
};
/**
 * Svelte event prop names, as Zag's Svelte binding normalises them.
 *
 * @constant SVELTE_EVENTS
 * @type {EventNames}
 */
export const SVELTE_EVENTS = {
    focus: 'onfocusin',
    blur: 'onfocusout',
    keydown: 'onkeydown',
};
