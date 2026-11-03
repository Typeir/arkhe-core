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
 * Event prop names in one framework.
 *
 * @interface EventNames
 * @property {string} focus - Focus prop.
 * @property {string} blur - Blur prop.
 * @property {string} keydown - Key-down prop.
 * @property {string} pointerdown - Pointer-down prop.
 * @property {string} click - Click prop.
 */
export interface EventNames {
  readonly focus: string;
  readonly blur: string;
  readonly keydown: string;
  readonly pointerdown: string;
  readonly click: string;
}

/**
 * React event prop names.
 *
 * @constant REACT_EVENTS
 * @type {EventNames}
 */
export const REACT_EVENTS: EventNames = {
  focus: 'onFocus',
  blur: 'onBlur',
  keydown: 'onKeyDown',
  pointerdown: 'onPointerDown',
  click: 'onClick',
};

/**
 * Svelte event prop names, as Zag's Svelte binding normalises them.
 *
 * @constant SVELTE_EVENTS
 * @type {EventNames}
 */
export const SVELTE_EVENTS: EventNames = {
  focus: 'onfocusin',
  blur: 'onfocusout',
  keydown: 'onkeydown',
  pointerdown: 'onpointerdown',
  click: 'onclick',
};
