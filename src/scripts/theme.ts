import { DEFAULT_THEME_STORAGE_KEY, Theme } from './consts';

export function themeParse(s: string | undefined | null): Theme | undefined {
  switch (s?.toLowerCase()) {
    case Theme.LIGHT:
      return Theme.LIGHT;
    case Theme.DARK:
      return Theme.DARK;
    case Theme.AUTO:
      return Theme.AUTO;
    default:
      return undefined;
  }
}

// --------------------------------------------------------------------------
export function themeGetSystemPreference(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
}

// --------------------------------------------------------------------------
export function themeDocGet(d: Document): Theme | undefined {
  return themeParse(d.documentElement?.dataset?.themeMode);
}

export function themeDocSet(d: Document, theme: Theme): void {
  d.documentElement.dataset.themeMode = theme;
  d.documentElement.classList.toggle('dark', theme === Theme.DARK);
}

export function themeDocToggle(d: Document): void {
  const newTheme = themeDocGet(d) === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
  return themeDocSet(d, newTheme);
}

// --------------------------------------------------------------------------
export function themeLoad(storage: Storage, storageKey: string): Theme | undefined {
  const storedTheme = storage.getItem(storageKey);
  return storedTheme ? themeParse(storedTheme) : undefined;
}

export function themeSave(storage: Storage, theme: Theme, storageKey: string): void {
  return storage.setItem(storageKey, theme);
}

// --------------------------------------------------------------------------
export function themeGet(): Theme {
  return themeLoad(localStorage, DEFAULT_THEME_STORAGE_KEY) ?? themeDocGet(document) ?? themeGetSystemPreference();
}
// @ts-expect-error adding to global window object
window.themeGet = themeGet;

export function themeSet(s: string): Theme | undefined {
  const newTheme = themeParse(s);
  if (!newTheme) return undefined;

  themeDocSet(document, newTheme);
  themeSave(localStorage, newTheme, DEFAULT_THEME_STORAGE_KEY);
  return newTheme;
}
// @ts-expect-error adding to global window object
window.themeSet = themeSet;

export function themeToggle(): Theme | undefined {
  const currentTheme = themeGet();
  const newTheme = currentTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;

  return themeSet(newTheme);
}
// @ts-expect-error adding to global window object
window.themeToggle = themeToggle;

// --------------------------------------------------------------------------
export function themeInit(themeModeToggleNavIds: Array<string> = []): boolean {
  themeSet(themeGet());
  themeModeToggleNavIds.forEach((navId) => {
    const darkId = `${navId}-dark`;
    const lightId = `${navId}-light`;
    const toggle = document.querySelector<Element>(`#${navId}`);
    if (!toggle) {
      console.log(`[theme] toggle init: could not find element: ${navId}`);
      return;
    }
    const dark = document.querySelector<Element>(`#${darkId}`);
    const light = document.querySelector<Element>(`#${lightId}`);
    if (!dark || !light) {
      console.log(`[theme] toggle init: could not find element(s): ${darkId}/${lightId}`);
      return;
    }
    toggle.classList.remove('noscript');

    toggle.addEventListener('click', () => {
      themeToggle();
    });

    console.log(`[theme] toggle init: ${navId}`);
  });

  return true;
}
// @ts-expect-error adding to global window object
window.themeInit = themeInit;

// --------------------------------------------------------------------------
