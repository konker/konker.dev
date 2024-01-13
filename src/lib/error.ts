export const TAG = 'TinyTreeCrawlerError';

export type TinyTreeCrawlerError = {
  readonly _tag: typeof TAG;
  readonly message: string;
  readonly cause: unknown;
};

export function toTinyTreeCrawlerError(x: unknown): TinyTreeCrawlerError {
  return {
    _tag: TAG,
    message: typeof x === 'object' && x && 'message' in x && typeof x.message === 'string' ? x.message : String(x),
    cause: x,
  };
}
