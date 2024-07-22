import type { TinyError } from '@konker.dev/tiny-error-fp';
import { toTinyError } from '@konker.dev/tiny-error-fp';

export const ERROR_TAG = 'MiddlewareError' as const;
export type ERROR_TAG = typeof ERROR_TAG;

export type MiddlewareError = TinyError<ERROR_TAG>;
export const toMiddlewareError = toTinyError<ERROR_TAG>(ERROR_TAG);
