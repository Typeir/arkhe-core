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
 * Pen that records contours into one path, to be filled even-odd.
 *
 * @function pathPen
 * @param {PathTarget} path - Path, or a context's current path.
 * @returns {Pen} Pen.
 */
export function pathPen(path) {
    return {
        rect: (x, y, w, h) => path.rect(x, y, w, h),
        diamond: (cx, cy, h) => {
            path.moveTo(cx, cy - h);
            path.lineTo(cx + h, cy);
            path.lineTo(cx, cy + h);
            path.lineTo(cx - h, cy);
            path.closePath();
        },
        triangle: (cx, cy, h) => {
            path.moveTo(cx, cy - h);
            path.lineTo(cx + h, cy + h);
            path.lineTo(cx - h, cy + h);
            path.closePath();
        },
    };
}
