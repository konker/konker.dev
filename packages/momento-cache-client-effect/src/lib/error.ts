import type { TinyError } from '@konker.dev/tiny-error-fp';
import { toTinyError } from '@konker.dev/tiny-error-fp';

export const ERROR_TAG = 'MomentoClientError' as const;
export type ERROR_TAG = typeof ERROR_TAG;

export type MomentoClientError = TinyError<ERROR_TAG>;
export const toMomentoClientError = toTinyError<ERROR_TAG>(ERROR_TAG);
