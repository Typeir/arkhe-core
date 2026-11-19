/**
 * @fileoverview The skeleton effect engine: one per app. It owns the frame
 * loop, the canvas budget, the observers and the palette; puts each owner
 * on a surface (canvases in the owner, or the viewport canvas for page-level
 * owners on software raster); reveals on `ready`; and re-measures or
 * repaints on resize, DPR, font and theme changes.
 *
 * @module packages/core/src/fx/engine
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { CanvasBudget } from '../canvas/budget.js';
import { DisplayWatcher } from '../canvas/display.js';
import { StampCache } from '../canvas/draw/atlas.js';
import { FrameLoop } from '../canvas/loop.js';
import { needsInFlowCanvas } from '../canvas/measure.js';
import { ObserverHub, SizeWatcher, sizeOf } from '../canvas/observers.js';
import { probeAcceleration } from '../canvas/probe.js';
import { TiledSurface } from '../canvas/tiled.js';
import { ViewportSurface } from '../canvas/viewport.js';
import { PAINTED_ATTR } from './api.js';
import { buildAtlas } from './skeleton/atlas.js';
import { readPalette } from './skeleton/palette.js';
import { SkeletonRegion } from './skeleton/region.js';
/**
 * Effect engine.
 *
 * @class FxEngine
 */
export class FxEngine {
    opts;
    loop = new FrameLoop();
    hub = new ObserverHub();
    display;
    budget;
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    acceleration;
    revision = 0;
    style;
    atlases = new StampCache();
    entries = new Map();
    sizes;
    context;
    useViewport;
    viewport = null;
    /**
     * @param {FxOptions} opts - Complete options.
     */
    constructor(opts) {
        this.opts = opts;
        this.display = new DisplayWatcher(opts.maxDpr, this.onDisplay);
        this.budget = new CanvasBudget(opts.maxCanvases, this.pixelBudget());
        const palette = readPalette(document.documentElement);
        this.style = {
            painter: opts.painter,
            palette,
            atlas: (dpr) => this.atlases.get(`${dpr}|${this.style.palette.key}`, () => buildAtlas(dpr, this.style.palette)),
        };
        this.context = {
            loop: this.loop,
            budget: this.budget,
            hub: this.hub,
            display: this.display,
            revision: () => this.revision,
            sleep: opts.sleep,
            tileScale: opts.bandScale,
            wakeMargin: `${opts.wakeMargin * 100}% 0px`,
            painted: (region) => this.painted(region.host),
            done: (region) => this.finish(region.host, true),
        };
        this.sizes = new SizeWatcher((changed) => this.remeasure(changed, true));
        this.acceleration = probeAcceleration();
        this.useViewport =
            opts.surface === 'viewport' ||
                (opts.surface === 'auto' && !this.acceleration.accelerated);
        this.loop.cap(opts.maxFps);
        if (opts.watchdog)
            this.loop.watchdog();
        addEventListener('scroll', this.onScroll, { passive: true });
    }
    /**
     * Measures `host`'s skeleton and starts animating it. Attaching again
     * drops the old state and re-measures.
     *
     * @param {HTMLElement} host - Owner element.
     * @returns {void}
     */
    attach(host) {
        if (this.entries.has(host))
            this.finish(host, false);
        this.scan([host]);
    }
    /**
     * The content has replaced the skeleton under `host`: start the reveal.
     * Live canvases repaint in this task, so the swap never shows uncovered.
     *
     * @param {HTMLElement} host - Owner element.
     * @param {() => void} [onRevealed] - Called once the reveal ends, or now when there is none.
     * @returns {void}
     */
    ready(host, onRevealed) {
        const entry = this.entries.get(host);
        if (!entry)
            return onRevealed?.();
        entry.onRevealed = onRevealed;
        const { region, surface } = entry;
        const near = surface
            ? surface.near()
            : (this.viewport?.near(region) ?? true);
        const top = near ? region.box().top : Infinity;
        const bottom = near ? this.display.viewH - top : -Infinity;
        region.ready(performance.now(), -top, bottom);
        region.swapped = true;
        if (surface)
            surface.paintNow(top);
        else if (near)
            this.viewport?.paintNow();
        this.kick(entry);
    }
    /**
     * Drops `host` without revealing.
     *
     * @param {HTMLElement} host - Owner element.
     * @returns {void}
     */
    detach(host) {
        this.finish(host, false);
    }
    /**
     * Counters, for tests and tuning.
     *
     * @returns {FxStats} Stats.
     */
    stats() {
        const vp = this.viewport ? 1 : 0;
        const tiles = [...this.entries.values()].reduce((n, e) => n + (e.surface?.liveCanvases() ?? 0), 0);
        const vpPx = this.viewport?.pixels() ?? 0;
        return {
            frames: this.loop.frames,
            drawMs: this.loop.drawMs,
            running: this.loop.running ? 1 : 0,
            regions: this.entries.size,
            liveCanvases: tiles + vp,
            livePx: this.budget.livePixels + vpPx,
            peakCanvases: this.budget.peakCount + vp,
            peakPx: this.budget.peakPixels + vpPx,
            accelerated: this.acceleration.accelerated ? 1 : 0,
            viewport: this.useViewport ? 1 : 0,
            tier: this.loop.tier,
        };
    }
    /**
     * Restarts the frame and peak counters.
     *
     * @returns {void}
     */
    resetStats() {
        this.loop.frames = 0;
        this.loop.drawMs = 0;
        this.budget.resetPeaks();
    }
    /**
     * Removes every canvas, observer and listener.
     *
     * @returns {void}
     */
    destroy() {
        for (const host of [...this.entries.keys()])
            this.finish(host, false);
        this.viewport?.destroy();
        this.viewport = null;
        this.loop.clear();
        this.hub.disconnect();
        this.sizes.disconnect();
        this.display.destroy();
        this.atlases.clear();
        removeEventListener('scroll', this.onScroll);
    }
    pixelBudget() {
        return this.opts.pixelBudget * this.display.screenPixels;
    }
    scan(hosts) {
        const statics = hosts.filter((h) => getComputedStyle(h).position === 'static');
        for (const h of statics)
            h.style.position = 'relative';
        this.style.atlas(this.display.dpr);
        const read = hosts.map((host) => {
            const region = new SkeletonRegion(host, this.reduced, this.style);
            region.measure();
            const pageLevel = this.useViewport &&
                (this.opts.surface === 'viewport' || !needsInFlowCanvas(host));
            return { host, region, pageLevel, size: sizeOf(host) };
        });
        for (const { host, region, pageLevel, size } of read) {
            const surface = pageLevel ? null : new TiledSurface(this.context, region);
            if (pageLevel)
                this.viewportSurface().add(region);
            this.entries.set(host, { region, surface });
            this.sizes.watch(host, size);
        }
    }
    viewportSurface() {
        this.viewport ??= new ViewportSurface(this.context);
        return this.viewport;
    }
    painted(host) {
        if (host.hasAttribute(PAINTED_ATTR))
            return;
        queueMicrotask(() => {
            if (this.entries.has(host))
                host.setAttribute(PAINTED_ATTR, '');
        });
    }
    finish(host, revealed) {
        const entry = this.entries.get(host);
        if (!entry)
            return;
        entry.surface?.teardown();
        this.viewport?.remove(entry.region);
        this.sizes.unwatch(host);
        host.removeAttribute(PAINTED_ATTR);
        this.entries.delete(host);
        if (revealed && entry.region.readyAt !== null)
            entry.onRevealed?.();
    }
    kick(entry) {
        entry.surface?.kick();
        this.viewport?.kick();
    }
    remeasure(hosts, force) {
        const changed = [];
        for (const host of hosts) {
            const entry = this.entries.get(host);
            if (!entry || (!this.sizes.update(host) && !force))
                continue;
            if (!entry.region.swapped)
                entry.region.measure();
            changed.push(entry);
        }
        for (const entry of changed) {
            if (entry.region.swapped) {
                entry.region.settle();
                this.kick(entry);
                continue;
            }
            entry.surface?.rebuild();
            this.viewport?.remeasured(entry.region);
        }
    }
    onDisplay = (change) => {
        if (change === 'theme') {
            this.style.palette = readPalette(document.documentElement);
            this.revision += 1;
            this.atlases.clear();
            for (const entry of this.entries.values())
                this.kick(entry);
            return;
        }
        this.budget.maxPixels = this.pixelBudget();
        if (change !== 'height') {
            this.atlases.clear();
            this.remeasure([...this.entries.keys()], true);
        }
        this.viewport?.resize();
        this.viewport?.kick();
    };
    onScroll = () => {
        for (const entry of this.entries.values())
            entry.surface?.scrolled();
    };
}
