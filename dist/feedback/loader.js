/**
 * @fileoverview Loads floating content once, on first open, and remembers
 * the result, one loader per source. Ports subscribe to redraw as it moves
 * from idle to loading to ready or error.
 *
 * @module packages/core/src/feedback/loader
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * One cached load. `snapshot` returns the same object until the state
 * changes, as React's external-store hook expects.
 *
 * @class ContentLoader
 * @template T
 */
export class ContentLoader {
    /**
     * Where the load stands.
     *
     * @type {LoadState<T>}
     */
    #state = { status: 'idle' };
    /**
     * Callbacks told of every state change.
     *
     * @type {Set<() => void>}
     */
    #listeners = new Set();
    /**
     * The load in flight; null while none runs.
     *
     * @type {Promise<void> | null}
     */
    #pending = null;
    /**
     * Fetches the content.
     *
     * @type {() => Promise<T>}
     */
    #source;
    /**
     * @param {() => Promise<T>} source - Fetches the content.
     */
    constructor(source) {
        this.#source = source;
    }
    /**
     * Returns the current state.
     *
     * @returns {LoadState<T>} State.
     */
    snapshot() {
        return this.#state;
    }
    /**
     * Calls `listener` on every state change.
     *
     * @param {() => void} listener - Change callback.
     * @returns {() => void} Unsubscribe.
     */
    subscribe(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }
    /**
     * Starts the load unless one ran already. A failed load may retry.
     *
     * @returns {Promise<void>} Resolves when the load settles.
     */
    load() {
        if (this.#state.status === 'ready')
            return Promise.resolve();
        this.#pending ??= this.#run().finally(() => {
            this.#pending = null;
        });
        return this.#pending;
    }
    /**
     * Runs the source once, moving through loading to ready or error.
     *
     * @returns {Promise<void>} Resolves when the source settles.
     */
    async #run() {
        this.#set({ status: 'loading' });
        try {
            this.#set({ status: 'ready', value: await this.#source() });
        }
        catch (error) {
            this.#set({ status: 'error', error });
        }
    }
    /**
     * Replaces the state and tells every listener.
     *
     * @param {LoadState<T>} state - New state.
     * @returns {void}
     */
    #set(state) {
        this.#state = state;
        for (const listener of this.#listeners)
            listener();
    }
}
/**
 * Loaders by source, so a component that unmounts and mounts again with the
 * same source finds its content already loaded.
 *
 * @constant LOADERS
 * @type {WeakMap<() => Promise<unknown>, ContentLoader<unknown>>}
 */
const LOADERS = new WeakMap();
/**
 * The one loader for `source`, made on first use.
 *
 * @function loaderFor
 * @template T
 * @param {() => Promise<T>} source - Fetches the content.
 * @returns {ContentLoader<T>} Loader shared by every caller with this source.
 */
export function loaderFor(source) {
    const known = LOADERS.get(source);
    if (known !== undefined)
        return known;
    const made = new ContentLoader(source);
    LOADERS.set(source, made);
    return made;
}
