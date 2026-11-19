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
export declare const SKELETON_TOKENS: readonly ["--skeleton-surface", "--skeleton-glint-1", "--skeleton-glint-2", "--skeleton-bg", "--skeleton-glyph-font"];
/**
 * Reads the palette from `el`'s computed tokens.
 *
 * @function readPalette
 * @param {Element} el - Element whose tokens apply.
 * @returns {Palette} Palette.
 */
export declare function readPalette(el: Element): Palette;
