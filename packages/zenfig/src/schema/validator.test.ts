/**
 * Schema Validator Tests (Adapter-backed)
 */
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { effectAdapter, zodAdapter } from '../validation/index.js';
import { validate, validateAll, validateAtPath } from './validator.js';

describe('validator', () => {
  const effectSchema = Schema.Struct({
    database: Schema.Struct({
      host: Schema.String,
      port: Schema.Number.pipe(Schema.int()),
    }),
  });

  const zodSchema = z.object({
    database: z.object({
      host: z.string(),
      port: z.number().int(),
    }),
  });

  it('validates Effect Schema values', async () => {
    const result = await Effect.runPromise(
      validate({ database: { host: 'localhost', port: 5432 } }, effectSchema, effectAdapter)
    );
    expect(result).toEqual({ database: { host: 'localhost', port: 5432 } });
  });

  it('validates Zod values', async () => {
    const result = await Effect.runPromise(
      validate({ database: { host: 'localhost', port: 5432 } }, zodSchema, zodAdapter)
    );
    expect(result).toEqual({ database: { host: 'localhost', port: 5432 } });
  });

  it('reports validation errors', async () => {
    const result = await Effect.runPromise(
      validateAll({ database: { host: 'localhost', port: 'bad' } }, effectSchema, effectAdapter)
    );
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates at path', async () => {
    const result = await Effect.runPromise(validateAtPath(5432, effectSchema, 'database.port', effectAdapter));
    expect(result).toBe(5432);
  });
});
