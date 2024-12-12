import crypto from 'node:crypto';

import { toError } from '@konker.dev/tiny-error-fp/lib';
import * as Effect from 'effect/Effect';

export const md5Hex = (s: string): Effect.Effect<string, Error> =>
  Effect.try({
    try: () => crypto.createHash('md5').update(s).digest('hex'),
    catch: toError,
  });

export const sha256Hex = (s: string): Effect.Effect<string, Error> =>
  Effect.try({
    try: () => crypto.createHash('sha256').update(s).digest('hex'),
    catch: toError,
  });

export const sha256HmacHex = (s: string, secret: string): Effect.Effect<string, Error> =>
  Effect.try({
    try: () => crypto.createHmac('sha256', secret).update(s).digest('hex'),
    catch: toError,
  });
