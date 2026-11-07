/**
 * @fileoverview Parent links between hints. Hints portal into the
 * environment's container, so a card opened from inside another card is
 * not inside it in the DOM: the pointer leaves the parent on its way in,
 * and a tap in the nested card lands outside the parent. Each hint holds a
 * node, linked to the node of the hint it renders in through framework
 * context, which follows the component tree. A parent refuses to close
 * while a nested hint is open and closes once the last one does, unless
 * the pointer came back to it. Closing a parent closes what it holds.
 *
 * @module packages/core/src/hintTree
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * One hint's place in the tree of open hints.
 *
 * @class HintNode
 */
export class HintNode {
    parent;
    #children = new Set();
    #handle;
    #open = false;
    #pending = 'none';
    /**
     * @param {HintNode} [parent] - Node of the hint this one renders in.
     */
    constructor(parent) {
        this.parent = parent;
    }
    /**
     * Binds the owning hint and joins the parent.
     *
     * @param {HintHandle} handle - Close, leave check, ids.
     * @returns {() => void} Leaves the tree.
     */
    attach(handle) {
        const { parent } = this;
        this.#handle = handle;
        if (parent)
            parent.#children.add(this);
        return () => {
            this.#handle = undefined;
            if (!parent)
                return;
            parent.#children.delete(this);
            parent.#settle();
        };
    }
    /**
     * Whether an open-state request from Zag may go through. A close while a
     * nested hint is open is refused and remembered.
     *
     * @param {boolean} open - Requested state.
     * @returns {boolean} True to apply it.
     */
    request(open) {
        if (open) {
            this.#pending = 'none';
            return true;
        }
        if (!this.#holding())
            return true;
        this.#pending = this.#handle?.leaving() ? 'hover' : 'hard';
        return false;
    }
    /**
     * Records the hint's open state. A close closes the hints it holds and
     * lets the parent finish a close it refused.
     *
     * @param {boolean} open - Whether the hint shows.
     */
    report(open) {
        if (open === this.#open)
            return;
        this.#open = open;
        if (open)
            return;
        this.#pending = 'none';
        for (const child of this.#children) {
            if (child.#open)
                child.#handle?.close();
        }
        if (this.parent)
            this.parent.#settle();
    }
    /**
     * Ids of this hint's trigger and positioner and of every hint it holds.
     *
     * @returns {string[]} Element ids.
     */
    ids() {
        return [
            ...(this.#handle?.ids() ?? []),
            ...[...this.#children].flatMap((child) => child.ids()),
        ];
    }
    /**
     * Whether `target` sits in this hint's trigger or positioner, or in
     * those of a hint it holds.
     *
     * @param {RootNode} root - Root node holding the elements.
     * @param {EventTarget | null} target - Element to look for.
     * @returns {boolean} True when inside.
     */
    holds(root, target) {
        if (!(target instanceof Node))
            return false;
        return this.ids().some((id) => root.getElementById(id)?.contains(target) ?? false);
    }
    /**
     * Whether a nested hint is open.
     *
     * @returns {boolean} True while one shows.
     */
    #holding() {
        return [...this.#children].some((child) => child.#open);
    }
    /**
     * Finishes a refused close once nothing nested is open: always after a
     * dismissal, and after a pointer leave only if the pointer stayed away.
     */
    #settle() {
        if (this.#pending === 'none' || this.#holding())
            return;
        const hard = this.#pending === 'hard';
        this.#pending = 'none';
        if (hard || this.#handle?.leaving())
            this.#handle?.close();
    }
}
