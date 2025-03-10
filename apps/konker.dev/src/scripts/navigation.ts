/* eslint-disable fp/no-unused-expression,fp/no-mutation,fp/no-mutating-methods,fp/no-nil,fp/no-let */
import { NavigationPanelDirection } from './consts';
import {
  NAVIGATION_PANEL_CLASS_CLOSED,
  NAVIGATION_PANEL_CLASS_OPENED,
  NAVIGATION_PANEL_ICON_CLASS_HIDDEN,
  NAVIGATION_PANEL_ICON_CLASS_VISIBLE,
  type NavigationPanelBreakpoint,
} from './consts';

// --------------------------------------------------------------------------
type NavigationPanelStackEntry = {
  readonly element: Element;
  readonly toggle: HTMLInputElement;
  readonly label: Element;
  readonly openIcon: Element | null;
  readonly closeIcon: Element | null;
  readonly panelDirection: NavigationPanelDirection;
  readonly breakpoint: NavigationPanelBreakpoint;
};
let NAVIGATION_PANEL_OPEN_STACK: Array<NavigationPanelStackEntry> = [];

type NavigationPanelToggleRegistryEntry = {
  readonly panel: NavigationPanelStackEntry;
  readonly autoClose: boolean;
};
const NAVIGATION_PANEL_TOGGLE_REGISTRY: Array<NavigationPanelToggleRegistryEntry> = [];

export function navigationPanelRegistryGetToggleTarget(
  targetId: string
): NavigationPanelToggleRegistryEntry | undefined {
  // True if the event target id is for a registered toggle element,
  // and the associated label element is visible.
  return NAVIGATION_PANEL_TOGGLE_REGISTRY.find(
    ({ panel: { label, toggle } }) => toggle.id === targetId && label.checkVisibility()
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
  return NAVIGATION_PANEL_TOGGLE_REGISTRY.some(({ panel: { label } }) => label.checkVisibility());
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

  // First close any other open panels
  navigationPanelCloseAll();

  panel.element.classList.remove('hidden');
  panel.element.classList.remove(`${panel.breakpoint}:hidden`);
  if (panel.panelDirection === NavigationPanelDirection.TOP) panel.element.classList.add('navigation-panel-top');
  if (panel.panelDirection === NavigationPanelDirection.LEFT) panel.element.classList.add('navigation-panel-left');
  if (panel.panelDirection === NavigationPanelDirection.RIGHT) panel.element.classList.add('navigation-panel-right');
  if (panel.panelDirection === NavigationPanelDirection.BOTTOM) panel.element.classList.add('navigation-panel-bottom');

  panel.element.classList.remove(NAVIGATION_PANEL_CLASS_CLOSED);
  panel.element.classList.add(NAVIGATION_PANEL_CLASS_OPENED);
  panel.toggle.checked = true;
  panel.openIcon?.classList?.remove(NAVIGATION_PANEL_ICON_CLASS_VISIBLE);
  panel.openIcon?.classList?.add(NAVIGATION_PANEL_ICON_CLASS_HIDDEN);
  panel.closeIcon?.classList?.remove(NAVIGATION_PANEL_ICON_CLASS_HIDDEN);
  panel.closeIcon?.classList?.add(NAVIGATION_PANEL_ICON_CLASS_VISIBLE);

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
  panel.closeIcon?.classList?.remove(NAVIGATION_PANEL_ICON_CLASS_VISIBLE);
  panel.closeIcon?.classList?.add(NAVIGATION_PANEL_ICON_CLASS_HIDDEN);
  panel.openIcon?.classList?.remove(NAVIGATION_PANEL_ICON_CLASS_HIDDEN);
  panel.openIcon?.classList?.add(NAVIGATION_PANEL_ICON_CLASS_VISIBLE);

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
  const openIcon = label.querySelector('.open-icon');
  const closeIcon = label.querySelector('.close-icon');

  const toggle = document.querySelector<HTMLInputElement>(`#${toggleId}`);
  if (!toggle) {
    console.log(`[navigation] panel init: could not find element: ${toggleId}`);
    return false;
  }
  toggle.checked = false;
  NAVIGATION_PANEL_TOGGLE_REGISTRY.push({
    panel: { element, toggle, label, openIcon, closeIcon, panelDirection, breakpoint },
    autoClose,
  });

  element.classList.remove('noscript');
  element.classList.remove('navigation-panel-top');
  element.classList.remove('navigation-panel-left');
  element.classList.remove('navigation-panel-right');
  element.classList.remove('navigation-panel-bottom');

  label.addEventListener('click', () => {
    navigationPanelToggle({ element, toggle, label, openIcon, closeIcon, panelDirection, breakpoint });
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

// --------------------------------------------------------------------------
export function navigationOverviewLinksInit(className: string): boolean {
  const elements = document.querySelectorAll(`.${className}`);
  if (!elements) {
    console.log(`[navigation] overview links init: could not find elements: ${className}`);
    return false;
  }

  elements.forEach((element) => {
    element.classList.remove('noscript');
    element.classList.remove('noscript');
    element.addEventListener('click', (_event: any) => {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
      return true;
    });
  });

  console.log(`[navigation] overview links init: ${className}`);
  return true;
}
// @ts-expect-error adding to global window object
window.navigationOverviewLinksInit = navigationOverviewLinksInit;
