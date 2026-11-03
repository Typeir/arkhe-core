/**
 * @fileoverview Stamp atlases: one canvas holding a grid of pre-drawn
 * cells, copied with `drawImage` instead of drawing each shape again, and a
 * keyed cache so atlases are built outside animation frames and dropped on
 * display invalidation (DPR, palette, fonts).
 *
 * @module packages/core/src/canvas/draw/atlas
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Makes an empty stamp grid; items wrap to the next row after `cols`.
 *
 * @function createStampGrid
 * @param {number} cols - Cells per row.
 * @param {number} rows - Rows.
 * @param {number} cw - Cell width, device px.
 * @param {number} ch - Cell height, device px.
 * @returns {StampGrid | null} Grid; null without a 2D context.
 */
export function createStampGrid(cols, rows, cw, ch) {
    const canvas = document.createElement('canvas');
    canvas.width = cw * cols;
    canvas.height = ch * rows;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return null;
    return {
        canvas,
        ctx,
        cw,
        ch,
        cols,
        at: (index, row) => [(index % cols) * cw, (row + Math.floor(index / cols)) * ch],
    };
}
/**
 * Cache of built atlases by key.
 *
 * @class StampCache
 * @template T
 */
export class StampCache {
    built = new Map();
    /**
     * Returns the atlas for `key`, building it on first use.
     *
     * @param {string} key - Identity, e.g. DPR plus palette.
     * @param {() => T} build - Builds the atlas.
     * @returns {T} Atlas.
     */
    get(key, build) {
        let atlas = this.built.get(key);
        if (atlas === undefined) {
            atlas = build();
            this.built.set(key, atlas);
        }
        return atlas;
    }
    /**
     * Drops every atlas.
     *
     * @returns {void}
     */
    clear() {
        this.built.clear();
    }
}
