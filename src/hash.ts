import * as P from '@konker.dev/effect-ts-prelude';

import { toError } from '@konker.dev/tiny-error-fp/dist/lib';
import crypto from 'node:crypto';

export const md5Hex = (s: string): P.Effect.Effect<string, Error> =>
  P.Effect.try({
    try: () => crypto.createHash('md5').update(s).digest('hex'),
    catch: toError,
  });

export const sha256Hex = (s: string): P.Effect.Effect<string, Error> =>
  P.Effect.try({
    try: () => crypto.createHash('sha256').update(s).digest('hex'),
    catch: toError,
  });

export const sha256HmacHex = (s: string, secret: string): P.Effect.Effect<string, Error> =>
  P.Effect.try({
    try: () => crypto.createHmac('sha256', secret).update(s).digest('hex'),
    catch: toError,
  });
