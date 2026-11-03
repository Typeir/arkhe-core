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

const SOFTWARE = /swiftshader|llvmpipe|softpipe|basic render|software/i;

/**
 * Session storage key of the probe result.
 *
 * @constant PROBE_KEY
 * @type {string}
 */
export const PROBE_KEY = 'arkhe-canvas-acceleration';

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
export function probeAcceleration(): Acceleration {
  const cached = readCache();
  if (cached) return cached;
  const gl = document
    .createElement('canvas')
    .getContext('webgl', { failIfMajorPerformanceCaveat: true });
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  const renderer = gl
    ? ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : 'masked'
    : 'no fast webgl';
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  const result = {
    accelerated: gl !== null && !SOFTWARE.test(renderer),
    renderer,
  };
  writeCache(result);
  return result;
}

/**
 * Reads this session's probe result.
 *
 * @function readCache
 * @returns {Acceleration | null} Cached result; null when absent or storage is blocked.
 */
function readCache(): Acceleration | null {
  try {
    const cached = sessionStorage.getItem(PROBE_KEY);
    return cached ? (JSON.parse(cached) as Acceleration) : null;
  } catch {
    return null;
  }
}

/**
 * Keeps the probe result for this session; a blocked storage is ignored.
 *
 * @function writeCache
 * @param {Acceleration} result - Probe result.
 * @returns {void}
 */
function writeCache(result: Acceleration): void {
  try {
    sessionStorage.setItem(PROBE_KEY, JSON.stringify(result));
  } catch {
    return;
  }
}
