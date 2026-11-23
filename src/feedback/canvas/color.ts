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

import { windowOf } from '../../base/dom.js';

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
export function resolveColor(value: string, doc?: Document): Rgb {
  const canvas = (doc ?? windowOf().document).createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = value || 'transparent';
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
}

/**
 * Formats RGB plus alpha as an 8-digit hex colour.
 *
 * @function formatColor
 * @param {Rgb} rgb - Channels.
 * @param {number} alpha - Alpha, 0 to 1.
 * @returns {string} CSS colour.
 */
export function formatColor(rgb: Rgb, alpha: number): string {
  const alphaByte = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  const hex = [...rgb, alphaByte]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

/**
 * Mixes two colours channel by channel.
 *
 * @function mixRgb
 * @param {Rgb} from - From.
 * @param {Rgb} to - To.
 * @param {number} k - Weight of `to`, 0 to 1.
 * @returns {Rgb} Mixed.
 */
export function mixRgb(from: Rgb, to: Rgb, k: number): Rgb {
  return [
    Math.round(from[0] + (to[0] - from[0]) * k),
    Math.round(from[1] + (to[1] - from[1]) * k),
    Math.round(from[2] + (to[2] - from[2]) * k),
  ];
}

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
export function computeColor(el: Element, value: string): string {
  if (!value) return value;
  const probe = el.ownerDocument.createElement('span');
  probe.style.display = 'none';
  probe.style.color = value;
  if (!probe.style.color) return value;
  el.append(probe);
  const color = windowOf(el).getComputedStyle(probe).color;
  probe.remove();
  return color || value;
}

/**
 * Reads custom properties from `el`'s computed style, trimmed.
 *
 * @function readTokens
 * @template {string} K
 * @param {Element} el - Element whose tokens apply.
 * @param {readonly K[]} names - Property names, e.g. `--skeleton-surface`.
 * @returns {Record<K, string>} Values; empty when unset.
 */
export function readTokens<K extends string>(
  el: Element,
  names: readonly K[],
): Record<K, string> {
  const style = windowOf(el).getComputedStyle(el);
  return Object.fromEntries(
    names.map((name) => [name, style.getPropertyValue(name).trim()]),
  ) as Record<K, string>;
}
