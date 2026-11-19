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
export declare const STATUS_KINDS: readonly ["empty", "loading", "error", "info"];
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
export declare function statusLook(kind: StatusKind, labels: ArkheLabels): StatusLook;
