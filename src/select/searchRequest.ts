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
 * How a search shows a pending query: the loading line while it has no
 * results, else its earlier results dimmed.
 *
 * @function searchBusy
 * @param {boolean} loading - A query is waiting or running.
 * @param {number} count - Results on show.
 * @returns {{ readonly loading: boolean; readonly stale: boolean }} Loading line, dimmed results.
 */
export function searchBusy(
  loading: boolean,
  count: number,
): { readonly loading: boolean; readonly stale: boolean } {
  return { loading: loading && count === 0, stale: loading && count > 0 };
}

/**
 * Debounces, runs and aborts the host's search requests; reports each
 * change of state.
 *
 * @class SearchRequest
 * @template T
 */
export class SearchRequest<T> {
  /**
   * Receives every state change.
   *
   * @type {(state: SearchState<T>) => void}
   */
  readonly report: (state: SearchState<T>) => void;

  /**
   * Debounce in milliseconds.
   *
   * @type {number}
   */
  readonly delay: number;

  /**
   * The waiting query's debounce, `null` when none waits.
   *
   * @type {ReturnType<typeof setTimeout> | null}
   */
  #timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Aborts the running request, `null` before the first one runs.
   *
   * @type {AbortController | null}
   */
  #controller: AbortController | null = null;

  /**
   * Latest results.
   *
   * @type {readonly T[]}
   */
  #items: readonly T[] = [];

  /**
   * @param {(state: SearchState<T>) => void} report - Receives every state change.
   * @param {number} [delay] - Debounce in milliseconds. Defaults to `SEARCH_DEBOUNCE`.
   */
  constructor(
    report: (state: SearchState<T>) => void,
    delay: number = SEARCH_DEBOUNCE,
  ) {
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
  query(query: string, run: SearchRun<T>): void {
    this.#cancel();
    this.#emit(true, false);
    this.#timer = setTimeout(() => {
      this.#timer = null;
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
  destroy(): void {
    this.#cancel();
  }

  /**
   * Clears the debounce and aborts the running request.
   *
   * @returns {void}
   */
  #cancel(): void {
    if (this.#timer !== null) clearTimeout(this.#timer);
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
  #emit(loading: boolean, failed: boolean): void {
    this.report({ items: this.#items, loading, failed });
  }
}
