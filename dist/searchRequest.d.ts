/**
 * @fileoverview Request-time search for Search: each query waits out a
 * debounce, then runs the host's request with an abort signal. A newer
 * query aborts the older one, so only the latest answer lands and the host
 * filters where the data lives instead of after fetching it all.
 *
 * @module packages/core/src/searchRequest
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */
/**
 * The host's request: results for `query`, abandoned when `signal` aborts.
 *
 * @typedef {(query: string, signal: AbortSignal) => Promise<readonly T[]>} SearchRun
 * @template T
 */
export type SearchRun<T> = (query: string, signal: AbortSignal) => Promise<readonly T[]>;
/**
 * What a search shows.
 *
 * @interface SearchState
 * @template T
 * @property {readonly T[]} items - Latest results; kept while the next ones load.
 * @property {boolean} loading - A query is waiting or running.
 * @property {boolean} failed - The latest request rejected.
 */
export interface SearchState<T> {
    readonly items: readonly T[];
    readonly loading: boolean;
    readonly failed: boolean;
}
/**
 * Milliseconds a query waits for the next keystroke before it runs.
 *
 * @constant SEARCH_DEBOUNCE
 * @type {number}
 */
export declare const SEARCH_DEBOUNCE = 200;
/**
 * Debounces, runs and aborts the host's search requests; reports each
 * change of state.
 *
 * @class SearchRequest
 * @template T
 */
export declare class SearchRequest<T> {
    #private;
    readonly report: (state: SearchState<T>) => void;
    readonly delay: number;
    /**
     * @param {(state: SearchState<T>) => void} report - Receives every state change.
     * @param {number} [delay] - Debounce in milliseconds. Defaults to `SEARCH_DEBOUNCE`.
     */
    constructor(report: (state: SearchState<T>) => void, delay?: number);
    /**
     * Queues `query`: drops the waiting or running one, then runs `run` once
     * the debounce passes.
     *
     * @param {string} query - Typed text.
     * @param {SearchRun<T>} run - The host's request.
     * @returns {void}
     */
    query(query: string, run: SearchRun<T>): void;
    /**
     * Drops the waiting or running query; nothing reports after.
     *
     * @returns {void}
     */
    dispose(): void;
}
