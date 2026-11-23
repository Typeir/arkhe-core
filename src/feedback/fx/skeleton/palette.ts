/**
 * @fileoverview Skeleton colours, read from the `--skeleton-*` tokens
 * (canvas-fx R6) and spread into one tone per ramp level: the rest level is
 * the muted surface, the top level the second glint.
 *
 * @module packages/core/src/feedback/fx/skeleton/palette
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import {
  computeColor,
  formatColor,
  mixRgb,
  readTokens,
  resolveColor,
  type Rgb,
} from '../../canvas/color.js';
import { LEVELS } from './constants.js';

/**
 * Colours the painter needs.
 *
 * @interface Palette
 * @property {string} key - Identity for caches.
 * @property {readonly string[]} tones - One fill per ramp level, rest first.
 * @property {string} front - Glyphs at a decode front.
 * @property {string} bg - Cover behind cells once the real content is under them.
 * @property {string} font - Glyph font family.
 */
export interface Palette {
  readonly key: string;
  readonly tones: readonly string[];
  readonly front: string;
  readonly bg: string;
  readonly font: string;
}

/**
 * Tokens the palette reads.
 *
 * @constant SKELETON_TOKENS
 * @type {readonly string[]}
 */
export const SKELETON_TOKENS = [
  '--skeleton-surface',
  '--skeleton-glint-1',
  '--skeleton-glint-2',
  '--skeleton-bg',
  '--skeleton-glyph-font',
] as const;

/**
 * Reads the palette from `el`'s computed tokens.
 *
 * @function readPalette
 * @param {Element} el - Element whose tokens apply.
 * @returns {Palette} Palette.
 */
export function readPalette(el: Element): Palette {
  const tokens = readTokens(el, SKELETON_TOKENS);
  const color = (name: (typeof SKELETON_TOKENS)[number]) =>
    resolveColor(computeColor(el, tokens[name]), el.ownerDocument);
  const surface = color('--skeleton-surface');
  const glint1 = color('--skeleton-glint-1');
  const glint2 = color('--skeleton-glint-2');
  const stops: readonly (readonly [Rgb, number])[] = [
    [surface, 0.35],
    [surface, 0.85],
    [glint1, 0.9],
    [glint2, 0.95],
  ];
  const tones = [...Array(LEVELS).keys()].map((level) => {
    const x = (level / (LEVELS - 1)) * 3;
    const i = Math.min(2, Math.floor(x));
    const weight = x - i;
    const [c0, a0] = stops[i] ?? stops[0];
    const [c1, a1] = stops[i + 1] ?? stops[0];
    return formatColor(mixRgb(c0, c1, weight), a0 + (a1 - a0) * weight);
  });
  const colors = {
    tones,
    front: formatColor(glint2, 1),
    bg: computeColor(el, tokens['--skeleton-bg']) || 'transparent',
    font: tokens['--skeleton-glyph-font'] || 'serif',
  };
  return { ...colors, key: JSON.stringify(colors) };
}
