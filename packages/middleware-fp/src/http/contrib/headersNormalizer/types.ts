import type { RequestW } from '../../request.js';
import type { ResponseW } from '../../response.js';

export type WithNormalizedInputHeaders = {
  headers: RequestW['headers'];
  headersNormalizerRequestRaw: Record<string, string>;
};

export type WithNormalizedOutputHeaders = {
  headers: ResponseW['headers'];
};
