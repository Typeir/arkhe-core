/**
 * @fileoverview Cheap start-up guess at whether canvases are GPU-backed.
 * Two signals must agree: a WebGL context made with
 * `failIfMajorPerformanceCaveat`, and a renderer name that is not a known
 * software rasteriser. Only one context is opened, and the answer is kept
 * for the session. The guess can be wrong; the loop's watchdog backs it up.
 *
 * @module packages/core/src/canvas/probe
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Session storage key of the probe result.
 *
 * @constant PROBE_KEY
 * @type {string}
 */
export declare const PROBE_KEY = "arkhe-canvas-acceleration";
/**
 * Probe result.
 *
 * @interface Acceleration
 * @property {boolean} accelerated - Best guess.
 * @property {string} renderer - Renderer name, or why it is unknown.
 */
export interface Acceleration {
    readonly accelerated: boolean;
    readonly renderer: string;
}
/**
 * Probes once per session: a single WebGL context, kept only long enough to
 * read its renderer. A context costs tens of milliseconds on some devices.
 *
 * @function probeAcceleration
 * @returns {Acceleration} Result.
 */
export declare function probeAcceleration(): Acceleration;
