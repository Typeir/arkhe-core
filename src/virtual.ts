/**
 * @fileoverview Virtual rows: a long list of fixed-pitch rows draws only the
 * rows in view plus an overscan margin. Spacers before and after stand in
 * for the rest, and each row says its place in the whole set.
 *
 * @module packages/core/src/virtual
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */

/**
 * Rows drawn past each edge of the view.
 *
 * @constant VIRTUAL_OVERSCAN
 * @type {number}
 */
export const VIRTUAL_OVERSCAN = 8;

/**
 * Rows drawn: `start` inclusive, `end` exclusive.
 *
 * @interface VirtualRange
 * @property {number} start - First row drawn.
 * @property {number} end - One past the last row drawn.
 */
export interface VirtualRange {
  readonly start: number;
  readonly end: number;
}

/**
 * The scroll box as measured, in pixels.
 *
 * @interface VirtualView
 * @property {number} offset - Scroll offset.
 * @property {number} viewport - Visible height.
 * @property {number} inset - Space above the first row.
 * @property {number} pitch - Height of one row.
 */
export interface VirtualView {
  readonly offset: number;
  readonly viewport: number;
  readonly inset: number;
  readonly pitch: number;
}

/**
 * View before the box is measured: nothing visible yet.
 *
 * @constant UNMEASURED_VIEW
 * @type {VirtualView}
 */
export const UNMEASURED_VIEW: VirtualView = {
  offset: 0,
  viewport: 0,
  inset: 0,
  pitch: 0,
};

/**
 * Spacer and pitch custom properties for the scroll box.
 *
 * @typedef {Record<'--row-pitch' | '--virtual-before' | '--virtual-after', string>} VirtualVars
 */
export type VirtualVars = Record<
  '--row-pitch' | '--virtual-before' | '--virtual-after',
  string
>;

/**
 * Place of one row in the whole set, for assistive tech.
 *
 * @interface RowPosition
 * @property {number} aria-posinset - One-based place.
 * @property {number} aria-setsize - Rows in the set.
 */
export interface RowPosition {
  readonly 'aria-posinset': number;
  readonly 'aria-setsize': number;
}

/**
 * Returns the rows to draw for `count` rows seen through `view`.
 *
 * @function virtualRange
 * @param {number} count - Rows in the set.
 * @param {VirtualView} view - Measured box.
 * @param {number} [overscan] - Rows past each edge.
 * @returns {VirtualRange} Rows to draw.
 */
export function virtualRange(
  count: number,
  view: VirtualView,
  overscan: number = VIRTUAL_OVERSCAN,
): VirtualRange {
  if (view.pitch <= 0) return { start: 0, end: Math.min(count, overscan) };
  const top = Math.max(0, view.offset - view.inset);
  const first = Math.floor(top / view.pitch);
  const last = Math.ceil((top + view.viewport) / view.pitch);
  return {
    start: Math.min(count, Math.max(0, first - overscan)),
    end: Math.min(count, last + overscan),
  };
}

/**
 * Returns the scroll offset that brings row `index` fully into view, or
 * null when it is already. A box with no height yet puts the row at the
 * top.
 *
 * @function rowScrollTop
 * @param {number} index - Row.
 * @param {VirtualView} view - Measured box.
 * @returns {number | null} New offset.
 */
export function rowScrollTop(index: number, view: VirtualView): number | null {
  if (view.viewport <= 0) {
    const start = index * view.pitch;
    return start === view.offset ? null : start;
  }
  const top = view.inset + index * view.pitch;
  const bottom = top + view.pitch;
  if (top < view.offset) return index === 0 ? 0 : top;
  if (bottom > view.offset + view.viewport) return bottom - view.viewport;
  return null;
}

/**
 * Returns the spacer heights and pitch, in rem, for the drawn rows.
 *
 * @function virtualVars
 * @param {VirtualRange} range - Rows drawn.
 * @param {number} count - Rows in the set.
 * @param {number} pitch - Row height in rem.
 * @returns {VirtualVars} Custom properties.
 */
export function virtualVars(
  range: VirtualRange,
  count: number,
  pitch: number,
): VirtualVars {
  return {
    '--row-pitch': `${pitch}rem`,
    '--virtual-before': `${range.start * pitch}rem`,
    '--virtual-after': `${(count - range.end) * pitch}rem`,
  };
}

/**
 * Returns the set position attributes of row `index`.
 *
 * @function rowPosition
 * @param {number} index - Row.
 * @param {number} count - Rows in the set.
 * @returns {RowPosition} Attributes.
 */
export function rowPosition(index: number, count: number): RowPosition {
  return { 'aria-posinset': index + 1, 'aria-setsize': count };
}

/**
 * Measures `box`, a scroll box of rows `pitch` rem high.
 *
 * @function measureView
 * @param {HTMLElement} box - Scroll box.
 * @param {number} pitch - Row height in rem.
 * @returns {VirtualView} Measured view.
 */
export function measureView(box: HTMLElement, pitch: number): VirtualView {
  const doc = box.ownerDocument;
  const style = (target: Element) => doc.defaultView?.getComputedStyle(target);
  const rootPx = parseFloat(style(doc.documentElement)?.fontSize ?? '') || 16;
  return {
    offset: box.scrollTop,
    viewport: box.clientHeight,
    inset: parseFloat(style(box)?.paddingTop ?? '') || 0,
    pitch: pitch * rootPx,
  };
}

/**
 * Reports `box`'s view now, then on every scroll or resize that changes it.
 *
 * @function watchView
 * @param {HTMLElement} box - Scroll box.
 * @param {number} pitch - Row height in rem.
 * @param {(view: VirtualView) => void} report - Hears each new view.
 * @returns {() => void} Stops watching.
 */
export function watchView(
  box: HTMLElement,
  pitch: number,
  report: (view: VirtualView) => void,
): () => void {
  let last = UNMEASURED_VIEW;
  const update = () => {
    const next = measureView(box, pitch);
    const same = (Object.keys(next) as (keyof VirtualView)[]).every(
      (key) => next[key] === last[key],
    );
    if (same) return;
    last = next;
    report(next);
  };
  update();
  box.addEventListener('scroll', update, { passive: true });
  const Observer = box.ownerDocument.defaultView?.ResizeObserver;
  const observer = Observer ? new Observer(update) : undefined;
  observer?.observe(box);
  return () => {
    box.removeEventListener('scroll', update);
    observer?.disconnect();
  };
}

/**
 * Scrolls `box` just enough to show row `index` whole. Returns the view as
 * it now stands, so the row is drawn before the scroll event arrives, or
 * null when nothing moved.
 *
 * @function scrollToRow
 * @param {HTMLElement} box - Scroll box.
 * @param {number} index - Row.
 * @param {number} pitch - Row height in rem.
 * @returns {VirtualView | null} New view.
 */
export function scrollToRow(
  box: HTMLElement,
  index: number,
  pitch: number,
): VirtualView | null {
  if (index < 0) return null;
  const view = measureView(box, pitch);
  const top = rowScrollTop(index, view);
  if (top === null) return null;
  box.scrollTop = top;
  return { ...view, offset: top };
}
