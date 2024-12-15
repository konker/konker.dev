import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import * as unit from './test.js';

describe('lib/test', () => {
  describe('MockMomentoClient', () => {
    const TEST_CACHE_NAME = 'test-cache-name';
    const TEST_KEY = 'test-key';
    const TEST_VALUE = 'test-value';

    it('should work as expected', async () => {
      const rep: any = {};
      const testClient = unit.MockMomentoClient(rep);

      await testClient.set(TEST_CACHE_NAME, TEST_KEY, TEST_VALUE);
      expect(rep).toStrictEqual({
        'test-cache-name_test-key': TEST_VALUE,
      });

      const actual1 = await testClient.get(TEST_CACHE_NAME, TEST_KEY);
      expect(actual1.type).toEqual('Hit');

      await testClient.delete(TEST_CACHE_NAME, TEST_KEY);
      expect(rep).toStrictEqual({
        'test-cache-name_test-key': undefined,
      });
    });

    it('should work as expected with error key', async () => {
      const rep: any = {};
      const testClient = unit.MockMomentoClient(rep);

      const actual1 = await testClient.get(TEST_CACHE_NAME, unit.ERROR_KEY);
      expect(actual1.type).toEqual('Error');

      const actual2 = await testClient.set(TEST_CACHE_NAME, unit.ERROR_KEY, TEST_VALUE);
      expect(actual2.type).toEqual('Error');

      const actual3 = await testClient.delete(TEST_CACHE_NAME, unit.ERROR_KEY);
      expect(actual3.type).toEqual('Error');
    });

    it('should work as expected with exception key', async () => {
      const rep: any = {};
      const testClient = unit.MockMomentoClient(rep);

      const actual1 = () => testClient.get(TEST_CACHE_NAME, unit.EXCEPTION_KEY);
      await expect(actual1).rejects.toThrow();

      const actual2 = () => testClient.set(TEST_CACHE_NAME, unit.EXCEPTION_KEY, TEST_VALUE);
      await expect(actual2).rejects.toThrow();

      const actual3 = () => testClient.delete(TEST_CACHE_NAME, unit.EXCEPTION_KEY);
      await expect(actual3).rejects.toThrow();
    });
  });

  describe('mockMomentoClientThunk', () => {
    it('should work as expected', async () => {
      const actual = unit.mockMomentoClientEffect();
      expect(actual).toBeDefined();
    });
  });

  describe('mockMomentoClientFactory', () => {
    it('should work as expected', async () => {
      const actual1 = unit.mockMomentoClientFactory();
      const actual2 = unit.mockMomentoClientFactory({});
      expect(actual1).toBeDefined();
      expect(actual2).toBeDefined();
      expect(actual1).toBeInstanceOf(Function);
      expect(actual2).toBeInstanceOf(Function);
      expect(actual1({})).toBeDefined();
      expect(actual2({})).toBeDefined();
      expect(actual1({})()).toBeDefined();
      expect(actual2({})()).toBeDefined();
    });
  });

  describe('mockMomentoClientFactoryDeps', () => {
    it('should work as expected', async () => {
      const actual = unit.mockMomentoClientFactoryDeps();
      expect(actual).toBeDefined();
      expect(actual(Effect.succeed(true))).toBeDefined();
    });
  });

  describe('mockMomentoClientDeps', () => {
    it('should work as expected', async () => {
      const actual = unit.mockMomentoClientDeps();
      expect(actual).toBeDefined();
      expect(actual(Effect.succeed(true))).toBeDefined();
    });
  });
});
