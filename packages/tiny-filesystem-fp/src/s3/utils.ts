import { Readable } from 'node:stream';

export function s3ObjectIsReadable(resp: unknown): resp is { readonly Body: Readable } {
  return !!resp && typeof resp === 'object' && 'Body' in resp && resp.Body instanceof Readable;
}
