import * as Effect from 'effect/Effect';

import { invalidTypeError, type ValidationError } from '../errors.js';

export function parseBoolean(value: string, path: string): Effect.Effect<boolean, ValidationError> {
  const lower = value.toLowerCase();
  if (lower === 'true') return Effect.succeed(true);
  if (lower === 'false') return Effect.succeed(false);
  return Effect.fail(invalidTypeError(path, 'boolean (true/false)', `"${value}"`));
}

export function parseInteger(value: string, path: string): Effect.Effect<number, ValidationError> {
  const trimmed = value.trim();

  if (trimmed.includes('.')) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (contains decimal)`));
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (not a number)`));
  }

  if (!Number.isFinite(num)) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (Infinity not allowed)`));
  }

  if (!Number.isInteger(num)) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (not an integer)`));
  }

  return Effect.succeed(num);
}

export function parseNumber(value: string, path: string): Effect.Effect<number, ValidationError> {
  const num = Number(value.trim());

  if (Number.isNaN(num)) {
    return Effect.fail(invalidTypeError(path, 'number', `"${value}" (not a number)`));
  }

  if (!Number.isFinite(num)) {
    return Effect.fail(invalidTypeError(path, 'number', `"${value}" (Infinity not allowed)`));
  }

  return Effect.succeed(num);
}

export function parseJson(value: string, path: string, expectedType: string): Effect.Effect<unknown, ValidationError> {
  return Effect.try({
    try: () => JSON.parse(value),
    catch: () => invalidTypeError(path, expectedType, `"${value}" (invalid JSON)`),
  });
}
