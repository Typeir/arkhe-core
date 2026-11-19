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
/**
 * One app's engine, made on first request.
 *
 * @class FxLoader
 */
export class FxLoader {
    setting;
    load;
    current = null;
    pending = null;
    mounts = 0;
    /**
     * @param {EffectsSetting} setting - Options, or `false` for none.
     * @param {() => Promise<FxModule>} load - Imports the engine module.
     */
    constructor(setting, load) {
        this.setting = setting;
        this.load = load;
    }
    /**
     * The engine, once loaded; null before that and when effects are off.
     *
     * @returns {Fx | null} Engine.
     */
    get engine() {
        return this.current;
    }
    /**
     * Loads and makes the engine once. Resolves to null when effects are
     * off, outside a browser, or when loading fails.
     *
     * @returns {Promise<Fx | null>} Engine.
     */
    request() {
        const setting = this.setting;
        if (setting === false || typeof window === 'undefined')
            return Promise.resolve(null);
        if (this.current)
            return Promise.resolve(this.current);
        this.pending ??= this.load().then((mod) => {
            this.pending = null;
            this.current ??= mod.createFx(setting);
            return this.current;
        }, () => {
            this.pending = null;
            return null;
        });
        return this.pending;
    }
    /**
     * Holds the engine for a provider's lifetime.
     *
     * @returns {() => void} Destroys the engine once every mount has undone.
     */
    mount() {
        this.mounts += 1;
        let done = false;
        return () => {
            if (done)
                return;
            done = true;
            this.mounts -= 1;
            if (this.mounts === 0)
                this.destroy();
        };
    }
    /**
     * Destroys the engine; a later request makes a new one.
     *
     * @returns {void}
     */
    destroy() {
        this.current?.destroy();
        this.current = null;
    }
}
