/**
 * Merge Utilities Tests
 */
import { describe, expect, it } from 'vitest';
import * as Effect from 'effect/Effect';

import { mergeConfigs, type MergeConflict, getTypeMismatches, getOverrides } from './merge.js';

describe('merge', () => {
  describe('mergeConfigs', () => {
    it('should merge multiple configs in order', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ['source1', { a: 1 }],
        ['source2', { b: 2 }],
        ['source3', { c: 3 }],
      ];

      const result = await Effect.runPromise(mergeConfigs(sources));

      expect(result.merged).toEqual({ a: 1, b: 2, c: 3 });
      expect(result.conflicts).toHaveLength(0);
    });

    it('should apply later configs over earlier ones', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ['source1', { x: 1, y: 2 }],
        ['source2', { y: 3 }],
        ['source3', { y: 4, z: 5 }],
      ];

      const result = await Effect.runPromise(mergeConfigs(sources));

      expect(result.merged).toEqual({ x: 1, y: 4, z: 5 });
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should merge nested objects', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ['source1', { db: { host: 'localhost', port: 5432 } }],
        ['source2', { db: { port: 3306, name: 'mydb' } }],
      ];

      const result = await Effect.runPromise(mergeConfigs(sources));

      expect(result.merged).toEqual({
        db: { host: 'localhost', port: 3306, name: 'mydb' },
      });
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]!.path).toBe('db.port');
    });

    it('should detect type conflicts', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ['source1', { value: 'string' }],
        ['source2', { value: 123 }],
      ];

      const result = await Effect.runPromise(mergeConfigs(sources));

      expect(result.merged).toEqual({ value: 123 });
      const typeMismatches = getTypeMismatches(result.conflicts);
      expect(typeMismatches).toHaveLength(1);
    });

    it('should fail in strict mode on type conflicts', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ['source1', { x: 'string' }],
        ['source2', { x: 123 }],
      ];

      await expect(Effect.runPromise(mergeConfigs(sources, { strictMerge: true }))).rejects.toThrow();
    });

    it('should handle empty input', async () => {
      const result = await Effect.runPromise(mergeConfigs([]));

      expect(result.merged).toEqual({});
      expect(result.conflicts).toHaveLength(0);
    });

    it('should handle single config', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [['source1', { x: 1 }]];

      const result = await Effect.runPromise(mergeConfigs(sources));

      expect(result.merged).toEqual({ x: 1 });
    });

    it('should replace arrays (not merge element-wise)', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ['source1', { tags: ['a', 'b'] }],
        ['source2', { tags: ['c', 'd', 'e'] }],
      ];

      const result = await Effect.runPromise(mergeConfigs(sources));

      expect(result.merged).toEqual({ tags: ['c', 'd', 'e'] });
    });

    it('should handle null values', async () => {
      const sources: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
        ['source1', { value: 'something' }],
        ['source2', { value: null }],
      ];

      const result = await Effect.runPromise(mergeConfigs(sources));

      expect(result.merged).toEqual({ value: null });
    });
  });

  describe('getTypeMismatches', () => {
    it('should filter type mismatch conflicts', () => {
      const conflicts: ReadonlyArray<MergeConflict> = [
        { path: 'a', sourceA: 's1', sourceB: 's2', valueA: 'str', valueB: 123, type: 'type-mismatch' },
        { path: 'b', sourceA: 's1', sourceB: 's2', valueA: 1, valueB: 2, type: 'override' },
      ];

      const result = getTypeMismatches(conflicts);

      expect(result).toHaveLength(1);
      expect(result[0]!.path).toBe('a');
    });
  });

  describe('getOverrides', () => {
    it('should filter override conflicts', () => {
      const conflicts: ReadonlyArray<MergeConflict> = [
        { path: 'a', sourceA: 's1', sourceB: 's2', valueA: 'str', valueB: 123, type: 'type-mismatch' },
        { path: 'b', sourceA: 's1', sourceB: 's2', valueA: 1, valueB: 2, type: 'override' },
      ];

      const result = getOverrides(conflicts);

      expect(result).toHaveLength(1);
      expect(result[0]!.path).toBe('b');
    });
  });
});
