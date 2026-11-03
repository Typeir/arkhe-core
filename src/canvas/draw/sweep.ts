/**
 * @fileoverview Easing and a diagonal sweep: a soft band that crosses a
 * region on a fixed period. Time is in ms, so the look does not depend on
 * the refresh rate.
 *
 * @module packages/core/src/canvas/draw/sweep
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

/**
 * Shape of a sweep.
 *
 * @interface SweepShape
 * @property {number} period - Time to cross the region, ms.
 * @property {number} slope - Horizontal shift per px down (tan of the tilt).
 * @property {number} half - Half-width of the band, CSS px.
 */
export interface SweepShape {
  readonly period: number;
  readonly slope: number;
  readonly half: number;
}

/**
 * Ease in-out, quadratic.
 *
 * @function easeInOutQuad
 * @param {number} p - Progress, 0 to 1.
 * @returns {number} Eased progress.
 */
export function easeInOutQuad(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
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
export function diagonalSweep(
  x: number,
  y: number,
  t: number,
  w: number,
  span: number,
  shape: SweepShape,
): number {
  const { period, slope, half } = shape;
  const cx =
    -half +
    easeInOutQuad((t % period) / period) * (w + 2 * half + span * slope);
  const d = Math.abs(x - cx + (y % span) * slope);
  return d >= half ? 0 : 1 - d / half;
}
