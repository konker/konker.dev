import type { TinyError } from '@konker.dev/tiny-error-fp';
import { toTinyError } from '@konker.dev/tiny-error-fp';

export const ERROR_TAG = 'CacheError' as const;
export type ERROR_TAG = typeof ERROR_TAG;

export type CacheError = TinyError<ERROR_TAG>;
export const toCacheError = toTinyError<ERROR_TAG>(ERROR_TAG);
