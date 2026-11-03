/**
 * @fileoverview Lazy handle on the canvas effect engine. A provider owns
 * one, like the announcer. It holds no engine code: the port hands it a
 * loader that dynamically imports `@arkhe/core/fx`, called only when the
 * first owner mounts on the client, so SSR never runs the engine and apps
 * that never show a skeleton never download it.
 *
 * @module packages/core/src/effects
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */

import type { Fx, FxOptions } from './fx/api.js';

export type { Fx, FxOptions, FxStats } from './fx/api.js';

/**
 * What the loader resolves to: the `@arkhe/core/fx` module, or any object
 * with its `createFx`.
 *
 * @interface FxModule
 * @property {(options?: Partial<FxOptions>) => Fx} createFx - Builds an engine.
 */
export interface FxModule {
  createFx(options?: Partial<FxOptions>): Fx;
}

/**
 * Effect settings: options over the ruled defaults, or `false` for CSS
 * skeletons everywhere.
 *
 * @typedef {Partial<FxOptions> | false} EffectsSetting
 */
export type EffectsSetting = Partial<FxOptions> | false;

/**
 * One app's engine, made on first request.
 *
 * @class FxLoader
 */
export class FxLoader {
  private current: Fx | null = null;
  private pending: Promise<Fx | null> | null = null;
  private mounts = 0;

  /**
   * @param {EffectsSetting} setting - Options, or `false` for none.
   * @param {() => Promise<FxModule>} load - Imports the engine module.
   */
  constructor(
    readonly setting: EffectsSetting,
    private readonly load: () => Promise<FxModule>,
  ) {}

  /**
   * The engine, once loaded; null before that and when effects are off.
   *
   * @returns {Fx | null} Engine.
   */
  get engine(): Fx | null {
    return this.current;
  }

  /**
   * Loads and makes the engine once. Resolves to null when effects are
   * off, outside a browser, or when loading fails.
   *
   * @returns {Promise<Fx | null>} Engine.
   */
  request(): Promise<Fx | null> {
    const setting = this.setting;
    if (setting === false || typeof window === 'undefined')
      return Promise.resolve(null);
    if (this.current) return Promise.resolve(this.current);
    this.pending ??= this.load().then(
      (mod) => {
        this.pending = null;
        this.current ??= mod.createFx(setting);
        return this.current;
      },
      () => {
        this.pending = null;
        return null;
      },
    );
    return this.pending;
  }

  /**
   * Holds the engine for a provider's lifetime.
   *
   * @returns {() => void} Destroys the engine once every mount has undone.
   */
  mount(): () => void {
    this.mounts += 1;
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.mounts -= 1;
      if (this.mounts === 0) this.destroy();
    };
  }

  /**
   * Destroys the engine; a later request makes a new one.
   *
   * @returns {void}
   */
  destroy(): void {
    this.current?.destroy();
    this.current = null;
  }
}
