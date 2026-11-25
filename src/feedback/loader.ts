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
 * Where a load stands.
 *
 * @typedef {{ status: 'idle' } | { status: 'loading' } | { status: 'ready', value: T } | { status: 'error', error: unknown }} LoadState
 */
export type LoadState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly value: T }
  | { readonly status: 'error'; readonly error: unknown };

/**
 * One cached load. `snapshot` returns the same object until the state
 * changes, as React's external-store hook expects.
 *
 * @class ContentLoader
 * @template T
 */
export class ContentLoader<T> {
  /**
   * Where the load stands.
   *
   * @type {LoadState<T>}
   */
  #state: LoadState<T> = { status: 'idle' };
  /**
   * Callbacks told of every state change.
   *
   * @type {Set<() => void>}
   */
  readonly #listeners = new Set<() => void>();
  /**
   * The load in flight; null while none runs.
   *
   * @type {Promise<void> | null}
   */
  #pending: Promise<void> | null = null;
  /**
   * Fetches the content.
   *
   * @type {() => Promise<T>}
   */
  readonly #source: () => Promise<T>;

  /**
   * @param {() => Promise<T>} source - Fetches the content.
   */
  constructor(source: () => Promise<T>) {
    this.#source = source;
  }

  /**
   * Returns the current state.
   *
   * @returns {LoadState<T>} State.
   */
  snapshot(): LoadState<T> {
    return this.#state;
  }

  /**
   * Calls `listener` on every state change.
   *
   * @param {() => void} listener - Change callback.
   * @returns {() => void} Unsubscribe.
   */
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Starts the load unless one ran already. A failed load may retry.
   *
   * @returns {Promise<void>} Resolves when the load settles.
   */
  load(): Promise<void> {
    if (this.#state.status === 'ready') return Promise.resolve();
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
  async #run(): Promise<void> {
    this.#set({ status: 'loading' });
    try {
      this.#set({ status: 'ready', value: await this.#source() });
    } catch (error) {
      this.#set({ status: 'error', error });
    }
  }

  /**
   * Replaces the state and tells every listener.
   *
   * @param {LoadState<T>} state - New state.
   * @returns {void}
   */
  #set(state: LoadState<T>): void {
    this.#state = state;
    for (const listener of this.#listeners) listener();
  }
}

/**
 * Loaders by source, so a component that unmounts and mounts again with the
 * same source finds its content already loaded.
 *
 * @constant LOADERS
 * @type {WeakMap<() => Promise<unknown>, ContentLoader<unknown>>}
 */
const LOADERS = new WeakMap<() => Promise<unknown>, ContentLoader<unknown>>();

/**
 * The one loader for `source`, made on first use.
 *
 * @function loaderFor
 * @template T
 * @param {() => Promise<T>} source - Fetches the content.
 * @returns {ContentLoader<T>} Loader shared by every caller with this source.
 */
export function loaderFor<T>(source: () => Promise<T>): ContentLoader<T> {
  const known = LOADERS.get(source) as ContentLoader<T> | undefined;
  if (known !== undefined) return known;
  const made = new ContentLoader(source);
  LOADERS.set(source, made as ContentLoader<unknown>);
  return made;
}
