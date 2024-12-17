import type {
  OptionalRequestHeaders,
  OptionalResponseHeaders,
  RequestHeaders,
  ResponseHeaders,
} from '../../lib/http.js';

export type WithPossibleInputHeaders = { headers?: OptionalRequestHeaders };
export type WithPossibleOutputHeaders = { headers?: OptionalResponseHeaders };

export type WithNormalizedInputHeaders = {
  headers: RequestHeaders;
  normalizerRawInputHeaders: OptionalRequestHeaders;
};

export type WithNormalizedOutputHeaders = {
  headers?: ResponseHeaders;
};

export type WithUserId = {
  readonly userId: string | undefined;
};
