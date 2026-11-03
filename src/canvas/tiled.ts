/**
 * @fileoverview Tiled surface: one region cut into tiles, each an absolute
 * canvas inside the owner, so it scrolls natively with the page. Tiles wake
 * and sleep through shared observers and get their backing stores from the
 * shared budget. A rebuild whose geometry is unchanged just repaints; a real
 * rebuild seeds the new tiles' wake and visibility, so nothing blanks.
 *
 * @module packages/core/src/canvas/tiled
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { CanvasTile } from './tile.js';
import { CAP_PX, planTiles, type Tile, type TilePlan } from './tiles.js';
import { VISIBLE_MARGIN, type Region, type SurfaceContext } from './view.js';

/**
 * True when any tile in `list` overlaps `tile`.
 *
 * @function overlaps
 * @param {readonly Tile[]} list - Tiles.
 * @param {Tile} tile - Tile.
 * @returns {boolean} Overlaps.
 */
function overlaps(list: readonly Tile[], tile: Tile): boolean {
  return list.some((o) => o.y < tile.y + tile.h && o.y + o.h > tile.y);
}

/**
 * Tiled surface of one region.
 *
 * @class TiledSurface
 */
export class TiledSurface {
  plan: TilePlan = { dpr: 1, pxWidth: 1, cssWidth: 1, tiles: [] };
  private tiles: CanvasTile[] = [];
  private viewT = -1;
  private viewRange: readonly [number, number] = [0, 0];
  private built = '';

  /**
   * @param {SurfaceContext} ctx - Shared services.
   * @param {Region} region - What it draws.
   */
  constructor(
    readonly ctx: SurfaceContext,
    readonly region: Region,
  ) {
    this.build();
  }

  /**
   * Viewport rows in region-local px, read once per frame time.
   *
   * @param {number} t - Frame time.
   * @returns {readonly [number, number]} Top and bottom.
   */
  view(t: number): readonly [number, number] {
    if (t !== this.viewT) {
      const top = this.region.box().top;
      this.viewRange = [-top, this.ctx.display.viewH - top];
      this.viewT = t;
    }
    return this.viewRange;
  }

  /**
   * Re-plans the tiles after a re-measure.
   *
   * @returns {void}
   */
  rebuild(): void {
    if (this.key() === this.built) {
      const t = performance.now();
      for (const b of this.tiles) b.repaint(t, false);
      return;
    }
    const near = this.tiles.filter((b) => !b.asleep).map((b) => b.tile);
    const seen = this.tiles.filter((b) => b.visible).map((b) => b.tile);
    this.teardown();
    this.build();
    const t = performance.now();
    for (const b of this.tiles) {
      b.visible = overlaps(seen, b.tile);
      if (overlaps(near, b.tile)) b.wake(t);
    }
  }

  /**
   * False once every tile has been reported outside the wake margin, so a
   * far region can skip layout reads.
   *
   * @returns {boolean} Near, or not yet reported.
   */
  near(): boolean {
    return this.tiles.some((b) => !b.reported || !b.asleep);
  }

  /**
   * Gets every awake tile a canvas and into the loop.
   *
   * @returns {void}
   */
  kick(): void {
    for (const b of this.tiles) b.ensure();
  }

  /**
   * Repaints every live tile in the current task, so a DOM swap and its
   * cover land in the same frame. `top` is the host's padding-box top from
   * before the swap, which a swap inside the host does not move.
   *
   * @param {number} top - Host top, viewport px; not finite to re-read it.
   * @returns {void}
   */
  paintNow(top: number): void {
    const t = performance.now();
    if (Number.isFinite(top)) {
      this.viewT = t;
      this.viewRange = [-top, this.ctx.display.viewH - top];
    }
    for (const b of this.tiles) b.repaint(t);
  }

  /**
   * Re-arms visible tiles after a scroll, so rows that scroll into a
   * partly visible tile start.
   *
   * @returns {void}
   */
  scrolled(): void {
    for (const b of this.tiles) if (b.visible) b.ensure();
  }

  /**
   * A tile finished; the region is done once every tile is.
   *
   * @returns {void}
   */
  tileDone(): void {
    if (this.tiles.every((b) => b.done)) this.ctx.done(this.region);
  }

  /**
   * Stops observing a tile's sentinel.
   *
   * @param {Element} sentinel - Sentinel.
   * @returns {void}
   */
  unobserve(sentinel: Element): void {
    this.ctx.hub.unobserve(sentinel, this.ctx.wakeMargin);
    this.ctx.hub.unobserve(sentinel, VISIBLE_MARGIN);
  }

  /**
   * Removes every tile.
   *
   * @returns {void}
   */
  teardown(): void {
    for (const b of this.tiles) b.destroy();
    this.tiles = [];
  }

  /**
   * Tiles holding a canvas now.
   *
   * @returns {number} Count.
   */
  liveCanvases(): number {
    return this.tiles.filter((b) => b.hasCanvas).length;
  }

  private key(): string {
    const { region, ctx } = this;
    return JSON.stringify([
      region.width,
      region.height,
      ctx.display.dpr,
      ctx.display.viewH * ctx.tileScale,
      ctx.budget.maxPixels,
      region.key(),
    ]);
  }

  private build(): void {
    const { region, ctx } = this;
    this.built = this.key();
    this.plan = planTiles(
      region.width,
      region.height,
      ctx.display.dpr,
      ctx.display.viewH * ctx.tileScale,
      {
        capPx: Math.min(CAP_PX, Math.floor(ctx.budget.maxPixels / 3)),
        step: region.step,
      },
    );
    this.tiles = this.plan.tiles.map((tile) => {
      const b = new CanvasTile(
        this,
        tile,
        region.slice(tile.y, tile.y + tile.h),
      );
      ctx.hub.observe(b.sentinel, ctx.wakeMargin, (near) => {
        b.reported = true;
        if (near) b.wake(performance.now());
        else b.sleep();
      });
      ctx.hub.observe(b.sentinel, VISIBLE_MARGIN, (visible) =>
        b.setVisible(visible),
      );
      return b;
    });
  }
}
