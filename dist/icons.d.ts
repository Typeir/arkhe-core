/**
 * @fileoverview Icon adapter contract. Icons are looked up by Lucide's
 * kebab-case names; an app's own art replaces any name without touching
 * the components that use it.
 *
 * @module packages/core/src/icons
 * @version 1.0.0
 * @author Typeir
 * @since 0.1.0
 */
/**
 * Lucide names of the icons Arkhé's own components draw.
 *
 * @constant ARKHE_ICON_NAMES
 * @type {readonly string[]}
 */
export declare const ARKHE_ICON_NAMES: readonly ["x", "check", "plus", "minus", "chevron-down", "loader", "inbox", "triangle-alert", "info", "pin", "pin-off"];
/**
 * An icon Arkhé's components draw.
 *
 * @typedef {(typeof ARKHE_ICON_NAMES)[number]} ArkheIconName
 */
export type ArkheIconName = (typeof ARKHE_ICON_NAMES)[number];
/**
 * Icons by Lucide name. `R` is the port's renderable (a React component, a
 * Svelte component).
 *
 * @typedef {Readonly<Partial<Record<string, R>>>} IconSet
 * @template R
 */
export type IconSet<R> = Readonly<Partial<Record<string, R>>>;
/**
 * Returns the icon named `name` from the first set that has it.
 *
 * @function resolveIcon
 * @template R
 * @param {readonly IconSet<R>[]} sets - Sets in priority order, overrides first.
 * @param {string} name - Lucide name.
 * @returns {R | undefined} Icon, or undefined when no set has it.
 */
export declare function resolveIcon<R>(sets: readonly IconSet<R>[], name: string): R | undefined;
