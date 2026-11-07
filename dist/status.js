/**
 * @fileoverview Status line kinds: empty, loading, error and info, each with
 * its icon, default text and how urgently the announcer speaks it.
 *
 * @module packages/core/src/status
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Kinds of status line.
 *
 * @constant STATUS_KINDS
 * @type {readonly string[]}
 */
export const STATUS_KINDS = ['empty', 'loading', 'error', 'info'];
/**
 * Returns the icon, urgency and default text of `kind`.
 *
 * @function statusLook
 * @param {StatusKind} kind - Status kind.
 * @param {ArkheLabels} labels - Label templates.
 * @returns {StatusLook} Look of the kind.
 */
export function statusLook(kind, labels) {
    switch (kind) {
        case 'empty':
            return { icon: 'inbox', politeness: 'polite', text: labels.statusEmpty };
        case 'loading':
            return {
                icon: 'loader',
                politeness: 'polite',
                text: labels.statusLoading,
            };
        case 'error':
            return {
                icon: 'triangle-alert',
                politeness: 'assertive',
                text: labels.statusError,
            };
        case 'info':
            return { icon: 'info', politeness: 'polite', text: '' };
    }
}
