/**
 * @fileoverview Roving focus for a toolbar where the browser lacks
 * `focusgroup`: one item in the tab order, arrows and Home / End move it,
 * and it is remembered after a click. Installed only without native
 * support, never beside it.
 *
 * @module packages/core/src/base/rovingFocus
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

/**
 * Says whether the browser moves focus inside a `focusgroup` itself.
 *
 * @function hasFocusgroup
 * @param {HTMLElement} element - Any element of the document.
 * @returns {boolean} True with native support.
 */
export function hasFocusgroup(element: HTMLElement): boolean {
  const View = element.ownerDocument.defaultView;
  return View !== null && 'focusGroup' in View.HTMLElement.prototype;
}

/**
 * Step each key takes along the toolbar, by direction.
 *
 * @function steps
 * @param {HTMLElement} root - Toolbar.
 * @returns {Readonly<Record<string, number>>} Step per key.
 */
function steps(root: HTMLElement): Readonly<Record<string, number>> {
  if (root.getAttribute('aria-orientation') === 'vertical') {
    return { ArrowDown: 1, ArrowUp: -1 };
  }
  const style = root.ownerDocument.defaultView?.getComputedStyle(root);
  const rtl = style?.direction === 'rtl';
  return { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 };
}

/**
 * Keeps one button of `root` in the tab order and moves it with arrows,
 * wrapping at the ends, and Home / End. Does nothing where the browser has
 * `focusgroup`. Buttons added later join; the remembered one stays.
 *
 * @function rovingFocus
 * @param {HTMLElement} root - Toolbar.
 * @returns {() => void} Stops it.
 */
export function rovingFocus(root: HTMLElement): () => void {
  if (hasFocusgroup(root)) return () => undefined;
  const items = () => [...root.querySelectorAll<HTMLElement>('button')];
  let active: HTMLElement | undefined;
  const mark = () => {
    const all = items();
    const current = active && all.includes(active) ? active : all[0];
    for (const item of all) item.tabIndex = item === current ? 0 : -1;
  };
  const enter = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (!items().includes(target)) return;
    active = target;
    mark();
  };
  const move = (event: KeyboardEvent) => {
    const all = items();
    const at = all.indexOf(event.target as HTMLElement);
    if (at === -1) return;
    const step = steps(root)[event.key];
    const next =
      event.key === 'Home'
        ? all[0]
        : event.key === 'End'
          ? all.at(-1)
          : step === undefined
            ? undefined
            : all[(at + step + all.length) % all.length];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };
  mark();
  const View = root.ownerDocument.defaultView?.MutationObserver;
  const observer = View ? new View(mark) : undefined;
  observer?.observe(root, { childList: true, subtree: true });
  root.addEventListener('focusin', enter);
  root.addEventListener('keydown', move);
  return () => {
    observer?.disconnect();
    root.removeEventListener('focusin', enter);
    root.removeEventListener('keydown', move);
  };
}
