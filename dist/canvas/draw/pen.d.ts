/**
 * @fileoverview A pen records contours only, so one shape definition feeds
 * both stamp atlases and batched `Path2D` fills. Outlines are drawn as an
 * outer and an inner contour filled even-odd, never as strokes: strokes
 * were the main raster cost.
 *
 * @module packages/core/src/canvas/draw/pen
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Drawing target for contours.
 *
 * @interface Pen
 * @property {(x: number, y: number, w: number, h: number) => void} rect - Axis-aligned rectangle.
 * @property {(cx: number, cy: number, h: number) => void} diamond - Rhombus of half-size `h`.
 * @property {(cx: number, cy: number, h: number) => void} triangle - Upward triangle of half-size `h`.
 */
export interface Pen {
    rect(x: number, y: number, w: number, h: number): void;
    diamond(cx: number, cy: number, h: number): void;
    triangle(cx: number, cy: number, h: number): void;
}
/**
 * Anything that takes path commands: a `Path2D` or a context's current path.
 *
 * @typedef {Path2D | CanvasRenderingContext2D} PathTarget
 */
export type PathTarget = Path2D | CanvasRenderingContext2D;
/**
 * Pen that records contours into one path, to be filled even-odd.
 *
 * @function pathPen
 * @param {PathTarget} path - Path, or a context's current path.
 * @returns {Pen} Pen.
 */
export declare function pathPen(path: PathTarget): Pen;
