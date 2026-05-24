import type { RequestW } from '../../RequestW.js';
import type { ResponseW } from '../../ResponseW.js';

export type WithNormalizedInputHeaders = {
  readonly headers: RequestW['headers'];
  readonly headersNormalizerRequestRaw: Record<string, string>;
};

export type WithNormalizedOutputHeaders = {
  readonly headers: ResponseW['headers'];
};
