/**
 * @fileoverview Shared observers. `ObserverHub` keeps one
 * IntersectionObserver per root margin and dispatches through an element
 * map. `SizeWatcher` keeps one ResizeObserver and reports only elements
 * whose size really changed, so the callback `observe()` always fires
 * first, and any callback that changes nothing, is skipped.
 *
 * @module packages/core/src/canvas/observers
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

/**
 * Receives whether an element intersects its margin.
 *
 * @typedef {(inside: boolean) => void} IntersectionWatch
 */
export type IntersectionWatch = (inside: boolean) => void;

/**
 * One IntersectionObserver per distinct root margin.
 *
 * @class ObserverHub
 */
export class ObserverHub {
  private readonly hubs = new Map<
    string,
    {
      readonly io: IntersectionObserver;
      readonly watches: Map<Element, IntersectionWatch>;
    }
  >();

  /**
   * Watches `el` against `margin`. One watch per element and margin.
   *
   * @param {Element} el - Element.
   * @param {string} margin - Root margin, e.g. `100% 0px`.
   * @param {IntersectionWatch} watch - Receives each report.
   * @returns {void}
   */
  observe(el: Element, margin: string, watch: IntersectionWatch): void {
    let hub = this.hubs.get(margin);
    if (!hub) {
      const watches = new Map<Element, IntersectionWatch>();
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) watches.get(e.target)?.(e.isIntersecting);
        },
        { rootMargin: margin },
      );
      hub = { io, watches };
      this.hubs.set(margin, hub);
    }
    hub.watches.set(el, watch);
    hub.io.observe(el);
  }

  /**
   * Stops watching `el` against `margin`.
   *
   * @param {Element} el - Element.
   * @param {string} margin - Root margin it was watched with.
   * @returns {void}
   */
  unobserve(el: Element, margin: string): void {
    const hub = this.hubs.get(margin);
    if (!hub) return;
    hub.watches.delete(el);
    hub.io.unobserve(el);
  }

  /**
   * Drops every observer.
   *
   * @returns {void}
   */
  disconnect(): void {
    for (const hub of this.hubs.values()) hub.io.disconnect();
    this.hubs.clear();
  }
}

/**
 * Size of an element for change detection: its offset box.
 *
 * @function sizeOf
 * @param {HTMLElement} el - Element.
 * @returns {string} Width and height.
 */
export function sizeOf(el: HTMLElement): string {
  return `${el.offsetWidth}x${el.offsetHeight}`;
}

/**
 * ResizeObserver that reports only real size changes, in batches.
 *
 * @class SizeWatcher
 */
export class SizeWatcher {
  private readonly sizes = new Map<HTMLElement, string>();
  private readonly ro: ResizeObserver;

  /**
   * @param {(changed: HTMLElement[]) => void} onChange - Receives every changed element of one callback at once.
   */
  constructor(onChange: (changed: HTMLElement[]) => void) {
    this.ro = new ResizeObserver((entries) => {
      const changed = entries
        .map((e) => e.target as HTMLElement)
        .filter((el) => this.sizes.has(el) && this.update(el));
      if (changed.length) onChange(changed);
    });
  }

  /**
   * Watches `el`, taking its size now as the known one.
   *
   * @param {HTMLElement} el - Element.
   * @param {string} [size] - Its size, when already read.
   * @returns {void}
   */
  watch(el: HTMLElement, size: string = sizeOf(el)): void {
    this.sizes.set(el, size);
    this.ro.observe(el);
  }

  /**
   * Takes `el`'s size now as the known one.
   *
   * @param {HTMLElement} el - Element.
   * @returns {boolean} True when it differed.
   */
  update(el: HTMLElement): boolean {
    const size = sizeOf(el);
    if (this.sizes.get(el) === size) return false;
    this.sizes.set(el, size);
    return true;
  }

  /**
   * Stops watching `el`.
   *
   * @param {HTMLElement} el - Element.
   * @returns {void}
   */
  unwatch(el: HTMLElement): void {
    this.sizes.delete(el);
    this.ro.unobserve(el);
  }

  /**
   * Stops watching everything.
   *
   * @returns {void}
   */
  disconnect(): void {
    this.sizes.clear();
    this.ro.disconnect();
  }
}
