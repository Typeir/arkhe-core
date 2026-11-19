/**
 * @fileoverview One pair of live regions for the whole app. Screen readers
 * speak changes to a region they already track, not a region inserted
 * already filled, so components never carry their own: they hand text to
 * the announcer, which adds it as a new line to a region that has been in
 * the page all along. The regions sit directly in the body, marked as an
 * announcer, so a modal's hiding of the rest of the page leaves them audible.
 *
 * @module packages/core/src/announcer
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
import { ARKHE_CLASS, partAttrs } from './parts.js';
/**
 * Wait before the first message to regions made on demand, so the reader
 * sees them empty first.
 *
 * @constant ANNOUNCE_DELAY
 * @type {number}
 */
export const ANNOUNCE_DELAY = 100;
/**
 * How long a spoken line stays in its region, in ms.
 *
 * @constant ANNOUNCE_HOLD
 * @type {number}
 */
export const ANNOUNCE_HOLD = 7000;
const ROLES = {
    polite: 'status',
    assertive: 'alert',
};
/**
 * Builds one hidden live region.
 *
 * @function makeRegion
 * @param {Document} doc - Owner document.
 * @param {Politeness} politeness - Region urgency.
 * @returns {HTMLElement} Region, not yet inserted.
 */
function makeRegion(doc, politeness) {
    const region = doc.createElement('div');
    region.className = ARKHE_CLASS;
    for (const [name, value] of Object.entries(partAttrs('announcer', 'region')))
        region.setAttribute(name, value);
    region.setAttribute('data-live-announcer', '');
    region.setAttribute('data-politeness', politeness);
    region.setAttribute('role', ROLES[politeness]);
    region.setAttribute('aria-live', politeness);
    return region;
}
/**
 * Speaks text through the app's live regions.
 *
 * @class Announcer
 */
export class Announcer {
    regions = {};
    mounts = 0;
    timers = new Set();
    /**
     * Puts both regions in the body now, ahead of any message. The provider
     * calls it on mount.
     *
     * @param {Document} [doc] - Owner document. Defaults to the global one.
     * @returns {() => void} Removes the regions once every mount has undone.
     */
    mount(doc = document) {
        this.mounts += 1;
        this.ensure(doc);
        let done = false;
        return () => {
            if (done)
                return;
            done = true;
            this.mounts -= 1;
            if (this.mounts === 0)
                this.clear();
        };
    }
    /**
     * Speaks `text`. Without mounted regions it makes them and waits
     * `ANNOUNCE_DELAY` first. Blank text is ignored.
     *
     * @param {string} text - Message.
     * @param {Politeness} [politeness] - Urgency. Defaults to `polite`.
     * @returns {void}
     */
    announce(text, politeness = 'polite') {
        const message = text.trim();
        if (!message || typeof document === 'undefined')
            return;
        const fresh = !this.regions[politeness]?.isConnected;
        if (fresh)
            this.ensure(document);
        const region = this.regions[politeness];
        if (!region)
            return;
        const add = () => {
            const line = region.ownerDocument.createElement('div');
            line.textContent = message;
            region.append(line);
            this.later(() => line.remove(), ANNOUNCE_HOLD);
        };
        if (fresh)
            this.later(add, ANNOUNCE_DELAY);
        else
            add();
    }
    ensure(doc) {
        for (const politeness of ['polite', 'assertive']) {
            if (this.regions[politeness]?.isConnected)
                continue;
            const region = makeRegion(doc, politeness);
            doc.body.append(region);
            this.regions[politeness] = region;
        }
    }
    later(run, delay) {
        const timer = setTimeout(() => {
            this.timers.delete(timer);
            run();
        }, delay);
        this.timers.add(timer);
    }
    clear() {
        for (const timer of this.timers)
            clearTimeout(timer);
        this.timers.clear();
        for (const region of Object.values(this.regions))
            region?.remove();
        this.regions = {};
    }
}
/**
 * Speaks `el`'s text now and again whenever it changes, at the urgency
 * `politeness` reads at that moment.
 *
 * @function announceText
 * @param {Element} el - Element whose text is the message.
 * @param {Announcer} announcer - App announcer.
 * @param {() => Politeness} politeness - Reads the current urgency.
 * @returns {() => void} Stops watching.
 */
export function announceText(el, announcer, politeness) {
    let last = '';
    const speak = () => {
        const text = el.textContent?.trim() ?? '';
        if (text === last)
            return;
        last = text;
        announcer.announce(text, politeness());
    };
    speak();
    const observer = new MutationObserver(speak);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
}
