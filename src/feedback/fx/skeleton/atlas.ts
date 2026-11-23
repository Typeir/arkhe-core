/**
 * @fileoverview The skeleton stamp atlas, one per DPR and palette: the
 * shape ramp in row 0, then the glyph set in the decode-front tone.
 *
 * @module packages/core/src/feedback/fx/skeleton/atlas
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { Palette } from './palette.js';
import { createStampGrid } from '../../canvas/draw/atlas.js';
import { pathPen } from '../../canvas/draw/pen.js';
import { CELL_H, CELL_W, GLYPHS, LEVELS } from './constants.js';
import { RAMP } from './ramp.js';

/**
 * Cells per atlas row.
 *
 * @constant COLS
 * @type {number}
 */
const COLS = 16;

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
  shape: (level: number) => readonly [number, number];
  glyph: (index: number) => readonly [number, number];
}

/**
 * Draws the atlas for `dpr` and `palette`.
 *
 * @function buildAtlas
 * @param {number} dpr - Backing scale.
 * @param {Palette} palette - Colours and glyph font.
 * @param {Document} [doc] - Document that makes the canvas. Defaults to the document of the window core was loaded in.
 * @returns {SkeletonAtlas | null} Atlas; null without a 2D context.
 */
export function buildAtlas(
  dpr: number,
  palette: Palette,
  doc?: Document,
): SkeletonAtlas | null {
  const cw = Math.ceil(CELL_W * dpr);
  const ch = Math.ceil(CELL_H * dpr);
  const glyphs = [...GLYPHS];
  const glyphRows = Math.ceil(glyphs.length / COLS);
  const grid = createStampGrid(COLS, 1 + glyphRows, cw, ch, doc);
  if (!grid) return null;
  const ctx = grid.ctx;
  const pen = pathPen(ctx);
  for (let level = 0; level < LEVELS; level += 1) {
    const [x, y] = grid.at(level, 0);
    ctx.setTransform(dpr, 0, 0, dpr, x, y);
    ctx.fillStyle = palette.tones[level] ?? palette.front;
    ctx.beginPath();
    RAMP[level]?.(pen, CELL_W / 2, CELL_H / 2);
    ctx.fill('evenodd');
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `${CELL_H - 1}px ${palette.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.front;
  for (const [i, glyph] of glyphs.entries()) {
    const [x, y] = grid.at(i, 1);
    ctx.fillText(glyph, x / dpr + CELL_W / 2, y / dpr + CELL_H / 2 + 0.5);
  }
  return {
    canvas: grid.canvas,
    cw,
    ch,
    shape: (level) => grid.at(level, 0),
    glyph: (index) => grid.at(index, 1),
  };
}
