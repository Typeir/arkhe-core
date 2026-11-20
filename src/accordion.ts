/**
 * @fileoverview Accordion rules shared by both ports: what opening or
 * closing a section does to the open values, whether a section may close,
 * and expand / collapse all. Sections are independent unless `multiple` is
 * off.
 *
 * @module packages/core/src/accordion
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

/**
 * One section.
 *
 * @interface AccordionItem
 * @property {string} value - Key; any text.
 * @property {string} title - Text of the section's trigger.
 * @property {boolean} [disabled] - The section neither opens nor closes.
 */
export interface AccordionItem {
  readonly value: string;
  readonly title: string;
  readonly disabled?: boolean;
}

/**
 * How sections combine.
 *
 * @interface AccordionRules
 * @property {boolean} [multiple] - Several open at once; true by default.
 * @property {boolean} [collapsible] - The last open section may close; true by default.
 */
export interface AccordionRules {
  readonly multiple?: boolean;
  readonly collapsible?: boolean;
}

/**
 * Says whether the section `value` is held open: it is the only one open
 * and `collapsible` is off, so its trigger is disabled but focusable.
 *
 * @function accordionHeld
 * @param {readonly string[]} open - Open values.
 * @param {string} value - Section.
 * @param {AccordionRules} rules - How sections combine.
 * @returns {boolean} True while held open.
 */
export function accordionHeld(
  open: readonly string[],
  value: string,
  rules: AccordionRules,
): boolean {
  return rules.collapsible === false && open.length === 1 && open[0] === value;
}

/**
 * Returns the open values after section `item` asks to open or close.
 * With `multiple` off, opening one closes the rest; a held section stays.
 *
 * @function accordionToggle
 * @param {readonly string[]} open - Open values now.
 * @param {AccordionItem} item - Section.
 * @param {boolean} next - True to open.
 * @param {AccordionRules} rules - How sections combine.
 * @returns {readonly string[]} Open values after.
 */
export function accordionToggle(
  open: readonly string[],
  item: AccordionItem,
  next: boolean,
  rules: AccordionRules,
): readonly string[] {
  if (item.disabled || open.includes(item.value) === next) return open;
  if (!next) {
    if (accordionHeld(open, item.value, rules)) return open;
    return open.filter((value) => value !== item.value);
  }
  return rules.multiple === false ? [item.value] : [...open, item.value];
}

/**
 * Says whether every enabled section is open.
 *
 * @function accordionAllOpen
 * @param {readonly AccordionItem[]} items - Sections.
 * @param {readonly string[]} open - Open values.
 * @returns {boolean} True when all are open.
 */
export function accordionAllOpen(
  items: readonly AccordionItem[],
  open: readonly string[],
): boolean {
  return items.every((item) => item.disabled || open.includes(item.value));
}

/**
 * Returns the open values after expand all or collapse all. Disabled
 * sections keep their state; collapse all keeps the first open section
 * when `collapsible` is off.
 *
 * @function accordionToggleAll
 * @param {readonly AccordionItem[]} items - Sections.
 * @param {readonly string[]} open - Open values now.
 * @param {AccordionRules} rules - How sections combine.
 * @returns {readonly string[]} Open values after.
 */
export function accordionToggleAll(
  items: readonly AccordionItem[],
  open: readonly string[],
  rules: AccordionRules,
): readonly string[] {
  const kept = items.filter(
    (item) => item.disabled && open.includes(item.value),
  );
  if (!accordionAllOpen(items, open)) {
    return items
      .filter((item) => !item.disabled || open.includes(item.value))
      .map((item) => item.value);
  }
  const first = open.find(
    (value) => !kept.some((item) => item.value === value),
  );
  const held = rules.collapsible === false && first ? [first] : [];
  return [...kept.map((item) => item.value), ...held];
}
