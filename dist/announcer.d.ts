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
/**
 * How urgently a message is spoken: `assertive` interrupts.
 *
 * @typedef {'polite' | 'assertive'} Politeness
 */
export type Politeness = 'polite' | 'assertive';
/**
 * Wait before the first message to regions made on demand, so the reader
 * sees them empty first.
 *
 * @constant ANNOUNCE_DELAY
 * @type {number}
 */
export declare const ANNOUNCE_DELAY = 100;
/**
 * How long a spoken line stays in its region, in ms.
 *
 * @constant ANNOUNCE_HOLD
 * @type {number}
 */
export declare const ANNOUNCE_HOLD = 7000;
/**
 * Speaks text through the app's live regions.
 *
 * @class Announcer
 */
export declare class Announcer {
    private regions;
    private mounts;
    private readonly timers;
    /**
     * Puts both regions in the body now, ahead of any message. The provider
     * calls it on mount.
     *
     * @param {Document} [doc] - Owner document. Defaults to the global one.
     * @returns {() => void} Removes the regions once every mount has undone.
     */
    mount(doc?: Document): () => void;
    /**
     * Speaks `text`. Without mounted regions it makes them and waits
     * `ANNOUNCE_DELAY` first. Blank text is ignored.
     *
     * @param {string} text - Message.
     * @param {Politeness} [politeness] - Urgency. Defaults to `polite`.
     * @returns {void}
     */
    announce(text: string, politeness?: Politeness): void;
    private ensure;
    private later;
    private clear;
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
export declare function announceText(el: Element, announcer: Announcer, politeness: () => Politeness): () => void;
