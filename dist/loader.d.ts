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
 * Where a load stands.
 *
 * @typedef {{ status: 'idle' } | { status: 'loading' } | { status: 'ready', value: T } | { status: 'error', error: unknown }} LoadState
 */
export type LoadState<T> = {
    readonly status: 'idle';
} | {
    readonly status: 'loading';
} | {
    readonly status: 'ready';
    readonly value: T;
} | {
    readonly status: 'error';
    readonly error: unknown;
};
/**
 * One cached load. `snapshot` returns the same object until the state
 * changes, as React's external-store hook expects.
 *
 * @class ContentLoader
 * @template T
 */
export declare class ContentLoader<T> {
    private readonly source;
    private state;
    private readonly listeners;
    private pending;
    /**
     * @param {() => Promise<T>} source - Fetches the content.
     */
    constructor(source: () => Promise<T>);
    /**
     * Returns the current state.
     *
     * @returns {LoadState<T>} State.
     */
    snapshot(): LoadState<T>;
    /**
     * Calls `listener` on every state change.
     *
     * @param {() => void} listener - Change callback.
     * @returns {() => void} Unsubscribe.
     */
    subscribe(listener: () => void): () => void;
    /**
     * Starts the load unless one ran already. A failed load may retry.
     *
     * @returns {Promise<void>} Resolves when the load settles.
     */
    load(): Promise<void>;
    private run;
    private set;
}
