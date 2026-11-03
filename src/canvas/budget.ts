/**
 * @fileoverview Budget of live canvases and device pixels, one per app and
 * shared by every canvas feature. It grants backing stores and evicts the
 * least recently seen holder, sleeping ones first. It bounds what is kept
 * off screen: a visible requester is always granted, even past the budget,
 * once every off-screen holder is gone, as PDF.js treats visible pages.
 *
 * @module packages/core/src/canvas/budget
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

/**
 * Something that can hold a budgeted canvas.
 *
 * @interface BudgetClient
 * @property {boolean} asleep - Outside the wake margin.
 * @property {boolean} visible - On screen; never evicted.
 * @property {number} lastSeen - Time it last woke.
 * @property {() => void} evict - Drops its canvas; must call `release`.
 */
export interface BudgetClient {
  readonly asleep: boolean;
  readonly visible: boolean;
  readonly lastSeen: number;
  evict(): void;
}

/**
 * Canvas budget.
 *
 * @class CanvasBudget
 */
export class CanvasBudget {
  private readonly held = new Map<BudgetClient, number>();
  private pixels = 0;
  peakCount = 0;
  peakPixels = 0;

  /**
   * @param {number} maxCount - Live canvas budget.
   * @param {number} maxPixels - Device pixel budget.
   */
  constructor(
    readonly maxCount: number,
    public maxPixels: number,
  ) {}

  /**
   * Live canvases.
   *
   * @returns {number} Count.
   */
  get count(): number {
    return this.held.size;
  }

  /**
   * Live device pixels.
   *
   * @returns {number} Pixels.
   */
  get livePixels(): number {
    return this.pixels;
  }

  /**
   * True while visible holders keep the budget overspent.
   *
   * @returns {boolean} Over budget.
   */
  get over(): boolean {
    return this.held.size > this.maxCount || this.pixels > this.maxPixels;
  }

  /**
   * Grants `px` device pixels to `client`, evicting others if it must.
   *
   * @param {BudgetClient} client - Requester.
   * @param {number} px - Device pixels wanted.
   * @returns {boolean} True when granted.
   */
  grant(client: BudgetClient, px: number): boolean {
    this.release(client);
    if (px > this.maxPixels && !client.visible) return false;
    while (
      this.held.size + 1 > this.maxCount ||
      this.pixels + px > this.maxPixels
    ) {
      const victim = this.victim(client);
      if (!victim) {
        if (client.visible) break;
        return false;
      }
      victim.evict();
      this.release(victim);
    }
    this.held.set(client, px);
    this.pixels += px;
    this.peakCount = Math.max(this.peakCount, this.held.size);
    this.peakPixels = Math.max(this.peakPixels, this.pixels);
    return true;
  }

  /**
   * Returns a client's pixels to the budget.
   *
   * @param {BudgetClient} client - Holder.
   * @returns {void}
   */
  release(client: BudgetClient): void {
    const px = this.held.get(client);
    if (px === undefined) return;
    this.held.delete(client);
    this.pixels -= px;
  }

  /**
   * Starts peak tracking again from what is live now.
   *
   * @returns {void}
   */
  resetPeaks(): void {
    this.peakCount = this.held.size;
    this.peakPixels = this.pixels;
  }

  private victim(except: BudgetClient): BudgetClient | undefined {
    let best: BudgetClient | undefined;
    for (const c of this.held.keys()) {
      if (c === except || c.visible) continue;
      if (
        !best ||
        (c.asleep && !best.asleep) ||
        (c.asleep === best.asleep && c.lastSeen < best.lastSeen)
      )
        best = c;
    }
    return best;
  }
}
