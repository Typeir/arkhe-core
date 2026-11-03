/**
 * @fileoverview Public shape of the effect engine: its options and their
 * ruled defaults (canvas-fx R15), the calls an owner makes, its stats, and
 * the inert engine used where canvases cannot run (no observers, forced
 * colours), which reveals at once and leaves the CSS skeleton in place.
 *
 * @module packages/core/src/fx/api
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { PainterKind } from './skeleton/painter.js';

/**
 * Engine options.
 *
 * @interface FxOptions
 * @property {'grouped' | 'viewport' | 'auto'} surface - Canvases in each owner, one viewport canvas, or chosen by the acceleration probe.
 * @property {number} maxFps - Effect frame cap; 0 for the display rate.
 * @property {boolean} watchdog - Step the rate down to 15, then 5 fps, when frames run slow.
 * @property {PainterKind} painter - Shape painter.
 * @property {'keep' | 'release'} sleep - Whether a tile outside the wake margin keeps its canvas.
 * @property {number} wakeMargin - Wake margin, in viewport heights.
 * @property {number} maxCanvases - Live canvas budget.
 * @property {number} pixelBudget - Device pixel budget, in screens.
 * @property {number} bandScale - Tile height, in viewport heights.
 * @property {number} maxDpr - Highest backing scale.
 */
export interface FxOptions {
  readonly surface: 'grouped' | 'viewport' | 'auto';
  readonly maxFps: number;
  readonly watchdog: boolean;
  readonly painter: PainterKind;
  readonly sleep: 'keep' | 'release';
  readonly wakeMargin: number;
  readonly maxCanvases: number;
  readonly pixelBudget: number;
  readonly bandScale: number;
  readonly maxDpr: number;
}

/**
 * Ruled defaults (canvas-fx R15).
 *
 * @constant DEFAULT_FX_OPTIONS
 * @type {FxOptions}
 */
export const DEFAULT_FX_OPTIONS: FxOptions = {
  surface: 'auto',
  maxFps: 30,
  watchdog: true,
  painter: 'path',
  sleep: 'keep',
  wakeMargin: 1,
  maxCanvases: 24,
  pixelBudget: 4,
  bandScale: 1,
  maxDpr: 2,
};

/**
 * Attribute set on an owner once a canvas has painted it; the CSS skeleton
 * goes transparent under it.
 *
 * @constant PAINTED_ATTR
 * @type {string}
 */
export const PAINTED_ATTR = 'data-painted';

/**
 * Engine counters, for tests and tuning.
 *
 * @typedef {Readonly<Record<string, number>>} FxStats
 */
export type FxStats = Readonly<Record<string, number>>;

/**
 * What an owner calls. The engine never sets framework state.
 *
 * @interface Fx
 * @property {(host: HTMLElement) => void} attach - Measures `host`'s skeleton and starts animating it; again re-measures.
 * @property {(host: HTMLElement, onRevealed?: () => void) => void} ready - The content is in; reveal it, covered in this task.
 * @property {(host: HTMLElement) => void} detach - Drops `host` without revealing.
 * @property {() => FxStats} stats - Counters.
 * @property {() => void} resetStats - Restarts the counters.
 * @property {() => void} destroy - Removes every canvas, observer and listener.
 */
export interface Fx {
  attach(host: HTMLElement): void;
  ready(host: HTMLElement, onRevealed?: () => void): void;
  detach(host: HTMLElement): void;
  stats(): FxStats;
  resetStats(): void;
  destroy(): void;
}

/**
 * True where the engine can run: a browser with observers and media queries.
 *
 * @function canRunFx
 * @returns {boolean} Capable.
 */
export function canRunFx(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    typeof window.IntersectionObserver === 'function' &&
    typeof window.ResizeObserver === 'function' &&
    typeof window.requestAnimationFrame === 'function'
  );
}

/**
 * Engine that draws nothing: the CSS skeleton stays, and reveals end at once.
 *
 * @class InertFx
 */
export class InertFx implements Fx {
  /**
   * Does nothing.
   *
   * @returns {void}
   */
  attach(): void {}

  /**
   * Reports the reveal as finished.
   *
   * @param {HTMLElement} _host - Owner.
   * @param {() => void} [onRevealed] - Called now.
   * @returns {void}
   */
  ready(_host: HTMLElement, onRevealed?: () => void): void {
    onRevealed?.();
  }

  /**
   * Does nothing.
   *
   * @returns {void}
   */
  detach(): void {}

  /**
   * Counters of an engine that never runs.
   *
   * @returns {FxStats} Zeroes.
   */
  stats(): FxStats {
    return { frames: 0, running: 0, regions: 0, liveCanvases: 0 };
  }

  /**
   * Does nothing.
   *
   * @returns {void}
   */
  resetStats(): void {}

  /**
   * Does nothing.
   *
   * @returns {void}
   */
  destroy(): void {}
}
