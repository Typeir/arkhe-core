/**
 * @fileoverview Where Arkhé components live: the root node Zag queries and
 * the element portals mount into. Lets a component work inside a shadow root
 * or a detached window, such as a pop-out panel.
 *
 * @module packages/core/src/base/environment
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { mainDocument } from './dom.js';
/**
 * Returns the document that owns `root`.
 *
 * @function documentOf
 * @param {RootNode} root - Document or shadow root.
 * @returns {Document} Owning document.
 */
export function documentOf(root) {
    return root.nodeType === 9
        ? root
        : root.host.ownerDocument;
}
/**
 * The root outside any `ArkheEnvironment`: the main window's document.
 *
 * @function mainRoot
 * @returns {RootNode} Main document.
 * @throws {ReferenceError} Where there is no document, as in server rendering.
 */
function mainRoot() {
    const doc = mainDocument();
    if (!doc)
        throw new ReferenceError('document is not defined');
    return doc;
}
/**
 * Builds an environment. Without a container, portals mount into the body
 * of the root node's own document, not the main window's: Zag's portal
 * would otherwise fall back to the main window.
 *
 * @function createEnvironment
 * @param {EnvironmentInput} [input] - App settings.
 * @returns {ArkheEnvironmentValue} Environment.
 */
export function createEnvironment(input = {}) {
    const getRootNode = input.rootNode ?? mainRoot;
    const { container } = input;
    return {
        getRootNode,
        container: () => container ?? documentOf(getRootNode()).body,
    };
}
/**
 * The main document, used outside any `ArkheEnvironment`.
 *
 * @constant DEFAULT_ENVIRONMENT
 * @type {ArkheEnvironmentValue}
 */
export const DEFAULT_ENVIRONMENT = createEnvironment();
