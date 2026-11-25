/**
 * @fileoverview DOM helpers shared inside core, safe across windows: checks
 * by `nodeType` rather than `instanceof` (an element from a pop-out window
 * is no `instanceof` this window's `Element`), the one focusable selector,
 * and the find-in-page watcher that collapsibles and tabs share.
 *
 * @module packages/core/src/base/dom
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */
/**
 * `nodeType` of an element.
 *
 * @constant ELEMENT_NODE
 * @type {number}
 */
const ELEMENT_NODE = 1;
/**
 * Elements that take focus: links, enabled form controls (`:disabled` also
 * covers a disabled fieldset's), positive tab stops and editable regions.
 *
 * @constant FOCUSABLE
 * @type {string}
 */
export const FOCUSABLE = [
    'a[href]',
    'button:not(:disabled)',
    'input:not(:disabled):not([type="hidden"])',
    'select:not(:disabled)',
    'textarea:not(:disabled)',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
].join(', ');
/**
 * `nodeType` of a document.
 *
 * @constant DOCUMENT_NODE
 * @type {number}
 */
const DOCUMENT_NODE = 9;
/**
 * The window this copy of core was loaded in, for code handed no node. Core's
 * one bare reference to a window global (R6); all other code reaches the
 * owner window of the node in hand.
 *
 * @function ownWindow
 * @returns {OwnerWindow | null} Window; null outside a browser, as in server rendering.
 */
export function ownWindow() {
    // eslint-disable-next-line no-restricted-globals -- the one fallback when no node names a window
    return typeof window === 'undefined' ? null : window;
}
/**
 * The window that owns `node`: its document's view. Without a node, or for
 * a document with no view, the window core was loaded in. Only for code that
 * runs in a browser.
 *
 * @function windowOf
 * @param {Node} [node] - Element or document at hand.
 * @returns {OwnerWindow} Owning window.
 */
export function windowOf(node) {
    const owner = node?.nodeType === DOCUMENT_NODE ? node : node?.ownerDocument;
    return owner?.defaultView ?? ownWindow();
}
/**
 * The main window's document, or `null` where there is none, as in server
 * rendering.
 *
 * @function mainDocument
 * @returns {Document | null} Main document.
 */
export function mainDocument() {
    return ownWindow()?.document ?? null;
}
/**
 * Says whether `value` is a DOM node, from any window.
 *
 * @function isNode
 * @param {unknown} value - Anything, e.g. an event target.
 * @returns {boolean} True for a node.
 */
export function isNode(value) {
    return (typeof value === 'object' &&
        value !== null &&
        typeof value.nodeType === 'number');
}
/**
 * Says whether `value` is an element, from any window.
 *
 * @function isElement
 * @param {unknown} value - Anything, e.g. an event target.
 * @returns {boolean} True for an element.
 */
export function isElement(value) {
    return isNode(value) && value.nodeType === ELEMENT_NODE;
}
/**
 * Keeps the closed children of `root` findable: each child marked
 * `data-findable` that the framework hides with plain `hidden` becomes
 * `hidden="until-found"`, which find-in-page and text fragments can reveal.
 * When the browser reveals one, `onFound` hears the revealed element.
 *
 * @function watchFindable
 * @param {HTMLElement} root - Parent of the findable children.
 * @param {(target: HTMLElement) => void} onFound - Hears each reveal.
 * @returns {() => void} Stops watching.
 */
export function watchFindable(root, onFound) {
    const mark = () => {
        for (const child of root.querySelectorAll(':scope > [data-findable][hidden]')) {
            if (child.getAttribute('hidden') !== 'until-found') {
                child.setAttribute('hidden', 'until-found');
            }
        }
    };
    const found = (event) => {
        if (isElement(event.target))
            onFound(event.target);
    };
    mark();
    const Observer = root.ownerDocument.defaultView?.MutationObserver;
    const observer = Observer ? new Observer(mark) : null;
    observer?.observe(root, { subtree: true, attributeFilter: ['hidden'] });
    root.addEventListener('beforematch', found, true);
    return () => {
        observer?.disconnect();
        root.removeEventListener('beforematch', found, true);
    };
}
