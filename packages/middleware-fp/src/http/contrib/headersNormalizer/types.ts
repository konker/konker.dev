import type { RequestW } from '../../RequestW.js';
import type { ResponseW } from '../../ResponseW.js';

export type WithNormalizedInputHeaders = {
  headers: RequestW['headers'];
  headersNormalizerRequestRaw: Record<string, string>;
};

export type WithNormalizedOutputHeaders = {
  headers: ResponseW['headers'];
};
