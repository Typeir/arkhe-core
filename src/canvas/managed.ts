/**
 * @fileoverview A canvas whose backing store comes from the shared budget:
 * placed absolutely at its parent's padding-box origin, sized in CSS px and
 * device px separately, zeroed and released on free, and told when the GPU
 * drops or restores its 2D context.
 *
 * @module packages/core/src/canvas/managed
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { BudgetClient, CanvasBudget } from './budget.js';

/**
 * Attribute that marks a budgeted canvas.
 *
 * @constant TILE_ATTR
 * @type {string}
 */
export const TILE_ATTR = 'data-canvas-tile';

/**
 * Where a canvas sits inside its parent, CSS px.
 *
 * @interface Placement
 * @property {number} top - Top, from the padding-box origin.
 * @property {number} width - CSS width.
 * @property {number} height - CSS height.
 */
export interface Placement {
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * What a managed canvas reports to its holder.
 *
 * @interface LossHandlers
 * @property {() => void} lost - The 2D context was lost.
 * @property {() => void} restored - The 2D context is back, blank.
 */
export interface LossHandlers {
  lost(): void;
  restored(): void;
}

/**
 * Budgeted canvas.
 *
 * @class ManagedCanvas
 */
export class ManagedCanvas {
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;

  /**
   * @param {CanvasBudget} budget - Shared budget.
   * @param {BudgetClient} client - Holder the budget sees.
   * @param {LossHandlers} handlers - Context loss callbacks.
   */
  constructor(
    private readonly budget: CanvasBudget,
    private readonly client: BudgetClient,
    private readonly handlers: LossHandlers,
  ) {}

  /**
   * True while a backing store is held.
   *
   * @returns {boolean} Live.
   */
  get live(): boolean {
    return this.canvas !== null;
  }

  /**
   * Asks the budget for `pxWidth × pxHeight` device px and, when granted,
   * puts a canvas of that size into `parent`.
   *
   * @param {HTMLElement} parent - Positioned parent.
   * @param {number} pxWidth - Backing width, device px.
   * @param {number} pxHeight - Backing height, device px.
   * @param {Placement} place - CSS placement.
   * @returns {boolean} True when the canvas and its context exist.
   */
  allocate(
    parent: HTMLElement,
    pxWidth: number,
    pxHeight: number,
    place: Placement,
  ): boolean {
    if (!this.budget.grant(this.client, pxWidth * pxHeight)) return false;
    const c = parent.ownerDocument.createElement('canvas');
    c.setAttribute(TILE_ATTR, '');
    c.setAttribute('aria-hidden', 'true');
    c.width = pxWidth;
    c.height = pxHeight;
    c.style.cssText = `position:absolute;left:0;top:${place.top}px;width:${place.width}px;height:${place.height}px;pointer-events:none;z-index:1`;
    c.addEventListener('contextlost', () => this.handlers.lost());
    c.addEventListener('contextrestored', () => this.handlers.restored());
    parent.append(c);
    this.canvas = c;
    this.ctx = c.getContext('2d');
    if (this.ctx) return true;
    this.free();
    return false;
  }

  /**
   * Zeroes and removes the canvas and returns its pixels to the budget.
   *
   * @returns {void}
   */
  free(): void {
    if (this.canvas) {
      this.canvas.width = this.canvas.height = 0;
      this.canvas.remove();
    }
    this.canvas = null;
    this.ctx = null;
    this.budget.release(this.client);
  }
}
