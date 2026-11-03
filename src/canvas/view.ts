/**
 * @fileoverview The contract between canvas surfaces and what they draw. A
 * surface (tiled or viewport) knows nothing about the look: it hands each
 * region's slices a `View` and asks them to paint, whether they are still
 * pending, and whether they still animate. Also the shared services a
 * surface runs on, and pixel-snapped fills for views.
 *
 * @module packages/core/src/canvas/view
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { CanvasBudget } from './budget.js';
import type { DisplayWatcher } from './display.js';
import type { FrameLoop } from './loop.js';
import type { ObserverHub } from './observers.js';

/**
 * Where a region is drawn. Device px = (region-local + offset) × dpr. Only
 * region-local rows in [y0, y1) need drawing.
 *
 * @interface View
 * @property {CanvasRenderingContext2D} ctx - Target context.
 * @property {number} dpr - Backing scale.
 * @property {number} ox - X offset, CSS px.
 * @property {number} oy - Y offset, CSS px.
 * @property {number} y0 - First region-local row to draw.
 * @property {number} y1 - Row after the last to draw.
 * @property {number} viewH - Viewport height, CSS px.
 */
export interface View {
  readonly ctx: CanvasRenderingContext2D;
  readonly dpr: number;
  readonly ox: number;
  readonly oy: number;
  readonly y0: number;
  readonly y1: number;
  readonly viewH: number;
}

/**
 * The part of a region one canvas draws. Rows are region-local CSS px.
 *
 * @interface Slice
 * @property {boolean} retains - May keep its pixels between frames.
 * @property {(t: number, top: number, bottom: number) => void} start - Starts what is in view, [top, bottom).
 * @property {(t: number) => boolean} pending - Still has something to draw.
 * @property {(t: number, top: number, bottom: number) => boolean} animating - Something in [top, bottom) changes over time.
 * @property {() => number} settlesAt - When everything started ends, ms; Infinity while anything has not started.
 * @property {(view: View, t: number, keep: boolean) => void} paint - Draws; with `keep`, pixels from the last frame are still there.
 */
export interface Slice {
  readonly retains: boolean;
  start(t: number, top: number, bottom: number): void;
  pending(t: number): boolean;
  animating(t: number, top: number, bottom: number): boolean;
  settlesAt(): number;
  paint(view: View, t: number, keep: boolean): void;
}

/**
 * One owner element and its drawable content.
 *
 * @interface Region
 * @property {HTMLElement} host - Owner element; canvases go inside it.
 * @property {number} width - Padding-box width, CSS px.
 * @property {number} height - Padding-box height, CSS px.
 * @property {number} step - Row grid, CSS px; tile heights are multiples of it.
 * @property {() => { left: number; top: number; bottom: number }} box - Padding box now, viewport px.
 * @property {() => string} key - Identity of the geometry; equal keys draw equal tiles.
 * @property {(y0: number, y1: number) => Slice} slice - Content touching rows [y0, y1).
 */
export interface Region {
  readonly host: HTMLElement;
  readonly width: number;
  readonly height: number;
  readonly step: number;
  box(): { left: number; top: number; bottom: number };
  key(): string;
  slice(y0: number, y1: number): Slice;
}

/**
 * Services every surface shares, owned by one engine.
 *
 * @interface SurfaceContext
 * @property {FrameLoop} loop - Shared frame loop.
 * @property {CanvasBudget} budget - Shared canvas budget.
 * @property {ObserverHub} hub - Shared intersection observers.
 * @property {DisplayWatcher} display - Cached viewport size and capped DPR.
 * @property {() => number} revision - Bumps when every pixel must be redrawn (theme).
 * @property {'keep' | 'release'} sleep - Whether a tile outside the wake margin keeps its canvas.
 * @property {number} tileScale - Tile height, in viewport heights.
 * @property {string} wakeMargin - Root margin within which tiles wake.
 * @property {(region: Region) => void} painted - A canvas painted `region` for the first time.
 * @property {(region: Region) => void} done - `region` has nothing left to draw.
 */
export interface SurfaceContext {
  readonly loop: FrameLoop;
  readonly budget: CanvasBudget;
  readonly hub: ObserverHub;
  readonly display: DisplayWatcher;
  revision(): number;
  readonly sleep: 'keep' | 'release';
  readonly tileScale: number;
  readonly wakeMargin: string;
  painted(region: Region): void;
  done(region: Region): void;
}

/**
 * Root margin of the on-screen test: the viewport itself.
 *
 * @constant VISIBLE_MARGIN
 * @type {string}
 */
export const VISIBLE_MARGIN = '0px';

/**
 * Snaps a region-local rect of `view` to whole device px.
 *
 * @function snapRect
 * @param {View} v - View.
 * @param {number} x - Left.
 * @param {number} y - Top.
 * @param {number} w - Width.
 * @param {number} h - Height.
 * @returns {readonly [number, number, number, number]} Device x, y, width, height.
 */
export function snapRect(
  v: View,
  x: number,
  y: number,
  w: number,
  h: number,
): readonly [number, number, number, number] {
  const x0 = Math.round((x + v.ox) * v.dpr);
  const y0 = Math.round((y + v.oy) * v.dpr);
  return [
    x0,
    y0,
    Math.round((x + w + v.ox) * v.dpr) - x0,
    Math.round((y + h + v.oy) * v.dpr) - y0,
  ];
}
