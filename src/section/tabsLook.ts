/**
 * @fileoverview How a tab set looks, and which ground it leaves for tab sets
 * nested in its panels. `line` triggers sit on a rule and leave the ground
 * as it was. `folder` tabs are drawer tabs whose panel takes the opposite
 * ground, so folders nest to any depth, alternating page and surface.
 *
 * @module packages/core/src/section/tabsLook
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

/**
 * Tab set look.
 *
 * @typedef {'line' | 'folder'} TabsLook
 */
export type TabsLook = 'line' | 'folder';

/**
 * Background a tab set sits on: the page's or a surface.
 *
 * @typedef {'bg' | 'surface'} TabsGround
 */
export type TabsGround = 'bg' | 'surface';

/**
 * Ground a tab set assumes with no tab set around it.
 *
 * @constant TABS_GROUND
 * @type {TabsGround}
 */
export const TABS_GROUND: TabsGround = 'bg';

/**
 * Layer a tab set draws in on `ground`, and the ground its panels leave for
 * tab sets inside them.
 *
 * @function tabsLayer
 * @param {TabsLook} look - Tab set look.
 * @param {TabsGround} ground - What it sits on.
 * @returns {{ readonly layer?: TabsGround; readonly inner: TabsGround }} Folder layer, ground inside.
 */
export function tabsLayer(
  look: TabsLook,
  ground: TabsGround,
): { readonly layer?: TabsGround; readonly inner: TabsGround } {
  if (look === 'line') return { inner: ground };
  const layer: TabsGround = ground === 'bg' ? 'surface' : 'bg';
  return { layer, inner: layer };
}
