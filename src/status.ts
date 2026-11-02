/**
 * @fileoverview Status line kinds: empty, loading, error and info, each with
 * its icon, default text and how urgently the announcer speaks it.
 *
 * @module packages/core/src/status
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { Politeness } from './announcer.js';
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
 * @property {Politeness} politeness - Announcer urgency; errors interrupt.
 * @property {string} text - Default text when the caller gives none.
 */
export interface StatusLook {
  readonly icon: ArkheIconName;
  readonly politeness: Politeness;
  readonly text: string;
}

/**
 * Returns the icon, urgency and default text of `kind`.
 *
 * @function statusLook
 * @param {StatusKind} kind - Status kind.
 * @param {ArkheLabels} labels - Label templates.
 * @returns {StatusLook} Look of the kind.
 */
export function statusLook(kind: StatusKind, labels: ArkheLabels): StatusLook {
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
