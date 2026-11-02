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
  private state: LoadState<T> = { status: 'idle' };
  private readonly listeners = new Set<() => void>();
  private pending: Promise<void> | undefined;

  /**
   * @param {() => Promise<T>} source - Fetches the content.
   */
  constructor(private readonly source: () => Promise<T>) {}

  /**
   * Returns the current state.
   *
   * @returns {LoadState<T>} State.
   */
  snapshot(): LoadState<T> {
    return this.state;
  }

  /**
   * Calls `listener` on every state change.
   *
   * @param {() => void} listener - Change callback.
   * @returns {() => void} Unsubscribe.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Starts the load unless one ran already. A failed load may retry.
   *
   * @returns {Promise<void>} Resolves when the load settles.
   */
  load(): Promise<void> {
    if (this.state.status === 'ready') return Promise.resolve();
    this.pending ??= this.run().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async run(): Promise<void> {
    this.set({ status: 'loading' });
    try {
      this.set({ status: 'ready', value: await this.source() });
    } catch (error) {
      this.set({ status: 'error', error });
    }
  }

  private set(state: LoadState<T>): void {
    this.state = state;
    for (const listener of this.listeners) listener();
  }
}
