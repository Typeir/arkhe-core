/**
 * @fileoverview Lazy handle on the canvas effect engine. A provider owns
 * one, like the announcer. It holds no engine code: the port hands it a
 * loader that dynamically imports `@arkhe/core/fx`, called only when the
 * first owner mounts on the client, so SSR never runs the engine and apps
 * that never show a skeleton never download it.
 *
 * @module packages/core/src/feedback/effects
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { ownWindow, windowOf } from '../base/dom.js';
/**
 * One app's engine, made on first request.
 *
 * @class FxLoader
 */
export class FxLoader {
    /**
     * Options, or `false` for none.
     *
     * @type {EffectsSetting}
     */
    setting;
    /**
     * The engine once made; null before that and after destroy.
     *
     * @type {Fx | null}
     */
    #current = null;
    /**
     * The load in flight; null while none runs.
     *
     * @type {Promise<Fx | null> | null}
     */
    #pending = null;
    /**
     * Providers holding the engine now.
     *
     * @type {number}
     */
    #mounts = 0;
    /**
     * Imports the engine module.
     *
     * @type {() => Promise<FxModule>}
     */
    #load;
    /**
     * @param {EffectsSetting} setting - Options, or `false` for none.
     * @param {() => Promise<FxModule>} load - Imports the engine module.
     */
    constructor(setting, load) {
        this.setting = setting;
        this.#load = load;
    }
    /**
     * The engine, once loaded; null before that and when effects are off.
     *
     * @returns {Fx | null} Engine.
     */
    get engine() {
        return this.#current;
    }
    /**
     * Loads and makes the engine once, for the window of the first host that
     * asks. Resolves to null when effects are off, outside a browser, or when
     * loading fails.
     *
     * @param {HTMLElement} [host] - Owner asking; its window gets the engine. Defaults to the window core was loaded in.
     * @returns {Promise<Fx | null>} Engine.
     */
    request(host) {
        const setting = this.setting;
        const view = host ? windowOf(host) : ownWindow();
        if (setting === false || view === null) {
            return Promise.resolve(null);
        }
        if (this.#current)
            return Promise.resolve(this.#current);
        this.#pending ??= this.#load().then((mod) => {
            this.#pending = null;
            this.#current ??= mod.createFx(setting, view);
            return this.#current;
        }, () => {
            this.#pending = null;
            return null;
        });
        return this.#pending;
    }
    /**
     * Holds the engine for a provider's lifetime.
     *
     * @returns {() => void} Destroys the engine once every mount has undone.
     */
    mount() {
        this.#mounts += 1;
        let done = false;
        return () => {
            if (done)
                return;
            done = true;
            this.#mounts -= 1;
            if (this.#mounts === 0)
                this.destroy();
        };
    }
    /**
     * Destroys the engine; a later request makes a new one.
     *
     * @returns {void}
     */
    destroy() {
        this.#current?.destroy();
        this.#current = null;
    }
}
