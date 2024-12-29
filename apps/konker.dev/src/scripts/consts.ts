// --------------------------------------------------------------------------
export const SITE_TITLE = 'konker.dev';

// --------------------------------------------------------------------------
export enum NavigationPanelDirection {
  TOP = 'top',
  LEFT = 'left',
  RIGHT = 'right',
  BOTTOM = 'bottom',
}

export enum NavigationPanelBreakpoint {
  XL = 'xl',
  LG = 'lg',
  MD = 'md',
  SM = 'sm',
  XS = 'xs',
}

export const NAVIGATION_PANEL_CLASS_OPENED = 'navigation-panel-opened' as const;
export const NAVIGATION_PANEL_CLASS_CLOSED = 'navigation-panel-closed' as const;
export const NAVIGATION_PANEL_ICON_CLASS_HIDDEN = 'opacity-0' as const;
export const NAVIGATION_PANEL_ICON_CLASS_VISIBLE = 'opacity-100' as const;

// --------------------------------------------------------------------------
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export const DEFAULT_THEME_STORAGE_KEY = 'kdd-theme';

export const ANCHOR_TOP = '_top';

export const TITLE_ICON_SIZE = 32;
export const ITEM_ICON_SIZE = 26;
export const NAV_ICON_SIZE = 18;
export const META_ICON_SIZE = 24;
