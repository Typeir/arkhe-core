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
 * Elements that take focus: links, enabled form controls (`:disabled` also
 * covers a disabled fieldset's), positive tab stops and editable regions.
 *
 * @constant FOCUSABLE
 * @type {string}
 */
export declare const FOCUSABLE: string;
/**
 * A window with its constructors and globals, as `defaultView` gives it.
 *
 * @typedef {Window & typeof globalThis} OwnerWindow
 */
export type OwnerWindow = Window & typeof globalThis;
/**
 * The window this copy of core was loaded in, for code handed no node. Core's
 * one bare reference to a window global (R6); all other code reaches the
 * owner window of the node in hand.
 *
 * @function ownWindow
 * @returns {OwnerWindow | null} Window; null outside a browser, as in server rendering.
 */
export declare function ownWindow(): OwnerWindow | null;
/**
 * The window that owns `node`: its document's view. Without a node, or for
 * a document with no view, the window core was loaded in. Only for code that
 * runs in a browser.
 *
 * @function windowOf
 * @param {Node} [node] - Element or document at hand.
 * @returns {OwnerWindow} Owning window.
 */
export declare function windowOf(node?: Node): OwnerWindow;
/**
 * The main window's document, or `null` where there is none, as in server
 * rendering.
 *
 * @function mainDocument
 * @returns {Document | null} Main document.
 */
export declare function mainDocument(): Document | null;
/**
 * Says whether `value` is a DOM node, from any window.
 *
 * @function isNode
 * @param {unknown} value - Anything, e.g. an event target.
 * @returns {boolean} True for a node.
 */
export declare function isNode(value: unknown): value is Node;
/**
 * Says whether `value` is an element, from any window.
 *
 * @function isElement
 * @param {unknown} value - Anything, e.g. an event target.
 * @returns {boolean} True for an element.
 */
export declare function isElement(value: unknown): value is Element;
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
export declare function watchFindable(root: HTMLElement, onFound: (target: HTMLElement) => void): () => void;
