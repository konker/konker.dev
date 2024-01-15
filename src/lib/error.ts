import { toTinyError } from '@konker.dev/tiny-error-fp';

export const ERROR_TAG = 'TinyTreeCrawlerError';
export type ERROR_TAG = typeof ERROR_TAG;

export const toTinyTreeCrawlerError = toTinyError<ERROR_TAG>(ERROR_TAG);
export type TinyTreeCrawlerError = ReturnType<typeof toTinyTreeCrawlerError>;
