/**
 * @fileoverview Slots: once real content sits under a region, each shape's
 * decode front uncovers its whole slot, not just its own box, because real
 * text is wider and taller than its placeholder. Slots come from a
 * recursive XY-cut, so side-by-side layouts work.
 *
 * @module packages/core/src/feedback/fx/skeleton/slots
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Splits a host into one slot per box: boxes are grouped into rows by
 * overlapping vertical extents, rows into columns by overlapping horizontal
 * extents, and so on; neighbouring groups meet halfway, and the outer
 * groups reach the host's edges. Boxes that overlap on both axes keep their
 * own boxes.
 *
 * @function computeSlots
 * @param {Slotted[]} items - Boxes; their slot fields are written.
 * @param {number} w - Host width.
 * @param {number} h - Host height.
 * @returns {void}
 */
export function computeSlots(items, w, h) {
    if (items.length)
        cut(items, 0, 0, w, h, true, false);
}
/**
 * One XY-cut step over the rectangle (x0, y0)–(x1, y1).
 *
 * @function cut
 * @param {Slotted[]} items - Boxes inside the rectangle.
 * @param {number} x0 - Left.
 * @param {number} y0 - Top.
 * @param {number} x1 - Right.
 * @param {number} y1 - Bottom.
 * @param {boolean} vertical - Split into rows (true) or columns (false).
 * @param {boolean} retried - The other axis already failed to split.
 * @returns {void}
 */
function cut(items, x0, y0, x1, y1, vertical, retried) {
    if (items.length === 1) {
        Object.assign(items[0], { sx0: x0, sx1: x1, sy0: y0, sy1: y1 });
        return;
    }
    const lo = (box) => (vertical ? box.y : box.x);
    const hi = (box) => (vertical ? box.y + box.h : box.x + box.w);
    const groups = [];
    for (const box of items.toSorted((first, second) => lo(first) - lo(second))) {
        const group = groups.at(-1);
        if (group && lo(box) < group.hi) {
            group.items.push(box);
            group.hi = Math.max(group.hi, hi(box));
        }
        else {
            groups.push({ lo: lo(box), hi: hi(box), items: [box] });
        }
    }
    if (groups.length === 1) {
        if (!retried) {
            cut(items, x0, y0, x1, y1, !vertical, true);
        }
        else {
            for (const box of items) {
                Object.assign(box, {
                    sx0: box.x,
                    sx1: box.x + box.w,
                    sy0: box.y,
                    sy1: box.y + box.h,
                });
            }
        }
        return;
    }
    const outer = vertical ? y1 : x1;
    let start = vertical ? y0 : x0;
    for (const [i, group] of groups.entries()) {
        const next = groups.at(i + 1);
        const end = next ? (group.hi + next.lo) / 2 : outer;
        if (vertical)
            cut(group.items, x0, start, x1, end, false, false);
        else
            cut(group.items, start, y0, end, y1, true, false);
        start = end;
    }
}
