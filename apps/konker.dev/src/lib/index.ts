import type { MarkdownInstance } from 'astro';
import * as D from 'date-fns';
import { Home } from 'lucide-astro';

import type { LinkT } from './types';

export const HomeBreadcrumb: LinkT = {
  url: '/',
  title: 'Home',
  Icon: Home,
  textClass: 'text-kdd',
};

export function toDisplayDate(date: Date | undefined): string {
  return date ? D.formatDate(date, 'yyyy-MM-dd') : '';
}

export function toReadableDate(date: Date | undefined): string {
  return date ? D.formatDate(date, 'EEEE do MMMM yyyy') : '';
}

export function getUrlPathParts(url: URL): Array<string> {
  return url.pathname.split('/').filter((part) => part.length > 0);
}

export function isHomePage(url: URL | undefined): boolean {
  return url?.pathname === '/';
}

export function loadMarkdownContent(globResult: unknown): MarkdownInstance<Record<string, any>> | undefined {
  const globResultCast = globResult as Record<string, MarkdownInstance<Record<string, any>>>;
  const globResultValues = Object.values(globResultCast);
  return globResultValues[0];
}
