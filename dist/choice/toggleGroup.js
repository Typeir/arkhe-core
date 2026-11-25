/**
 * @fileoverview Toggle group rules shared by both ports: what a press does
 * to the pressed values, which items show under a limit, and the toolbar
 * attributes that let the browser's focusgroup move focus with arrows.
 *
 * @module packages/core/src/choice/toggleGroup
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */
/**
 * Builds the root attributes.
 *
 * @function toggleRootAttrs
 * @param {string} label - Group name.
 * @param {ToggleOrientation} [orientation] - Direction. Defaults to `horizontal`.
 * @returns {ToggleRootAttrs} Root attributes.
 */
export function toggleRootAttrs(label, orientation = 'horizontal') {
    const vertical = orientation === 'vertical';
    return {
        role: 'toolbar',
        'aria-label': label,
        'aria-orientation': vertical ? 'vertical' : undefined,
        focusgroup: vertical ? 'toolbar wrap block' : 'toolbar wrap',
        'data-orientation': orientation,
    };
}
/**
 * Toggle group reducer. A press keeps several pressed under `multiple`;
 * otherwise it takes over, and a press on the pressed item releases it only
 * when `deselectable`. A disabled item changes nothing. Clear releases all.
 *
 * @function toggleReduce
 * @param {readonly string[]} pressed - Values pressed now.
 * @param {ToggleAction} action - What happened.
 * @param {ToggleRules} rules - How presses combine.
 * @returns {readonly string[]} Values pressed after; the same array when nothing changed.
 */
export function toggleReduce(pressed, action, rules) {
    if (action.type === 'clear')
        return pressed.length > 0 ? [] : pressed;
    const { item } = action;
    if (item.disabled)
        return pressed;
    const on = pressed.includes(item.value);
    if (rules.multiple) {
        return on
            ? pressed.filter((value) => value !== item.value)
            : [...pressed, item.value];
    }
    if (!on)
        return [item.value];
    return rules.deselectable ? [] : pressed;
}
/**
 * Returns the items to draw: all of them when there is no limit or the
 * group is expanded, else the first `limit` plus every pressed item past
 * it, in order.
 *
 * @function toggleShown
 * @param {readonly ToggleItem[]} items - Items, in order.
 * @param {readonly string[]} pressed - Values pressed now.
 * @param {number | undefined} limit - Items shown while collapsed.
 * @param {boolean} expanded - True once the reader asked for more.
 * @returns {readonly ToggleItem[]} Items to draw.
 */
export function toggleShown(items, pressed, limit, expanded) {
    if (limit === undefined || expanded || items.length <= limit)
        return items;
    return items.filter((item, index) => index < limit || pressed.includes(item.value));
}
