/**
 * @fileoverview One `requestAnimationFrame` loop for every canvas surface.
 * It runs only while something animates and cancels itself otherwise. It
 * can cap its rate, lift the cap for a while (scrolling), keep off-screen
 * work to spare frame time, and step its rate down when frames run slow.
 *
 * @module packages/core/src/canvas/loop
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

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

const WINDOW = 60;
const SLOW_LIMIT = 15;

/**
 * Something the loop draws.
 *
 * @interface Frameable
 * @property {(t: number) => boolean} frame - Draws at time `t`; false once it stops animating.
 * @property {boolean} [idle] - Off-screen work, run only while frame time is left.
 */
export interface Frameable {
  frame(t: number): boolean;
  readonly idle?: boolean;
}

/**
 * Shared frame loop.
 *
 * @class FrameLoop
 */
export class FrameLoop {
  private readonly active = new Set<Frameable>();
  private handle = 0;
  private last = -Infinity;
  private slow = 0;
  private seen = 0;
  private tiers: readonly number[] = [];
  frames = 0;
  drawMs = 0;
  minInterval = 0;
  uncapUntil = 0;
  tier = 0;
  onSlow: (() => void) | null = null;

  /**
   * @param {(cb: FrameRequestCallback) => number} [raf] - Frame request.
   * @param {(id: number) => void} [caf] - Frame cancel.
   * @param {() => number} [now] - Clock for draw timing.
   */
  constructor(
    private readonly raf: (cb: FrameRequestCallback) => number = (cb) =>
      requestAnimationFrame(cb),
    private readonly caf: (id: number) => void = (id) =>
      cancelAnimationFrame(id),
    private readonly now: () => number = () => performance.now(),
  ) {}

  /**
   * True while a frame is pending.
   *
   * @returns {boolean} Running.
   */
  get running(): boolean {
    return this.handle !== 0;
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
    this.tiers = tiers;
    this.onSlow = this.degrade;
  }

  /**
   * Adds a surface and starts the loop if needed.
   *
   * @param {Frameable} f - Surface.
   * @returns {void}
   */
  add(f: Frameable): void {
    this.active.add(f);
    if (!this.handle) this.handle = this.raf(this.tick);
  }

  /**
   * Removes a surface; the loop stops on its own when none are left.
   *
   * @param {Frameable} f - Surface.
   * @returns {void}
   */
  delete(f: Frameable): void {
    this.active.delete(f);
  }

  /**
   * Stops everything.
   *
   * @returns {void}
   */
  clear(): void {
    this.active.clear();
    if (this.handle) this.caf(this.handle);
    this.handle = 0;
  }

  private readonly degrade = (): void => {
    const fps = this.tiers[this.tier];
    if (fps === undefined) return;
    this.minInterval = Math.max(this.minInterval, 1000 / fps);
    this.tier += 1;
  };

  private readonly tick = (t: number): void => {
    this.handle = 0;
    const interval = t < this.uncapUntil ? 0 : this.minInterval;
    if (t - this.last < interval - 2) {
      this.handle = this.raf(this.tick);
      return;
    }
    this.watch(t - this.last);
    this.last = t;
    const a = this.now();
    for (const f of [...this.active]) {
      if (f.idle && this.now() - a > IDLE_BUDGET) continue;
      if (!f.frame(t)) this.active.delete(f);
    }
    this.drawMs += this.now() - a;
    this.frames += 1;
    if (this.active.size && !this.handle) this.handle = this.raf(this.tick);
    else if (!this.active.size) this.last = -Infinity;
  };

  private watch(gap: number): void {
    if (!this.onSlow || !Number.isFinite(gap)) return;
    const budget = Math.max(this.minInterval, 1000 / 60);
    this.seen += 1;
    if (gap > budget * 1.5 + 2) this.slow += 1;
    if (this.seen < WINDOW) return;
    if (this.slow > SLOW_LIMIT) this.onSlow();
    this.seen = 0;
    this.slow = 0;
  }
}
