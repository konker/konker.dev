import { isTinyError, TinyError, toTinyError } from '@konker.dev/tiny-error-fp';

export const ERROR_TAG = 'HttpApiError' as const;
export type ERROR_TAG = typeof ERROR_TAG;

export type HttpApiError = TinyError<ERROR_TAG>;

export const HttpApiError = TinyError<ERROR_TAG>(ERROR_TAG, 500);
export const toHttpApiError = toTinyError<ERROR_TAG>(ERROR_TAG, HttpApiError);
export const isHttpApiError = isTinyError(ERROR_TAG);
