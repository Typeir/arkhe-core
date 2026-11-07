/**
 * @fileoverview CSS colours for canvas code. Any CSS colour, `var()` and
 * `color-mix()` included, resolves through a 1×1 canvas, so no colour is
 * ever written in code: every one comes from a token.
 *
 * @module packages/core/src/canvas/color
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Red, green and blue channels, 0 to 255.
 *
 * @typedef {readonly [number, number, number]} Rgb
 */
export type Rgb = readonly [number, number, number];
/**
 * Resolves a CSS colour to RGB. An empty or invalid value is black.
 *
 * @function resolveColor
 * @param {string} value - CSS colour.
 * @returns {Rgb} Channels.
 */
export declare function resolveColor(value: string): Rgb;
/**
 * Formats RGB plus alpha as an 8-digit hex colour.
 *
 * @function formatColor
 * @param {Rgb} c - Channels.
 * @param {number} alpha - Alpha, 0 to 1.
 * @returns {string} CSS colour.
 */
export declare function formatColor(c: Rgb, alpha: number): string;
/**
 * Mixes two colours channel by channel.
 *
 * @function mixRgb
 * @param {Rgb} a - From.
 * @param {Rgb} b - To.
 * @param {number} k - Weight of `b`, 0 to 1.
 * @returns {Rgb} Mixed.
 */
export declare function mixRgb(a: Rgb, b: Rgb, k: number): Rgb;
/**
 * Reads custom properties from `el`'s computed style, trimmed.
 *
 * @function readTokens
 * @template {string} K
 * @param {Element} el - Element whose tokens apply.
 * @param {readonly K[]} names - Property names, e.g. `--skeleton-surface`.
 * @returns {Record<K, string>} Values; empty when unset.
 */
export declare function readTokens<K extends string>(el: Element, names: readonly K[]): Record<K, string>;
