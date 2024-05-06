// --------------------------------------------------------------------------
import type { NavigationPanelBreakpoint } from './consts.ts';
import { NavigationPanelDirection } from './consts.ts';

export const NAVIGATION_PANEL_CLASS_OPENED = 'navigation-panel-opened' as const;
export const NAVIGATION_PANEL_CLASS_CLOSED = 'navigation-panel-closed' as const;

// --------------------------------------------------------------------------
type NavigationPanelStackEntry = {
  readonly element: Element;
  readonly toggle: HTMLInputElement;
  readonly panelDirection: NavigationPanelDirection;
  readonly breakpoint: NavigationPanelBreakpoint;
};
let NAVIGATION_PANEL_OPEN_STACK: Array<NavigationPanelStackEntry> = [];

type NavigationPanelToggleRegistryEntry = {
  readonly panel: NavigationPanelStackEntry;
  readonly label: Element;
  readonly autoClose: boolean;
};
const NAVIGATION_PANEL_TOGGLE_REGISTRY: Array<NavigationPanelToggleRegistryEntry> = [];

export function navigationPanelRegistryGetToggleTarget(
  targetId: string
): NavigationPanelToggleRegistryEntry | undefined {
  // True if the event target id is for a registered toggle element,
  // and the associated label element is visible.
  return NAVIGATION_PANEL_TOGGLE_REGISTRY.find(
    ({ label, panel: { toggle } }) => toggle.id === targetId && label.checkVisibility()
  );
}

export function navigationPanelRegistryIsToggleTarget(targetId: string): boolean {
  // True if the event target id is for a registered toggle element,
  // and the associated label element is visible.
  return !!navigationPanelRegistryGetToggleTarget(targetId);
}

export function navigationPanelRegistryHasToggleTarget(): boolean {
  // True if there is at least one registered toggle element,
  // and the associated label element is visible.
  return NAVIGATION_PANEL_TOGGLE_REGISTRY.some(({ label }) => label.checkVisibility());
}

// --------------------------------------------------------------------------
export function navigationPanelIsOpen(element: Element): boolean {
  if (!element) return false;

  return element.classList.contains(NAVIGATION_PANEL_CLASS_OPENED);
}
// @ts-expect-error adding to global window object
window.navigationPanelIsOpen = navigationPanelIsOpen;

// --------------------------------------------------------------------------
export function navigationPanelOpen(panel: NavigationPanelStackEntry): boolean {
  if (!panel?.element) return false;
  if (navigationPanelIsOpen(panel.element)) return false;

  panel.element.classList.remove('hidden');
  panel.element.classList.remove(`${panel.breakpoint}:hidden`);
  if (panel.panelDirection === NavigationPanelDirection.TOP) panel.element.classList.add('navigation-panel-top');
  if (panel.panelDirection === NavigationPanelDirection.LEFT) panel.element.classList.add('navigation-panel-left');
  if (panel.panelDirection === NavigationPanelDirection.RIGHT) panel.element.classList.add('navigation-panel-right');
  if (panel.panelDirection === NavigationPanelDirection.BOTTOM) panel.element.classList.add('navigation-panel-bottom');

  panel.element.classList.remove(NAVIGATION_PANEL_CLASS_CLOSED);
  panel.element.classList.add(NAVIGATION_PANEL_CLASS_OPENED);
  panel.toggle.checked = true;

  NAVIGATION_PANEL_OPEN_STACK.push(panel);

  return true;
}
// @ts-expect-error adding to global window object
window.navigationPanelOpen = navigationPanelOpen;

// --------------------------------------------------------------------------
export function navigationPanelClose(panel: NavigationPanelStackEntry): boolean {
  if (!panel?.element) return false;
  if (!navigationPanelIsOpen(panel.element)) return false;

  panel.element.classList.add('hidden');
  panel.element.classList.add(`${panel.breakpoint}:hidden`);
  if (panel.panelDirection === NavigationPanelDirection.TOP) panel.element.classList.remove('navigation-panel-top');
  if (panel.panelDirection === NavigationPanelDirection.LEFT) panel.element.classList.remove('navigation-panel-left');
  if (panel.panelDirection === NavigationPanelDirection.RIGHT) panel.element.classList.remove('navigation-panel-right');
  if (panel.panelDirection === NavigationPanelDirection.BOTTOM)
    panel.element.classList.remove('navigation-panel-bottom');

  panel.element.classList.remove(NAVIGATION_PANEL_CLASS_OPENED);
  panel.element.classList.add(NAVIGATION_PANEL_CLASS_CLOSED);
  panel.toggle.checked = false;

  return true;
}
// @ts-expect-error adding to global window object
window.navigationPanelClose = navigationPanelClose;

// --------------------------------------------------------------------------
export function navigationPanelCloseAll(): boolean {
  const marked: Array<number> = [];
  NAVIGATION_PANEL_OPEN_STACK.forEach((panel, i) => {
    if (navigationPanelClose(panel)) {
      marked.push(i);
    }
  });
  NAVIGATION_PANEL_OPEN_STACK = NAVIGATION_PANEL_OPEN_STACK.filter((_, i) => !marked.includes(i));

  return marked.length > 0;
}
// @ts-expect-error adding to global window object
window.navigationPanelCloseAll = navigationPanelCloseAll;

// --------------------------------------------------------------------------
export function navigationPanelToggle(panel: NavigationPanelStackEntry): boolean {
  if (navigationPanelIsOpen(panel.element)) {
    return navigationPanelClose(panel);
  }
  return navigationPanelOpen(panel);
}
// @ts-expect-error adding to global window object
window.navigationPanelToggle = navigationPanelToggle;

// --------------------------------------------------------------------------
export function navigationPanelInit(
  navId: string,
  panelDirection: NavigationPanelDirection,
  breakpoint: NavigationPanelBreakpoint,
  autoClose = false
): boolean {
  const panelId = `${navId}`;
  const toggleId = `${navId}-toggle`;
  const labelId = `${navId}-label`;

  const element = document.querySelector(`#${panelId}`);
  if (!element) {
    console.log(`[navigation] panel init: could not find element: ${panelId}`);
    return false;
  }
  const label = document.querySelector(`#${labelId}`);
  if (!label) {
    console.log(`[navigation] label init: could not find element: ${labelId}`);
    return false;
  }
  const toggle = document.querySelector<HTMLInputElement>(`#${toggleId}`);
  if (!toggle) {
    console.log(`[navigation] panel init: could not find element: ${toggleId}`);
    return false;
  }
  toggle.checked = false;
  NAVIGATION_PANEL_TOGGLE_REGISTRY.push({
    panel: { element, toggle, panelDirection, breakpoint },
    label,
    autoClose,
  });

  element.classList.remove('noscript');
  element.classList.remove('navigation-panel-top');
  element.classList.remove('navigation-panel-left');
  element.classList.remove('navigation-panel-right');
  element.classList.remove('navigation-panel-bottom');

  toggle.addEventListener('click', () => {
    navigationPanelToggle({ element, toggle, panelDirection, breakpoint });
  });

  if (autoClose) {
    const panelLinks = element.querySelectorAll(`#${navId} a:link`);
    panelLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navigationPanelCloseAll();
      });
    });
  }

  window.document.documentElement.addEventListener('click', (event: any) => {
    if (
      event.target.id !== '' &&
      navigationPanelRegistryHasToggleTarget() &&
      !navigationPanelRegistryIsToggleTarget(event.target.id) &&
      NAVIGATION_PANEL_OPEN_STACK.length > 0
    ) {
      return navigationPanelCloseAll();
    }
    return true;
  });

  console.log(`[navigation] panel init: ${panelId}`);
  return true;
}
// @ts-expect-error adding to global window object
window.navigationPanelInit = navigationPanelInit;
