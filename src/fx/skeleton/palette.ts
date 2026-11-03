/**
 * @fileoverview Skeleton colours, read from the `--skeleton-*` tokens
 * (canvas-fx R6) and spread into one tone per ramp level: the rest level is
 * the muted surface, the top level the second glint.
 *
 * @module packages/core/src/fx/skeleton/palette
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import {
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
  const v = readTokens(el, SKELETON_TOKENS);
  const surface = resolveColor(v['--skeleton-surface']);
  const glint1 = resolveColor(v['--skeleton-glint-1']);
  const glint2 = resolveColor(v['--skeleton-glint-2']);
  const stops: readonly (readonly [Rgb, number])[] = [
    [surface, 0.35],
    [surface, 0.85],
    [glint1, 0.9],
    [glint2, 0.95],
  ];
  const tones = Array.from({ length: LEVELS }, (_, l) => {
    const x = (l / (LEVELS - 1)) * 3;
    const i = Math.min(2, Math.floor(x));
    const f = x - i;
    const [c0, a0] = stops[i] ?? stops[0];
    const [c1, a1] = stops[i + 1] ?? stops[0];
    return formatColor(mixRgb(c0, c1, f), a0 + (a1 - a0) * f);
  });
  const p = {
    tones,
    front: formatColor(glint2, 1),
    bg: v['--skeleton-bg'] || 'transparent',
    font: v['--skeleton-glyph-font'] || 'serif',
  };
  return { ...p, key: JSON.stringify(p) };
}
