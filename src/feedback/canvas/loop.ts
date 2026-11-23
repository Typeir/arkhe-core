/**
 * @fileoverview One `requestAnimationFrame` loop for every canvas surface.
 * It runs only while something animates and cancels itself otherwise. It
 * can cap its rate, lift the cap for a while (scrolling), keep off-screen
 * work to spare frame time, and step its rate down when frames run slow.
 *
 * @module packages/core/src/feedback/canvas/loop
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { windowOf } from '../../base/dom.js';

/**
 * Frame time, in ms, after which off-screen work waits for a later frame.
 *
 * @constant IDLE_BUDGET
 * @type {number}
 */
export const IDLE_BUDGET = 6;

/**
 * Rates the watchdog steps down to, in frames per second, in order.
 *
 * @constant WATCHDOG_TIERS
 * @type {readonly number[]}
 */
export const WATCHDOG_TIERS: readonly number[] = [15, 5];

/**
 * Frames the watchdog judges at a time.
 *
 * @constant WINDOW
 * @type {number}
 */
const WINDOW = 60;

/**
 * Slow frames out of `WINDOW` that step the rate down.
 *
 * @constant SLOW_LIMIT
 * @type {number}
 */
const SLOW_LIMIT = 15;

/**
 * Something the loop draws.
 *
 * @interface Frameable
 * @property {(t: number) => boolean} frame - Draws at time `t`; false once it stops animating.
 * @property {boolean} [idle] - Off-screen work, run only while frame time is left.
 */
export interface Frameable {
  frame: (t: number) => boolean;
  readonly idle?: boolean;
}

/**
 * Shared frame loop.
 *
 * @class FrameLoop
 */
export class FrameLoop {
  /**
   * Surfaces drawn each frame.
   *
   * @type {Set<Frameable>}
   */
  readonly #active = new Set<Frameable>();
  /**
   * Pending frame request; null while none is pending.
   *
   * @type {number | null}
   */
  #handle: number | null = null;
  /**
   * Time of the last drawn frame; -Infinity once the loop has stopped.
   *
   * @type {number}
   */
  #last = -Infinity;
  /**
   * Slow frames in the current watchdog window.
   *
   * @type {number}
   */
  #slow = 0;
  /**
   * Frames in the current watchdog window.
   *
   * @type {number}
   */
  #seen = 0;
  /**
   * Rates the watchdog steps down to, in frames per second.
   *
   * @type {readonly number[]}
   */
  #tiers: readonly number[] = [];
  /**
   * Frames drawn since the last stats reset.
   *
   * @type {number}
   */
  frames = 0;
  /**
   * Time spent drawing since the last stats reset, ms.
   *
   * @type {number}
   */
  drawMs = 0;
  /**
   * Shortest time between frames, ms; 0 for the display rate.
   *
   * @type {number}
   */
  minInterval = 0;
  /**
   * Time until which the rate cap is lifted, as while scrolling.
   *
   * @type {number}
   */
  uncapUntil = 0;
  /**
   * Watchdog steps taken so far.
   *
   * @type {number}
   */
  tier = 0;
  /**
   * Called when too many frames in a window ran slow; null without a
   * watchdog.
   *
   * @type {(() => void) | null}
   */
  onSlow: (() => void) | null = null;
  /**
   * Requests a frame.
   *
   * @type {(callback: FrameRequestCallback) => number}
   */
  readonly #raf: (callback: FrameRequestCallback) => number;
  /**
   * Cancels a frame request.
   *
   * @type {(id: number) => void}
   */
  readonly #caf: (id: number) => void;
  /**
   * Clock for draw timing.
   *
   * @type {() => number}
   */
  readonly #now: () => number;

  /**
   * @param {(callback: FrameRequestCallback) => number} [raf] - Frame request. Defaults to the frame request of the window core was loaded in.
   * @param {(id: number) => void} [caf] - Frame cancel. Defaults to the frame cancel of the window core was loaded in.
   * @param {() => number} [now] - Clock for draw timing. Defaults to `performance.now`.
   */
  constructor(
    raf: (callback: FrameRequestCallback) => number = (callback) =>
      windowOf().requestAnimationFrame(callback),
    caf: (id: number) => void = (id) => {
      windowOf().cancelAnimationFrame(id);
    },
    now: () => number = () => performance.now(),
  ) {
    this.#raf = raf;
    this.#caf = caf;
    this.#now = now;
  }

  /**
   * True while a frame is pending.
   *
   * @returns {boolean} Running.
   */
  get running(): boolean {
    return this.#handle !== null;
  }

  /**
   * Caps the rate at `fps`; 0 or less removes the cap.
   *
   * @param {number} fps - Frames per second.
   * @returns {void}
   */
  cap(fps: number): void {
    this.minInterval = fps > 0 ? 1000 / fps : 0;
  }

  /**
   * Steps the rate down through `tiers` each time more than 15 of 60
   * frames clearly miss their budget (`> 1.5 × budget + 2 ms`).
   *
   * @param {readonly number[]} [tiers] - Rates, in frames per second.
   * @returns {void}
   */
  watchdog(tiers: readonly number[] = WATCHDOG_TIERS): void {
    this.#tiers = tiers;
    this.onSlow = this.#degrade;
  }

  /**
   * Adds a surface and starts the loop if needed.
   *
   * @param {Frameable} surface - Surface.
   * @returns {void}
   */
  add(surface: Frameable): void {
    this.#active.add(surface);
    this.#handle ??= this.#raf(this.#tick);
  }

  /**
   * Removes a surface; the loop stops on its own when none are left.
   *
   * @param {Frameable} surface - Surface.
   * @returns {void}
   */
  delete(surface: Frameable): void {
    this.#active.delete(surface);
  }

  /**
   * Stops everything.
   *
   * @returns {void}
   */
  clear(): void {
    this.#active.clear();
    if (this.#handle !== null) this.#caf(this.#handle);
    this.#handle = null;
  }

  /**
   * Steps the rate down to the next watchdog tier, if one is left.
   *
   * @returns {void}
   */
  readonly #degrade = (): void => {
    const fps = this.#tiers[this.tier];
    if (fps === undefined) return;
    this.minInterval = Math.max(this.minInterval, 1000 / fps);
    this.tier += 1;
  };

  /**
   * Runs one frame: waits out the rate cap, then draws every surface,
   * dropping those that stop animating and skipping off-screen work once
   * the idle budget is spent.
   *
   * @param {number} t - Frame time.
   * @returns {void}
   */
  readonly #tick = (t: number): void => {
    this.#handle = null;
    const interval = t < this.uncapUntil ? 0 : this.minInterval;
    if (t - this.#last < interval - 2) {
      this.#handle = this.#raf(this.#tick);
      return;
    }
    this.#watch(t - this.#last);
    this.#last = t;
    const start = this.#now();
    for (const surface of [...this.#active]) {
      if (surface.idle && this.#now() - start > IDLE_BUDGET) continue;
      if (!surface.frame(t)) this.#active.delete(surface);
    }
    this.drawMs += this.#now() - start;
    this.frames += 1;
    if (this.#active.size && this.#handle === null) {
      this.#handle = this.#raf(this.#tick);
    } else if (!this.#active.size) {
      this.#last = -Infinity;
    }
  };

  /**
   * Counts a frame gap towards the watchdog window and calls `onSlow`
   * when the window ends with too many slow frames.
   *
   * @param {number} gap - Time since the last frame, ms.
   * @returns {void}
   */
  #watch(gap: number): void {
    if (!this.onSlow || !Number.isFinite(gap)) return;
    const budget = Math.max(this.minInterval, 1000 / 60);
    this.#seen += 1;
    if (gap > budget * 1.5 + 2) this.#slow += 1;
    if (this.#seen < WINDOW) return;
    if (this.#slow > SLOW_LIMIT) this.onSlow();
    this.#seen = 0;
    this.#slow = 0;
  }
}
