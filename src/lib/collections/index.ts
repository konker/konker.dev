/* eslint-disable @typescript-eslint/ban-ts-comment,fp/no-nil */
import type { Collections } from '../../content/config.ts';

export const TAG_COLLECTIONS: Array<Collections> = ['til', 'projects'];
export type TagCollection = (typeof TAG_COLLECTIONS)[number];
