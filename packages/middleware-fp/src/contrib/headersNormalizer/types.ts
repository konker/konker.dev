import type { RequestW, ResponseW } from '../../lib/http.js';

export type WithNormalizedInputHeaders = {
  headers: RequestW['headers'];
  headersNormalizerRequestRaw: Record<string, string>;
};

export type WithNormalizedOutputHeaders = {
  headers: ResponseW['headers'];
};
