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
export function resolveColor(value: string): Rgb {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = value || 'transparent';
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0];
}

/**
 * Formats RGB plus alpha as an 8-digit hex colour.
 *
 * @function formatColor
 * @param {Rgb} c - Channels.
 * @param {number} alpha - Alpha, 0 to 1.
 * @returns {string} CSS colour.
 */
export function formatColor(c: Rgb, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  const hex = [...c, a]
    .map((n) => Math.round(n).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

/**
 * Mixes two colours channel by channel.
 *
 * @function mixRgb
 * @param {Rgb} a - From.
 * @param {Rgb} b - To.
 * @param {number} k - Weight of `b`, 0 to 1.
 * @returns {Rgb} Mixed.
 */
export function mixRgb(a: Rgb, b: Rgb, k: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
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
  const cs = getComputedStyle(el);
  return Object.fromEntries(
    names.map((name) => [name, cs.getPropertyValue(name).trim()]),
  ) as Record<K, string>;
}
