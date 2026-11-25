/**
 * @fileoverview Request-time search for Search: each query waits out a
 * debounce, then runs the host's request with an abort signal. A newer
 * query aborts the older one, so only the latest answer lands and the host
 * filters where the data lives instead of after fetching it all.
 *
 * @module packages/core/src/select/searchRequest
 * @version 1.0.0
 * @author Typeir
 * @since 0.2.0
 */
/**
 * Milliseconds a query waits for the next keystroke before it runs.
 *
 * @constant SEARCH_DEBOUNCE
 * @type {number}
 */
export const SEARCH_DEBOUNCE = 200;
/**
 * How a search shows a pending query: the loading line while it has no
 * results, else its earlier results dimmed.
 *
 * @function searchBusy
 * @param {boolean} loading - A query is waiting or running.
 * @param {number} count - Results on show.
 * @returns {{ readonly loading: boolean; readonly stale: boolean }} Loading line, dimmed results.
 */
export function searchBusy(loading, count) {
    return { loading: loading && count === 0, stale: loading && count > 0 };
}
/**
 * Debounces, runs and aborts the host's search requests; reports each
 * change of state.
 *
 * @class SearchRequest
 * @template T
 */
export class SearchRequest {
    /**
     * Receives every state change.
     *
     * @type {(state: SearchState<T>) => void}
     */
    report;
    /**
     * Debounce in milliseconds.
     *
     * @type {number}
     */
    delay;
    /**
     * The waiting query's debounce, `null` when none waits.
     *
     * @type {ReturnType<typeof setTimeout> | null}
     */
    #timer = null;
    /**
     * Aborts the running request, `null` before the first one runs.
     *
     * @type {AbortController | null}
     */
    #controller = null;
    /**
     * Latest results.
     *
     * @type {readonly T[]}
     */
    #items = [];
    /**
     * @param {(state: SearchState<T>) => void} report - Receives every state change.
     * @param {number} [delay] - Debounce in milliseconds. Defaults to `SEARCH_DEBOUNCE`.
     */
    constructor(report, delay = SEARCH_DEBOUNCE) {
        this.report = report;
        this.delay = delay;
    }
    /**
     * Queues `query`: drops the waiting or running one, then runs `run` once
     * the debounce passes.
     *
     * @param {string} query - Typed text.
     * @param {SearchRun<T>} run - The host's request.
     * @returns {void}
     */
    query(query, run) {
        this.#cancel();
        this.#emit(true, false);
        this.#timer = setTimeout(() => {
            this.#timer = null;
            const controller = new AbortController();
            this.#controller = controller;
            run(query, controller.signal).then((items) => {
                if (controller.signal.aborted)
                    return;
                this.#items = items;
                this.#emit(false, false);
            }, () => {
                if (controller.signal.aborted)
                    return;
                this.#items = [];
                this.#emit(false, true);
            });
        }, this.delay);
    }
    /**
     * Drops the waiting or running query; nothing reports after.
     *
     * @returns {void}
     */
    destroy() {
        this.#cancel();
    }
    /**
     * Clears the debounce and aborts the running request.
     *
     * @returns {void}
     */
    #cancel() {
        if (this.#timer !== null)
            clearTimeout(this.#timer);
        this.#timer = null;
        this.#controller?.abort();
    }
    /**
     * Reports the current state.
     *
     * @param {boolean} loading - A query is waiting or running.
     * @param {boolean} failed - The latest request rejected.
     * @returns {void}
     */
    #emit(loading, failed) {
        this.report({ items: this.#items, loading, failed });
    }
}
