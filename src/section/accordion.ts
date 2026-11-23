/**
 * @fileoverview Accordion rules shared by both ports: what opening or
 * closing a section does to the open values, whether a section may close,
 * and expand / collapse all. Sections are independent unless `multiple` is
 * off.
 *
 * @module packages/core/src/section/accordion
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
 * @property {readonly AccordionItem[]} items - Sections, in order.
 * @property {boolean} [multiple] - Several open at once. Defaults to `true`.
 * @property {boolean} [collapsible] - The last open section may close. Defaults to `true`.
 */
export interface AccordionRules {
  readonly items: readonly AccordionItem[];
  readonly multiple?: boolean;
  readonly collapsible?: boolean;
}

/**
 * What can happen to an accordion's open values: a section asks to open or
 * close, or expand / collapse all is pressed.
 *
 * @typedef {{ type: 'set', item: AccordionItem, open: boolean } | { type: 'toggle-all' }} AccordionAction
 */
export type AccordionAction =
  | {
      readonly type: 'set';
      readonly item: AccordionItem;
      readonly open: boolean;
    }
  | { readonly type: 'toggle-all' };

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
 * One section opens or closes. With `multiple` off, opening one closes the
 * rest; a disabled or held section stays as it is.
 *
 * @function setSection
 * @param {readonly string[]} open - Open values now.
 * @param {AccordionItem} item - Section.
 * @param {boolean} next - True to open.
 * @param {AccordionRules} rules - How sections combine.
 * @returns {readonly string[]} Open values after.
 */
function setSection(
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
 * Expand all, or collapse all once every section is open. Disabled sections
 * keep their state; collapse all keeps the first open section when
 * `collapsible` is off.
 *
 * @function toggleAll
 * @param {readonly string[]} open - Open values now.
 * @param {AccordionRules} rules - How sections combine.
 * @returns {readonly string[]} Open values after.
 */
function toggleAll(
  open: readonly string[],
  rules: AccordionRules,
): readonly string[] {
  const { items } = rules;
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
  const held =
    rules.collapsible === false && first !== undefined ? [first] : [];
  return [...kept.map((item) => item.value), ...held];
}

/**
 * Accordion reducer: a section opening or closing, or expand / collapse
 * all.
 *
 * @function accordionReduce
 * @param {readonly string[]} open - Open values now.
 * @param {AccordionAction} action - What happened.
 * @param {AccordionRules} rules - Sections and how they combine.
 * @returns {readonly string[]} Open values after; the same array when nothing changed.
 */
export function accordionReduce(
  open: readonly string[],
  action: AccordionAction,
  rules: AccordionRules,
): readonly string[] {
  return action.type === 'set'
    ? setSection(open, action.item, action.open, rules)
    : toggleAll(open, rules);
}
