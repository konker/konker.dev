/**
 * Schema Parser Tests (Adapter-backed)
 */
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { effectAdapter, zodAdapter } from '../validation/index.js';
import { parseProviderKV, parseValue, serializeValue } from './parser.js';

describe('parser', () => {
  const effectSchema = Schema.Struct({
    database: Schema.Struct({
      host: Schema.String,
      port: Schema.Number.pipe(Schema.int()),
    }),
    tags: Schema.Array(Schema.String),
  });

  const zodSchema = z.object({
    database: z.object({
      host: z.string(),
      port: z.number().int(),
    }),
    tags: z.array(z.string()),
  });

  it('parses values with Effect Schema', async () => {
    const resolved = await Effect.runPromise(
      parseValue('42', Schema.Number.pipe(Schema.int()), 'database.port', 'auto', effectAdapter)
    );
    expect(resolved).toBe(42);
  });

  it('parses values with Zod schema', async () => {
    const resolved = await Effect.runPromise(parseValue('true', z.boolean(), 'feature.enabled', 'auto', zodAdapter));
    expect(resolved).toBe(true);
  });

  it('parses provider key-value maps', async () => {
    const kv = {
      'database.host': 'localhost',
      'database.port': '5432',
      tags: '["a","b"]',
    };

    const parsed = await Effect.runPromise(parseProviderKV(kv, effectSchema, effectAdapter));
    expect(parsed.parsed).toEqual({
      database: { host: 'localhost', port: 5432 },
      tags: ['a', 'b'],
    });
  });

  it('parses provider key-value maps', async () => {
    const kv = {
      'database.host': 'localhost',
      'database.port': '5432',
      tags: '["a","b"]',
    };

    const parsed = await Effect.runPromise(parseProviderKV(kv, zodSchema, zodAdapter));
    expect(parsed.parsed).toEqual({
      database: { host: 'localhost', port: 5432 },
      tags: ['a', 'b'],
    });
  });

  it('serializes values for providers', () => {
    const result = serializeValue(['a', 'b'], Schema.Array(Schema.String), effectAdapter);
    expect(result).toBe('["a","b"]');
  });
});
