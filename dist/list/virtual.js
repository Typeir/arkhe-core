/**
 * @fileoverview Virtual rows: a long list of fixed-pitch rows draws only the
 * rows in view plus an overscan margin. Spacers before and after stand in
 * for the rest, and each row says its place in the whole set.
 *
 * @module packages/core/src/list/virtual
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
 * View before the box is measured: nothing visible yet.
 *
 * @constant UNMEASURED_VIEW
 * @type {VirtualView}
 */
export const UNMEASURED_VIEW = {
    offset: 0,
    viewport: 0,
    inset: 0,
    pitch: 0,
};
/**
 * Returns the rows to draw for `count` rows seen through `view`.
 *
 * @function virtualRange
 * @param {number} count - Rows in the set.
 * @param {VirtualView} view - Measured box.
 * @param {number} [overscan] - Rows past each edge.
 * @returns {VirtualRange} Rows to draw.
 */
export function virtualRange(count, view, overscan = VIRTUAL_OVERSCAN) {
    if (view.pitch <= 0)
        return { start: 0, end: Math.min(count, overscan) };
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
export function rowScrollTop(index, view) {
    if (view.viewport <= 0) {
        const start = index * view.pitch;
        return start === view.offset ? null : start;
    }
    const top = view.inset + index * view.pitch;
    const bottom = top + view.pitch;
    if (top < view.offset)
        return index === 0 ? 0 : top;
    if (bottom > view.offset + view.viewport)
        return bottom - view.viewport;
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
export function virtualVars(range, count, pitch) {
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
export function rowPosition(index, count) {
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
export function measureView(box, pitch) {
    const doc = box.ownerDocument;
    const style = (target) => doc.defaultView?.getComputedStyle(target);
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
export function watchView(box, pitch, report) {
    let last = UNMEASURED_VIEW;
    const update = () => {
        const next = measureView(box, pitch);
        const same = Object.keys(next).every((key) => next[key] === last[key]);
        if (same)
            return;
        last = next;
        report(next);
    };
    update();
    box.addEventListener('scroll', update, { passive: true });
    const Observer = box.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer ? new Observer(update) : null;
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
export function scrollToRow(box, index, pitch) {
    if (index < 0)
        return null;
    const view = measureView(box, pitch);
    const top = rowScrollTop(index, view);
    if (top === null)
        return null;
    box.scrollTop = top;
    return { ...view, offset: top };
}
