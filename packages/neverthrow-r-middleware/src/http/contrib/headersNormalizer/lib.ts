import type { Override, Rec } from '../../Rec.js';
import { makeRequestW, type RequestW } from '../../RequestW.js';
import { makeResponseW, type ResponseW } from '../../ResponseW.js';
import type { WithNormalizedInputHeaders, WithNormalizedOutputHeaders } from './types.js';

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
] as const;

export function fromExceptionList(s: string): string | undefined {
  const lower = s.toLowerCase();
  return EXCEPTIONS_LIST.find((item) => item.toLowerCase() === lower);
}

export function lowerCaseNormalizer(s: string): string {
  return s.toLowerCase();
}

export function canonicalNormalizer(s: string): string {
  const exception = fromExceptionList(s);
  return (
    exception ??
    s
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.substring(1).toLowerCase())
      .join('-')
  );
}

export function normalizeKeys(
  rec: Record<string, string | number | boolean | undefined> | undefined,
  normalizer: (s: string) => string
): Record<string, string> {
  return rec
    ? Object.keys(rec).reduce<Record<string, string>>(
        (acc, key) => ({
          ...acc,
          [normalizer(key)]: String(rec[key] ?? ''),
        }),
        {}
      )
    : {};
}

export const transformInput =
  <I extends Rec>(normalizeRequestHeaders: boolean) =>
  (i: RequestW<I>): RequestW<Override<I, WithNormalizedInputHeaders>> =>
    makeRequestW(i, {
      headers: normalizeRequestHeaders ? normalizeKeys(i.headers, lowerCaseNormalizer) : { ...i.headers },
      headersNormalizerRequestRaw: i.headers,
    });

export const transformOutput =
  <O extends Rec>(normalizeResponseHeaders: boolean) =>
  (o: ResponseW<O>): ResponseW<Override<O, WithNormalizedOutputHeaders>> =>
    makeResponseW(o, {
      headers: normalizeResponseHeaders ? normalizeKeys(o.headers, canonicalNormalizer) : { ...o.headers },
    });
