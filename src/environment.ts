/**
 * @fileoverview Where Arkhé components live: the root node Zag queries and
 * the element portals mount into. Lets a component work inside a shadow root
 * or a detached window, such as Flamelost's pop-out panels.
 *
 * @module packages/core/src/environment
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

/**
 * A node Zag can query for its parts.
 *
 * @typedef {Document | ShadowRoot} RootNode
 */
export type RootNode = Document | ShadowRoot;

/**
 * What an app may set. Both default to the main document.
 *
 * @interface EnvironmentInput
 * @property {() => RootNode} [rootNode] - Returns the root node.
 * @property {HTMLElement | (() => HTMLElement | undefined)} [container] - Portal target.
 */
export interface EnvironmentInput {
  readonly rootNode?: () => RootNode;
  readonly container?: HTMLElement | (() => HTMLElement | undefined);
}

/**
 * What components read.
 *
 * @interface ArkheEnvironmentValue
 * @property {() => RootNode} getRootNode - Returns the root node.
 * @property {() => HTMLElement | undefined} container - Returns the portal target.
 */
export interface ArkheEnvironmentValue {
  readonly getRootNode: () => RootNode;
  readonly container: () => HTMLElement | undefined;
}

/**
 * Context key both ports publish the environment under.
 *
 * @constant ENVIRONMENT_KEY
 * @type {symbol}
 */
export const ENVIRONMENT_KEY = Symbol.for('arkhe.environment');

/**
 * Returns the document that owns `root`.
 *
 * @function documentOf
 * @param {RootNode} root - Document or shadow root.
 * @returns {Document} Owning document.
 */
export function documentOf(root: RootNode): Document {
  return root.nodeType === 9
    ? (root as Document)
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
export function createEnvironment(
  input: EnvironmentInput = {},
): ArkheEnvironmentValue {
  const getRootNode = input.rootNode ?? (() => document);
  const { container } = input;
  return {
    getRootNode,
    container:
      typeof container === 'function'
        ? container
        : () => container ?? documentOf(getRootNode()).body,
  };
}

/**
 * The main document, used outside any `ArkheEnvironment`.
 *
 * @constant DEFAULT_ENVIRONMENT
 * @type {ArkheEnvironmentValue}
 */
export const DEFAULT_ENVIRONMENT: ArkheEnvironmentValue = createEnvironment();
