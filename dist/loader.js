/**
 * @fileoverview Loads floating content once, on first open, and remembers
 * the result. Ports subscribe to redraw as it moves from idle to loading to
 * ready or error.
 *
 * @module packages/core/src/loader
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
    source;
    state = { status: 'idle' };
    listeners = new Set();
    pending;
    /**
     * @param {() => Promise<T>} source - Fetches the content.
     */
    constructor(source) {
        this.source = source;
    }
    /**
     * Returns the current state.
     *
     * @returns {LoadState<T>} State.
     */
    snapshot() {
        return this.state;
    }
    /**
     * Calls `listener` on every state change.
     *
     * @param {() => void} listener - Change callback.
     * @returns {() => void} Unsubscribe.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Starts the load unless one ran already. A failed load may retry.
     *
     * @returns {Promise<void>} Resolves when the load settles.
     */
    load() {
        if (this.state.status === 'ready')
            return Promise.resolve();
        this.pending ??= this.run().finally(() => {
            this.pending = undefined;
        });
        return this.pending;
    }
    async run() {
        this.set({ status: 'loading' });
        try {
            this.set({ status: 'ready', value: await this.source() });
        }
        catch (error) {
            this.set({ status: 'error', error });
        }
    }
    set(state) {
        this.state = state;
        for (const listener of this.listeners)
            listener();
    }
}
