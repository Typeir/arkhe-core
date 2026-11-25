/**
 * @fileoverview Event prop names per framework, for core helpers that wrap
 * the props Zag hands a port.
 *
 * @module packages/core/src/base/events
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
 * @property {string} pointerleave - Pointer-leave prop.
 * @property {string} pointerover - Pointer-over prop.
 * @property {string} click - Click prop.
 */
export interface EventNames {
  readonly focus: string;
  readonly blur: string;
  readonly keydown: string;
  readonly pointerdown: string;
  readonly pointerleave: string;
  readonly pointerover: string;
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
  pointerleave: 'onPointerLeave',
  pointerover: 'onPointerOver',
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
  pointerleave: 'onpointerleave',
  pointerover: 'onpointerover',
  click: 'onclick',
};
