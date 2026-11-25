/**
 * @fileoverview CSS colours for canvas code. Any CSS colour, `var()` and
 * `color-mix()` included, resolves through a 1×1 canvas, so no colour is
 * ever written in code: every one comes from a token.
 *
 * @module packages/core/src/feedback/canvas/color
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
 * @param {Document} [doc] - Document that makes the canvas. Defaults to the document of the window core was loaded in.
 * @returns {Rgb} Channels.
 */
export declare function resolveColor(value: string, doc?: Document): Rgb;
/**
 * Formats RGB plus alpha as an 8-digit hex colour.
 *
 * @function formatColor
 * @param {Rgb} rgb - Channels.
 * @param {number} alpha - Alpha, 0 to 1.
 * @returns {string} CSS colour.
 */
export declare function formatColor(rgb: Rgb, alpha: number): string;
/**
 * Mixes two colours channel by channel.
 *
 * @function mixRgb
 * @param {Rgb} from - From.
 * @param {Rgb} to - To.
 * @param {number} k - Weight of `to`, 0 to 1.
 * @returns {Rgb} Mixed.
 */
export declare function mixRgb(from: Rgb, to: Rgb, k: number): Rgb;
/**
 * Computes a CSS colour as `el` would paint it, so `light-dark()`,
 * `color-mix()` and system colours resolve under `el`'s colour scheme.
 * Returns `value` itself when it does not parse.
 *
 * @function computeColor
 * @param {Element} el - Element whose colour scheme applies.
 * @param {string} value - CSS colour.
 * @returns {string} Computed colour.
 */
export declare function computeColor(el: Element, value: string): string;
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
