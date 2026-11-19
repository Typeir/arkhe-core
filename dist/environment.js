/**
 * @fileoverview Where Arkhé components live: the root node Zag queries and
 * the element portals mount into. Lets a component work inside a shadow root
 * or a detached window, such as a pop-out panel.
 *
 * @module packages/core/src/environment
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
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
        : (root.ownerDocument ?? document);
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
    const getRootNode = input.rootNode ?? (() => document);
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
