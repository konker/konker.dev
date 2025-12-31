/**
 * Schema Resolver Tests (Adapter-backed)
 */
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ErrorCode } from '../errors.js';
import { effectAdapter, zodAdapter } from '../validation/index.js';
import {
  canonicalizePath,
  getAllLeafPaths,
  getTypeDescription,
  resolvePath,
  validateKeyPathSegments,
} from './resolver.js';

describe('resolver', () => {
  const effectSchema = Schema.Struct({
    database: Schema.Struct({
      host: Schema.String,
      port: Schema.Number.pipe(Schema.int()),
    }),
    api: Schema.Struct({
      key: Schema.optional(Schema.String),
    }),
  });

  const zodSchema = z.object({
    database: z.object({
      host: z.string(),
      port: z.number().int(),
    }),
    api: z.object({
      key: z.string().optional(),
    }),
  });

  it('validates key path segments', async () => {
    const segments = await Effect.runPromise(validateKeyPathSegments('database.host'));
    expect(segments).toEqual(['database', 'host']);
  });

  it('rejects empty key paths', async () => {
    const exit = await Effect.runPromiseExit(validateKeyPathSegments(''));
    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      const error = exit.cause.error as { context?: { code?: string } };
      expect(error.context?.code).toBe(ErrorCode.VAL004);
    }
  });

  it('rejects invalid key path segments', async () => {
    const exit = await Effect.runPromiseExit(validateKeyPathSegments('database.host!'));
    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      const error = exit.cause.error as { context?: { code?: string } };
      expect(error.context?.code).toBe(ErrorCode.VAL004);
    }
  });

  it('resolves path for Effect Schema', async () => {
    const result = await Effect.runPromise(resolvePath(effectSchema, 'database.host', effectAdapter));
    expect(result.canonicalPath).toBe('database.host');
  });

  it('resolves path for Zod schema', async () => {
    const result = await Effect.runPromise(resolvePath(zodSchema, 'database.port', zodAdapter));
    expect(result.canonicalPath).toBe('database.port');
  });

  it('canonicalizes path using adapter', async () => {
    const result = await Effect.runPromise(canonicalizePath(effectSchema, 'database.host', effectAdapter));
    expect(result).toBe('database.host');
  });

  it('enumerates leaf paths', () => {
    const effectPaths = getAllLeafPaths(effectSchema, effectAdapter).map((entry) => entry.path);
    const zodPaths = getAllLeafPaths(zodSchema, zodAdapter).map((entry) => entry.path);

    expect(effectPaths).toContain('database.host');
    expect(effectPaths).toContain('database.port');
    expect(zodPaths).toContain('database.host');
    expect(zodPaths).toContain('api.key');
  });

  it('describes schema nodes', async () => {
    const resolvedEffect = await Effect.runPromise(resolvePath(effectSchema, 'database.port', effectAdapter));
    const resolvedZod = await Effect.runPromise(resolvePath(zodSchema, 'database.port', zodAdapter));

    expect(getTypeDescription(resolvedEffect.schema, effectAdapter)).toBe('integer');
    expect(getTypeDescription(resolvedZod.schema, zodAdapter)).toBe('integer');
  });
});
