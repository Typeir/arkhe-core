/**
 * @fileoverview Easing and a diagonal sweep: a soft band that crosses a
 * region on a fixed period. Time is in ms, so the look does not depend on
 * the refresh rate.
 *
 * @module packages/core/src/feedback/canvas/draw/sweep
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Ease in-out, quadratic.
 *
 * @function easeInOutQuad
 * @param {number} progress - Progress, 0 to 1.
 * @returns {number} Eased progress.
 */
export function easeInOutQuad(progress) {
    return progress < 0.5
        ? 2 * progress * progress
        : 1 - (-2 * progress + 2) ** 2 / 2;
}
/**
 * Sweep intensity at a region-local point: a tilted band crossing a region
 * `w` wide once per period; tall regions repeat it every `span` px.
 *
 * @function diagonalSweep
 * @param {number} x - Region-local x.
 * @param {number} y - Region-local y.
 * @param {number} t - Time, ms.
 * @param {number} w - Region width.
 * @param {number} span - Repeat height.
 * @param {SweepShape} shape - Period, slope and half-width.
 * @returns {number} Intensity in [0, 1].
 */
export function diagonalSweep(x, y, t, w, span, shape) {
    const { period, slope, half } = shape;
    const cx = -half +
        easeInOutQuad((t % period) / period) * (w + 2 * half + span * slope);
    const distance = Math.abs(x - cx + (y % span) * slope);
    return distance >= half ? 0 : 1 - distance / half;
}
