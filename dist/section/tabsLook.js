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
 * Ground a tab set assumes with no tab set around it.
 *
 * @constant TABS_GROUND
 * @type {TabsGround}
 */
export const TABS_GROUND = 'bg';
/**
 * Layer a tab set draws in on `ground`, and the ground its panels leave for
 * tab sets inside them.
 *
 * @function tabsLayer
 * @param {TabsLook} look - Tab set look.
 * @param {TabsGround} ground - What it sits on.
 * @returns {{ readonly layer?: TabsGround; readonly inner: TabsGround }} Folder layer, ground inside.
 */
export function tabsLayer(look, ground) {
    if (look === 'line')
        return { inner: ground };
    const layer = ground === 'bg' ? 'surface' : 'bg';
    return { layer, inner: layer };
}
