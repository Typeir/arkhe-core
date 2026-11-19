/**
 * @fileoverview The skeleton stamp atlas, one per DPR and palette: the
 * shape ramp in row 0, then the glyph set in the decode-front tone.
 *
 * @module packages/core/src/fx/skeleton/atlas
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import type { Palette } from './palette.js';
/**
 * A built atlas.
 *
 * @interface SkeletonAtlas
 * @property {HTMLCanvasElement} canvas - Source.
 * @property {number} cw - Cell width, device px.
 * @property {number} ch - Cell height, device px.
 * @property {(level: number) => readonly [number, number]} shape - Source x/y of a ramp level.
 * @property {(index: number) => readonly [number, number]} glyph - Source x/y of a glyph.
 */
export interface SkeletonAtlas {
    readonly canvas: HTMLCanvasElement;
    readonly cw: number;
    readonly ch: number;
    shape(level: number): readonly [number, number];
    glyph(index: number): readonly [number, number];
}
/**
 * Draws the atlas for `dpr` and `palette`.
 *
 * @function buildAtlas
 * @param {number} dpr - Backing scale.
 * @param {Palette} palette - Colours and glyph font.
 * @returns {SkeletonAtlas | null} Atlas; null without a 2D context.
 */
export declare function buildAtlas(dpr: number, palette: Palette): SkeletonAtlas | null;
