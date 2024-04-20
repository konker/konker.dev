import * as D from 'date-fns';

import type { LinkT } from './types.ts';

export const HomeBreadcrumb: LinkT = {
  url: '/',
  title: 'Home',
};

export function toDisplayDate(date: Date): string {
  return D.formatDate(date, 'yyyy-MM-dd');
}

export function toReadableDate(date: Date): string {
  return D.formatDate(date, 'EEEE do MMMM yyyy');
}
