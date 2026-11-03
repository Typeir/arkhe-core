/**
 * @fileoverview Modal rules shared by both ports. Ports always drive Zag's
 * dialog as controlled, keeping their own open state when the host passes
 * none, so a server-rendered open modal can wait for its content to mount
 * before Zag traps focus. Focus returns to `finalFocus` when it gives an
 * element, else to the trigger part when one renders, else to whatever had
 * focus before opening, else, when that is gone, to its nearest focusable
 * neighbour (`FocusReturn`). Inside a shadow root the rest of that root is hidden
 * from assistive technology too, which Zag's own hiding stops short of.
 *
 * @module packages/core/src/dialog
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { definedOnly } from './machine.js';
/**
 * Builds Zag dialog machine props.
 *
 * @function dialogMachineProps
 * @param {DialogMachineInput} input - Port input.
 * @returns {object} Machine props.
 */
export function dialogMachineProps(input) {
    const open = input.open && (input.ready ?? true);
    const memory = input.focusReturn;
    memory?.track(open, input.getRootNode());
    return definedOnly({
        id: input.id,
        open,
        role: input.role,
        onOpenChange: (details) => input.onOpenChange(details.open),
        finalFocusEl: input.finalFocus || memory
            ? () => input.finalFocus?.() ?? memory?.target() ?? null
            : undefined,
        getRootNode: input.getRootNode,
    });
}
/**
 * Says whether assistive technology must skip `node`: live regions stay
 * audible, as in Zag's own hiding.
 *
 * @function keepsSpeaking
 * @param {Element} node - Sibling of the dialog's path.
 * @returns {boolean} True to leave it alone.
 */
function keepsSpeaking(node) {
    return (['script', 'style', 'output'].includes(node.localName) ||
        node.getAttribute('role') === 'status' ||
        node.hasAttribute('aria-live'));
}
/**
 * Hides from assistive technology everything in `content`'s shadow root
 * beside the path down to `content`. Outside a shadow root it does nothing:
 * Zag already hides the document around the dialog.
 *
 * @function hideShadowSiblings
 * @param {Element} content - Open dialog content.
 * @returns {() => void} Restores what it hid.
 */
export function hideShadowSiblings(content) {
    const root = content.getRootNode();
    if (root.nodeType !== 11 || !('host' in root))
        return () => undefined;
    const hidden = [];
    let node = content;
    while (node.parentNode) {
        const parent = node.parentNode;
        for (const sibling of Array.from(parent.children)) {
            if (sibling === node || keepsSpeaking(sibling))
                continue;
            if (sibling.getAttribute('aria-hidden') === 'true')
                continue;
            sibling.setAttribute('aria-hidden', 'true');
            hidden.push(sibling);
        }
        if (parent.nodeType === 11)
            break;
        node = parent;
    }
    return () => {
        for (const sibling of hidden)
            sibling.removeAttribute('aria-hidden');
    };
}
