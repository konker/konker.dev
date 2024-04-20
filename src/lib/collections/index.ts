/* eslint-disable @typescript-eslint/ban-ts-comment,fp/no-nil */
import type { CollectionName } from '../../content/config.ts';

export const TAG_COLLECTIONS: Array<CollectionName> = ['til', 'projects'];
export type TagCollection = (typeof TAG_COLLECTIONS)[number];
