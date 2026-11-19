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
export type SearchRun<T> = (
  query: string,
  signal: AbortSignal,
) => Promise<readonly T[]>;

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
export const SEARCH_DEBOUNCE = 200;

/**
 * Debounces, runs and aborts the host's search requests; reports each
 * change of state.
 *
 * @class SearchRequest
 * @template T
 */
export class SearchRequest<T> {
  #timer: ReturnType<typeof setTimeout> | undefined;
  #controller: AbortController | undefined;
  #items: readonly T[] = [];

  /**
   * @param {(state: SearchState<T>) => void} report - Receives every state change.
   * @param {number} [delay] - Debounce in milliseconds. Defaults to `SEARCH_DEBOUNCE`.
   */
  constructor(
    readonly report: (state: SearchState<T>) => void,
    readonly delay: number = SEARCH_DEBOUNCE,
  ) {}

  /**
   * Queues `query`: drops the waiting or running one, then runs `run` once
   * the debounce passes.
   *
   * @param {string} query - Typed text.
   * @param {SearchRun<T>} run - The host's request.
   * @returns {void}
   */
  query(query: string, run: SearchRun<T>): void {
    this.#cancel();
    this.#emit(true, false);
    this.#timer = setTimeout(() => {
      const controller = new AbortController();
      this.#controller = controller;
      run(query, controller.signal).then(
        (items) => {
          if (controller.signal.aborted) return;
          this.#items = items;
          this.#emit(false, false);
        },
        () => {
          if (controller.signal.aborted) return;
          this.#items = [];
          this.#emit(false, true);
        },
      );
    }, this.delay);
  }

  /**
   * Drops the waiting or running query; nothing reports after.
   *
   * @returns {void}
   */
  dispose(): void {
    this.#cancel();
  }

  /**
   * Clears the debounce and aborts the running request.
   *
   * @returns {void}
   */
  #cancel(): void {
    clearTimeout(this.#timer);
    this.#controller?.abort();
  }

  /**
   * Reports the current state.
   *
   * @param {boolean} loading - A query is waiting or running.
   * @param {boolean} failed - The latest request rejected.
   * @returns {void}
   */
  #emit(loading: boolean, failed: boolean): void {
    this.report({ items: this.#items, loading, failed });
  }
}
