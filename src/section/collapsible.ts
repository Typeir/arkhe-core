/**
 * @fileoverview Collapsible rules shared by both ports: part ids, the
 * heading that may wrap the trigger, and the find-in-page reveal. The
 * closed region is `hidden="until-found"`, so the browser can open it.
 *
 * @module packages/core/src/section/collapsible
 * @version 1.0.0
 * @author Typeir
 * @since 0.4.0
 */

/**
 * Heading level that may wrap a collapsible's trigger.
 *
 * @typedef {2 | 3 | 4 | 5 | 6} HeadingLevel
 */
export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Ids of a collapsible's parts.
 *
 * @interface CollapsibleIds
 * @property {string} trigger - Id of the trigger button.
 * @property {string} content - Id of the region it opens.
 */
export interface CollapsibleIds {
  readonly trigger: string;
  readonly content: string;
}

/**
 * Derives part ids from one base id, made safe for IDREFs.
 *
 * @function collapsibleIds
 * @param {string} base - Unique id of the collapsible.
 * @returns {CollapsibleIds} Part ids.
 */
export function collapsibleIds(base: string): CollapsibleIds {
  const safe = base.replace(/[^\w-]/g, '-');
  return { trigger: `${safe}-trigger`, content: `${safe}-content` };
}

/**
 * The tag of the heading around the trigger, or undefined for none.
 *
 * @function headingTag
 * @param {HeadingLevel} [level] - Heading level.
 * @returns {`h${HeadingLevel}` | undefined} Tag name.
 */
export function headingTag(
  level: HeadingLevel | undefined,
): `h${HeadingLevel}` | undefined {
  return level === undefined ? undefined : `h${level}`;
}

/**
 * Keeps a closed region findable: the framework writes plain `hidden`, this
 * turns it into `hidden="until-found"`; when find-in-page or a text
 * fragment reveals the region, `onFound` opens the collapsible. A nested
 * region revealed inside it opens it too.
 *
 * @function findableRegion
 * @param {HTMLElement} root - Collapsible root; the region is its child.
 * @param {() => void} onFound - Opens the collapsible.
 * @returns {() => void} Stops watching.
 */
export function findableRegion(
  root: HTMLElement,
  onFound: () => void,
): () => void {
  const mark = () => {
    for (const region of root.querySelectorAll<HTMLElement>(
      ':scope > [data-findable][hidden]',
    )) {
      if (region.getAttribute('hidden') !== 'until-found') {
        region.setAttribute('hidden', 'until-found');
      }
    }
  };
  mark();
  const View = root.ownerDocument.defaultView?.MutationObserver;
  const observer = View ? new View(mark) : undefined;
  observer?.observe(root, { subtree: true, attributeFilter: ['hidden'] });
  root.addEventListener('beforematch', onFound, true);
  return () => {
    observer?.disconnect();
    root.removeEventListener('beforematch', onFound, true);
  };
}

/**
 * What can happen to a collapsible: a press on its trigger, a host or
 * accordion setting it, or the browser revealing it for find-in-page.
 *
 * @typedef {{ type: 'toggle' } | { type: 'set', open: boolean } | { type: 'reveal' }} CollapsibleAction
 */
export type CollapsibleAction =
  | { readonly type: 'toggle' }
  | { readonly type: 'set'; readonly open: boolean }
  | { readonly type: 'reveal' };

/**
 * How a collapsible takes actions.
 *
 * @interface CollapsibleRules
 * @property {boolean} [disabled] - Presses and sets change nothing.
 */
export interface CollapsibleRules {
  readonly disabled?: boolean;
}

/**
 * Collapsible reducer. A disabled collapsible ignores presses and sets, but
 * a reveal always opens it: the browser has already shown the region.
 *
 * @function collapsibleReduce
 * @param {boolean} open - Open now.
 * @param {CollapsibleAction} action - What happened.
 * @param {CollapsibleRules} rules - How it takes actions.
 * @returns {boolean} Open after.
 */
export function collapsibleReduce(
  open: boolean,
  action: CollapsibleAction,
  rules: CollapsibleRules,
): boolean {
  if (action.type === 'reveal') return true;
  if (rules.disabled) return open;
  return action.type === 'toggle' ? !open : action.open;
}
