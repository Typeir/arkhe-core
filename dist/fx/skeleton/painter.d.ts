/**
 * @fileoverview Skeleton painter: draws a region's cells into any view,
 * a tile canvas or the viewport canvas. Ahead of a decode front each cell
 * shows the shape ramp level the sweep gives it; inside the front, Greek
 * glyphs; behind it, nothing, so the real content shows through. At rest a
 * tile keeps its pixels and redraws only cells whose level changed.
 *
 * @module packages/core/src/fx/skeleton/painter
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { type Slice, type View } from '../../canvas/view.js';
import type { SkeletonAtlas } from './atlas.js';
import type { Palette } from './palette.js';
import type { SkeletonBox, SkeletonRegion } from './region.js';
/**
 * How shapes are drawn: stamped from the atlas, or batched `Path2D` fills.
 *
 * @typedef {'atlas' | 'path'} PainterKind
 */
export type PainterKind = 'atlas' | 'path';
/**
 * Painter settings the engine shares with every region.
 *
 * @interface SkeletonStyle
 * @property {PainterKind} painter - Shape painter.
 * @property {Palette} palette - Colours; replaced on a theme change.
 * @property {(dpr: number) => SkeletonAtlas | null} atlas - Stamp atlas for a backing scale.
 */
export interface SkeletonStyle {
    readonly painter: PainterKind;
    palette: Palette;
    atlas(dpr: number): SkeletonAtlas | null;
}
/**
 * Last level drawn per cell of each shape; 255 is unknown.
 *
 * @typedef {Map<SkeletonBox, Uint8Array>} DrawnCells
 */
export type DrawnCells = Map<SkeletonBox, Uint8Array>;
/**
 * Paints shapes `idx` of `g` into `v`.
 *
 * @function paintSkeleton
 * @param {SkeletonRegion} g - Region.
 * @param {readonly number[]} idx - Shape indices.
 * @param {View} v - Target.
 * @param {number} t - Time, ms.
 * @param {DrawnCells} [drawn] - Levels already on the canvas; given only when its pixels were kept.
 * @returns {void}
 */
export declare function paintSkeleton(g: SkeletonRegion, idx: readonly number[], v: View, t: number, drawn?: DrawnCells): void;
/**
 * The shapes of one region a canvas draws.
 *
 * @class SkeletonSlice
 */
export declare class SkeletonSlice implements Slice {
    private readonly region;
    readonly idx: readonly number[];
    private readonly drawn;
    /**
     * @param {SkeletonRegion} region - Region.
     * @param {readonly number[]} idx - Shape indices it draws.
     */
    constructor(region: SkeletonRegion, idx: readonly number[]);
    /**
     * Pixels may be kept until the content is swapped in.
     *
     * @returns {boolean} Retains.
     */
    get retains(): boolean;
    /**
     * Starts the shapes in view.
     *
     * @param {number} t - Now.
     * @param {number} top - View top, host-local.
     * @param {number} bottom - View bottom, host-local.
     * @returns {void}
     */
    start(t: number, top: number, bottom: number): void;
    /**
     * True while any shape has not finished decoding.
     *
     * @param {number} t - Now.
     * @returns {boolean} Pending.
     */
    pending(t: number): boolean;
    /**
     * True when a shape in [top, bottom) still changes. Rows out of view
     * never keep the loop running; under reduced motion nothing does.
     *
     * @param {number} t - Now.
     * @param {number} top - View top, host-local.
     * @param {number} bottom - View bottom, host-local.
     * @returns {boolean} Animating.
     */
    animating(t: number, top: number, bottom: number): boolean;
    /**
     * When the last started decode ends; Infinity while one has not started.
     *
     * @returns {number} Time, ms.
     */
    settlesAt(): number;
    /**
     * Paints; forgets the kept levels when the canvas was cleared.
     *
     * @param {View} view - Target.
     * @param {number} t - Now.
     * @param {boolean} keep - The last frame's pixels are still there.
     * @returns {void}
     */
    paint(view: View, t: number, keep: boolean): void;
}
