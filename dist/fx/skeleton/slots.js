/**
 * @fileoverview Slots: once real content sits under a region, each shape's
 * decode front uncovers its whole slot, not just its own box, because real
 * text is wider and taller than its placeholder. Slots come from a
 * recursive XY-cut, so side-by-side layouts work.
 *
 * @module packages/core/src/fx/skeleton/slots
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
    const lo = (c) => (vertical ? c.y : c.x);
    const hi = (c) => (vertical ? c.y + c.h : c.x + c.w);
    const groups = [];
    for (const c of [...items].sort((a, b) => lo(a) - lo(b))) {
        const g = groups[groups.length - 1];
        if (g && lo(c) < g.hi) {
            g.items.push(c);
            g.hi = Math.max(g.hi, hi(c));
        }
        else
            groups.push({ lo: lo(c), hi: hi(c), items: [c] });
    }
    if (groups.length === 1) {
        if (!retried)
            cut(items, x0, y0, x1, y1, !vertical, true);
        else
            for (const c of items)
                Object.assign(c, {
                    sx0: c.x,
                    sx1: c.x + c.w,
                    sy0: c.y,
                    sy1: c.y + c.h,
                });
        return;
    }
    let start = vertical ? y0 : x0;
    groups.forEach((g, i) => {
        const next = groups[i + 1];
        const end = next ? (g.hi + next.lo) / 2 : vertical ? y1 : x1;
        if (vertical)
            cut(g.items, x0, start, x1, end, false, false);
        else
            cut(g.items, start, y0, end, y1, true, false);
        start = end;
    });
}
