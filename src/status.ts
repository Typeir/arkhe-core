/**
 * @fileoverview Status line kinds: empty, loading, error and info, each with
 * its icon, default text and announcement role; and the nudge that makes a
 * polite region inserted already filled speak.
 *
 * @module packages/core/src/status
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { ArkheIconName } from './icons.js';
import type { ArkheLabels } from './labels.js';

/**
 * Kinds of status line.
 *
 * @constant STATUS_KINDS
 * @type {readonly string[]}
 */
export const STATUS_KINDS = ['empty', 'loading', 'error', 'info'] as const;

/**
 * A status line kind.
 *
 * @typedef {(typeof STATUS_KINDS)[number]} StatusKind
 */
export type StatusKind = (typeof STATUS_KINDS)[number];

/**
 * How one kind looks and announces itself.
 *
 * @interface StatusLook
 * @property {ArkheIconName} icon - Icon name.
 * @property {'status' | 'alert'} role - Live region role; errors interrupt.
 * @property {string} text - Default text when the caller gives none.
 */
export interface StatusLook {
  readonly icon: ArkheIconName;
  readonly role: 'status' | 'alert';
  readonly text: string;
}

/**
 * Returns the icon, role and default text of `kind`.
 *
 * @function statusLook
 * @param {StatusKind} kind - Status kind.
 * @param {ArkheLabels} labels - Label templates.
 * @returns {StatusLook} Look of the kind.
 */
export function statusLook(kind: StatusKind, labels: ArkheLabels): StatusLook {
  switch (kind) {
    case 'empty':
      return { icon: 'inbox', role: 'status', text: labels.statusEmpty };
    case 'loading':
      return { icon: 'loader', role: 'status', text: labels.statusLoading };
    case 'error':
      return {
        icon: 'triangle-alert',
        role: 'alert',
        text: labels.statusError,
      };
    case 'info':
      return { icon: 'info', role: 'status', text: '' };
  }
}

/**
 * How long a new polite region waits before it re-inserts its content.
 *
 * @constant LIVE_REGION_DELAY
 * @type {number}
 */
export const LIVE_REGION_DELAY = 100;

/**
 * Re-inserts a polite live region's children once it has settled in the
 * tree. Screen readers announce changes to a region they already track, not
 * one inserted already filled; moving the same nodes back in, in order, is
 * such a change and leaves the DOM as it was.
 *
 * @function announceOnMount
 * @param {Element} region - Mounted `role="status"` element.
 * @param {number} [delay] - Wait in ms. Defaults to `LIVE_REGION_DELAY`.
 * @returns {() => void} Cancels the pending re-insert.
 */
export function announceOnMount(
  region: Element,
  delay: number = LIVE_REGION_DELAY,
): () => void {
  const timer = setTimeout(() => {
    if (region.isConnected) region.append(...Array.from(region.childNodes));
  }, delay);
  return () => clearTimeout(timer);
}
