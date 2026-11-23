/**
 * @fileoverview Where a detached card may sit: kept whole inside the
 * viewport, or snapped to a corner from the move menu.
 *
 * @module packages/core/src/hint/cardPlace
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

import type { MenuEntry } from '../action/menu.js';
import type { ArkheLabels } from '../base/labels.js';

/**
 * A point in viewport pixels.
 *
 * @interface Point
 * @property {number} x - From the left edge.
 * @property {number} y - From the top edge.
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * A width and height in pixels.
 *
 * @interface Size
 * @property {number} width - Width.
 * @property {number} height - Height.
 */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Corner of the screen a card can be sent to from its move menu.
 *
 * @typedef {'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'} Corner
 */
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Every corner, in menu order.
 *
 * @constant CORNERS
 * @type {readonly Corner[]}
 */
export const CORNERS: readonly Corner[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

/**
 * Gap kept between a cornered card and the screen edge, in pixels.
 *
 * @constant CORNER_GAP
 * @type {number}
 */
export const CORNER_GAP = 8;

/**
 * Keeps a card of `size` whole inside `view`: its top-left corner moves in
 * as far as needed. A card larger than the view sits at its top-left.
 *
 * @function clampPoint
 * @param {Point} point - Wanted top-left corner.
 * @param {Size} size - Card size.
 * @param {Size} view - Viewport size.
 * @returns {Point} Allowed top-left corner.
 */
export function clampPoint(point: Point, size: Size, view: Size): Point {
  const fit = (value: number, room: number) =>
    Math.max(0, Math.min(value, Math.max(0, room)));
  return {
    x: fit(point.x, view.width - size.width),
    y: fit(point.y, view.height - size.height),
  };
}

/**
 * Top-left corner that puts a card of `size` in `corner` of `view`, a gap
 * away from the edges.
 *
 * @function cornerPoint
 * @param {Corner} corner - Screen corner.
 * @param {Size} size - Card size.
 * @param {Size} view - Viewport size.
 * @returns {Point} Top-left corner, kept inside the view.
 */
export function cornerPoint(corner: Corner, size: Size, view: Size): Point {
  const right = corner.endsWith('right');
  const bottom = corner.startsWith('bottom');
  return clampPoint(
    {
      x: right ? view.width - size.width - CORNER_GAP : CORNER_GAP,
      y: bottom ? view.height - size.height - CORNER_GAP : CORNER_GAP,
    },
    size,
    view,
  );
}

/**
 * Value of the move menu item that sends a card back beside its trigger.
 *
 * @constant MOVE_BACK
 * @type {string}
 */
export const MOVE_BACK = 'back';

/**
 * Label of each corner's move menu item.
 *
 * @constant CORNER_LABEL
 * @type {Readonly<Record<Corner, keyof ArkheLabels>>}
 */
const CORNER_LABEL: Readonly<Record<Corner, keyof ArkheLabels>> = {
  'top-left': 'moveTopLeft',
  'top-right': 'moveTopRight',
  'bottom-left': 'moveBottomLeft',
  'bottom-right': 'moveBottomRight',
};

/**
 * Entries of a card's move menu: the four corners, a rule, then back
 * beside the trigger, which shows only once the card is detached.
 *
 * @function moveMenu
 * @param {ArkheLabels} labels - Resolved labels.
 * @param {boolean} detached - The card is detached now.
 * @returns {readonly MenuEntry[]} Menu entries; corner values are `Corner` names.
 */
export function moveMenu(
  labels: ArkheLabels,
  detached: boolean,
): readonly MenuEntry[] {
  const corners = CORNERS.map((corner) => ({
    value: corner,
    label: labels[CORNER_LABEL[corner]] as string,
  }));
  return detached
    ? [
        ...corners,
        { separator: true },
        { value: MOVE_BACK, label: labels.moveBack },
      ]
    : corners;
}

/**
 * Says whether a move menu value names a corner.
 *
 * @function isCorner
 * @param {string} value - Menu value.
 * @returns {boolean} True for a corner.
 */
export function isCorner(value: string): value is Corner {
  return (CORNERS as readonly string[]).includes(value);
}
