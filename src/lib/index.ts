import * as D from 'date-fns';

import type { BreadcrumbT } from './types.ts';

export const HomeBreadcrumb: BreadcrumbT = {
  url: '/',
  title: 'Home',
};

export function toDisplayDate(date: Date): string {
  return D.formatDate(date, 'yyyy-MM-dd');
}

export function toReadableDate(date: Date): string {
  return D.formatDate(date, 'EEEE do MMMM yyyy');
}
