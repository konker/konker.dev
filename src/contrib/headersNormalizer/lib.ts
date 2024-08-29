// FROM: https://github.com/middyjs/middy/blob/main/packages/http-header-normalizer/index.js
import type {
  WithNormalizedInputHeaders,
  WithNormalizedOutputHeaders,
  WithPossibleInputHeaders,
  WithPossibleOutputHeaders,
} from './types';

const EXCEPTIONS_LIST = [
  'ALPN',
  'C-PEP',
  'C-PEP-Info',
  'CalDAV-Timezones',
  'Content-ID',
  'Content-MD5',
  'DASL',
  'DAV',
  'DNT',
  'ETag',
  'GetProfile',
  'HTTP2-Settings',
  'Last-Event-ID',
  'MIME-Version',
  'Optional-WWW-Authenticate',
  'Sec-WebSocket-Accept',
  'Sec-WebSocket-Extensions',
  'Sec-WebSocket-Key',
  'Sec-WebSocket-Protocol',
  'Sec-WebSocket-Version',
  'SLUG',
  'TCN',
  'TE',
  'TTL',
  'WWW-Authenticate',
  'X-ATT-DeviceId',
  'X-DNSPrefetch-Control',
  'X-UIDH',
  'X-XSS-Protection',
];

// --------------------------------------------------------------------------
export function isWithOutputHeaders(x: unknown): x is WithPossibleOutputHeaders {
  return !!(x && typeof x === 'object' && 'headers' in x && typeof x.headers === 'object');
}

export function fromExceptionList(s: string): string | undefined {
  const ss = s.toLowerCase();
  return EXCEPTIONS_LIST.find((i) => i.toLowerCase() === ss);
}

// --------------------------------------------------------------------------
export function lowerCaseNormalizer(s: string): string {
  return s.toLowerCase();
}

export function canonicalNormalizer(s: string): string {
  const exception = fromExceptionList(s);
  return (
    exception ??
    s
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase())
      .join('-')
  );
}

export function normalizeKeys(
  rec: Record<string, string | number | boolean | undefined> | undefined,
  normalizer: (s: string) => string
): Record<string, string> {
  return rec
    ? Object.keys(rec).reduce(
        (acc, key) => ({
          ...acc,
          [normalizer(key)]: rec[key],
        }),
        {}
      )
    : {};
}

// --------------------------------------------------------------------------
export const transformInput =
  <I extends WithPossibleInputHeaders>(normalizeRequestHeaders: boolean) =>
  (i: I): I & WithNormalizedInputHeaders => ({
    ...i,
    headers: normalizeRequestHeaders ? normalizeKeys(i.headers, lowerCaseNormalizer) : { ...i.headers },
    normalizerRawInputHeaders: i.headers,
  });

export const transformOutput =
  (normalizeResponseHeaders: boolean) =>
  <O extends WithPossibleOutputHeaders>(o: O): O & WithNormalizedOutputHeaders =>
    Object.assign(
      {},
      o,
      normalizeResponseHeaders && isWithOutputHeaders(o)
        ? { headers: normalizeKeys(o.headers, canonicalNormalizer) }
        : isWithOutputHeaders(o)
          ? { headers: { ...o.headers } }
          : {}
    );
