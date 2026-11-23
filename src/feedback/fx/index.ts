/**
 * @fileoverview `@arkhe/core/fx`: the canvas skeleton effect engine, kept
 * out of the main entry so apps that never show a skeleton never download
 * it. Ports load it with a dynamic `import()` when the first owner mounts.
 *
 * @module packages/core/src/feedback/fx/index
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import { type OwnerWindow, ownWindow } from '../../base/dom.js';
import {
  canRunFx,
  DEFAULT_FX_OPTIONS,
  type Fx,
  type FxOptions,
  InertFx,
} from './api.js';
import { FxEngine } from './engine.js';

export {
  DEFAULT_FX_OPTIONS,
  InertFx,
  PAINTED_ATTR,
  canRunFx,
  type Fx,
  type FxOptions,
  type FxStats,
} from './api.js';
export { FxEngine } from './engine.js';
export type { PainterKind } from './skeleton/painter.js';

/**
 * Creates an engine with `options` over the ruled defaults. Where canvases
 * cannot run, or under forced colours, it returns an inert engine: the CSS
 * skeleton stays and reveals end at once.
 *
 * @function createFx
 * @param {Partial<FxOptions>} [options] - Overrides. Defaults to none.
 * @param {OwnerWindow | null} [view] - Window the engine draws in; null outside a browser. Defaults to the window core was loaded in.
 * @returns {Fx} Engine.
 */
export function createFx(
  options: Partial<FxOptions> = {},
  view: OwnerWindow | null = ownWindow(),
): Fx {
  if (
    view === null ||
    !canRunFx(view) ||
    view.matchMedia('(forced-colors: active)').matches
  ) {
    return new InertFx();
  }
  return new FxEngine({ ...DEFAULT_FX_OPTIONS, ...options }, view);
}
