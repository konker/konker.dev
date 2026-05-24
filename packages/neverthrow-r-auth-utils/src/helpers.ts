import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import { err, ok } from 'neverthrow';

export function extractBearerToken(authorization?: string): ResultR<unknown, string, Error> {
  const bearerRe = /^Bearer (\S+)$/;
  const match = authorization?.match(bearerRe);

  return fromResult(match?.[1] ? ok(match[1]) : err(new Error('No token found')));
}

export function extractBasicAuthHeaderValue(authorization?: string): ResultR<unknown, string, Error> {
  const basicAuthRe = /^Basic (\S+)$/;
  const match = authorization?.match(basicAuthRe);

  return fromResult(match?.[1] ? ok(match[1]) : err(new Error('No token found')));
}
