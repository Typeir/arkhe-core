/**
 * @fileoverview Modal rules shared by both ports. Ports always drive Zag's
 * dialog as controlled, keeping their own open state when the host passes
 * none, so a server-rendered open modal can wait for its content to mount
 * before Zag traps focus. Focus returns to `finalFocus` when it gives an
 * element, else to the trigger part when one renders, else to whatever had
 * focus before opening, else, when that is gone, to its nearest focusable
 * neighbour (`FocusReturn`). Inside a shadow root the rest of that root is hidden
 * from assistive technology too, which Zag's own hiding stops short of.
 * While open, the platform's close request (the back gesture on a phone)
 * closes it; Escape stays Zag's, which cancels the key once it dismisses.
 *
 * @module packages/core/src/overlay/dialog
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { documentOf } from '../base/environment.js';
import { definedOnly } from '../base/machine.js';
/**
 * Builds Zag dialog machine props.
 *
 * @function dialogMachineProps
 * @param {DialogMachineInput} input - Port input.
 * @returns {DialogMachineProps} Machine props.
 */
export function dialogMachineProps(input) {
    const open = input.open && (input.ready ?? true);
    const memory = input.focusReturn;
    memory?.track(open, input.getRootNode());
    return definedOnly({
        id: input.id,
        open,
        role: input.role,
        initialFocusEl: input.initialFocus,
        onOpenChange: (details) => {
            input.onOpenChange(details.open);
        },
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
/**
 * Calls `onClose` on the platform's close request, such as the back gesture
 * on a phone, until stopped. Does nothing where the window has no
 * `CloseWatcher`.
 *
 * @function watchCloseRequest
 * @param {RootNode} root - Root node.
 * @param {() => void} onClose - Called on the close request.
 * @returns {() => void} Stops watching.
 */
export function watchCloseRequest(root, onClose) {
    const view = documentOf(root).defaultView;
    if (!view?.CloseWatcher)
        return () => undefined;
    const watcher = new view.CloseWatcher();
    watcher.addEventListener('close', onClose);
    return () => {
        watcher.destroy();
    };
}
