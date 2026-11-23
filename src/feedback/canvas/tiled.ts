/**
 * @fileoverview Tiled surface: one region cut into tiles, each an absolute
 * canvas inside the owner, so it scrolls natively with the page. Tiles wake
 * and sleep through shared observers and get their backing stores from the
 * shared budget. A rebuild whose geometry is unchanged just repaints; a real
 * rebuild seeds the new tiles' wake and visibility, so nothing blanks.
 *
 * @module packages/core/src/feedback/canvas/tiled
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { CanvasTile } from './tile.js';
import { CAP_PX, planTiles, type Tile, type TilePlan } from './tiles.js';
import { type Region, type SurfaceContext, VISIBLE_MARGIN } from './view.js';

/**
 * True when any tile in `list` overlaps `tile`.
 *
 * @function overlaps
 * @param {readonly Tile[]} list - Tiles.
 * @param {Tile} tile - Tile.
 * @returns {boolean} Overlaps.
 */
function overlaps(list: readonly Tile[], tile: Tile): boolean {
  return list.some(
    (other) => other.y < tile.y + tile.h && other.y + other.h > tile.y,
  );
}

/**
 * Tiled surface of one region.
 *
 * @class TiledSurface
 */
export class TiledSurface {
  /**
   * How the region is cut: DPR, backing width and tiles.
   *
   * @type {TilePlan}
   */
  plan: TilePlan = { dpr: 1, pxWidth: 1, cssWidth: 1, tiles: [] };
  /**
   * Shared services.
   *
   * @type {SurfaceContext}
   */
  readonly ctx: SurfaceContext;
  /**
   * What it draws.
   *
   * @type {Region}
   */
  readonly region: Region;
  /**
   * Tiles of the current plan, top to bottom.
   *
   * @type {CanvasTile[]}
   */
  #tiles: CanvasTile[] = [];
  /**
   * Frame time of the cached viewport rows.
   *
   * @type {number}
   */
  #viewT = -1;
  /**
   * Viewport rows in region-local px, cached per frame time.
   *
   * @type {readonly [number, number]}
   */
  #viewRange: readonly [number, number] = [0, 0];
  /**
   * Geometry key the current plan was built for.
   *
   * @type {string}
   */
  #built = '';

  /**
   * @param {SurfaceContext} ctx - Shared services.
   * @param {Region} region - What it draws.
   */
  constructor(ctx: SurfaceContext, region: Region) {
    this.ctx = ctx;
    this.region = region;
    this.#build();
  }

  /**
   * Viewport rows in region-local px, read once per frame time.
   *
   * @param {number} t - Frame time.
   * @returns {readonly [number, number]} Top and bottom.
   */
  view(t: number): readonly [number, number] {
    if (t !== this.#viewT) {
      const top = this.region.box().top;
      this.#viewRange = [-top, this.ctx.display.viewH - top];
      this.#viewT = t;
    }
    return this.#viewRange;
  }

  /**
   * Re-plans the tiles after a re-measure.
   *
   * @returns {void}
   */
  rebuild(): void {
    if (this.#key() === this.#built) {
      const t = performance.now();
      for (const tile of this.#tiles) tile.repaint(t, false);
      return;
    }
    const near = this.#tiles
      .filter((tile) => !tile.asleep)
      .map((tile) => tile.tile);
    const seen = this.#tiles
      .filter((tile) => tile.visible)
      .map((tile) => tile.tile);
    this.#removeTiles();
    this.#build();
    const t = performance.now();
    for (const tile of this.#tiles) {
      tile.visible = overlaps(seen, tile.tile);
      if (overlaps(near, tile.tile)) tile.wake(t);
    }
  }

  /**
   * False once every tile has been reported outside the wake margin, so a
   * far region can skip layout reads.
   *
   * @returns {boolean} Near, or not yet reported.
   */
  near(): boolean {
    return this.#tiles.some((tile) => !tile.reported || !tile.asleep);
  }

  /**
   * Gets every awake tile a canvas and into the loop.
   *
   * @returns {void}
   */
  kick(): void {
    for (const tile of this.#tiles) tile.ensure();
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
      this.#viewT = t;
      this.#viewRange = [-top, this.ctx.display.viewH - top];
    }
    for (const tile of this.#tiles) tile.repaint(t);
  }

  /**
   * Re-arms visible tiles after a scroll, so rows that scroll into a
   * partly visible tile start.
   *
   * @returns {void}
   */
  scrolled(): void {
    for (const tile of this.#tiles) if (tile.visible) tile.ensure();
  }

  /**
   * A tile finished; the region is done once every tile is.
   *
   * @returns {void}
   */
  tileDone(): void {
    if (this.#tiles.every((tile) => tile.done)) this.ctx.done(this.region);
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
   * Removes every tile, canvas and sentinel; the surface is done.
   *
   * @returns {void}
   */
  destroy(): void {
    this.#removeTiles();
  }

  /**
   * Removes every tile, ahead of a rebuild or for good.
   *
   * @returns {void}
   */
  #removeTiles(): void {
    for (const tile of this.#tiles) tile.destroy();
    this.#tiles = [];
  }

  /**
   * Tiles holding a canvas now.
   *
   * @returns {number} Count.
   */
  liveCanvases(): number {
    return this.#tiles.filter((tile) => tile.hasCanvas).length;
  }

  /**
   * Identity of everything the plan depends on: size, DPR, tile height,
   * pixel budget and the region's own geometry.
   *
   * @returns {string} Key.
   */
  #key(): string {
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

  /**
   * Plans the tiles and makes them, each watched for wake and visibility.
   *
   * @returns {void}
   */
  #build(): void {
    const { region, ctx } = this;
    this.#built = this.#key();
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
    this.#tiles = this.plan.tiles.map((rows) => {
      const tile = new CanvasTile(
        this,
        rows,
        region.slice(rows.y, rows.y + rows.h),
      );
      ctx.hub.observe(tile.sentinel, ctx.wakeMargin, (near) => {
        tile.reported = true;
        if (near) tile.wake(performance.now());
        else tile.sleep();
      });
      ctx.hub.observe(tile.sentinel, VISIBLE_MARGIN, (visible) => {
        tile.setVisible(visible);
      });
      return tile;
    });
  }
}
