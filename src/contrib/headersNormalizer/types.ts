import type { OptionalRequestHeaders, RequestHeaders } from '../../lib/http';

export type WithPossibleInputHeaders = { headers?: OptionalRequestHeaders };
export type WithPossibleOutputHeaders = { headers?: Record<string, string> };
export type WithOutputHeaders = { headers: Record<string, string> };
export type WithNormalizedHeaders = {
  headers: RequestHeaders;
  normalizerRawHeaders: OptionalRequestHeaders;
};
