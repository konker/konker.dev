import crypto from 'node:crypto';

import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import { toError } from '@konker.dev/tiny-error-fp/lib';
import { Result } from 'neverthrow';

export const md5Hex = (s: string): ResultR<unknown, string, Error> =>
  fromResult(Result.fromThrowable(() => crypto.createHash('md5').update(s).digest('hex'), toError)());

export const sha256Hex = (s: string): ResultR<unknown, string, Error> =>
  fromResult(Result.fromThrowable(() => crypto.createHash('sha256').update(s).digest('hex'), toError)());

export const sha256HmacHex = (s: string, secret: string): ResultR<unknown, string, Error> =>
  fromResult(Result.fromThrowable(() => crypto.createHmac('sha256', secret).update(s).digest('hex'), toError)());
