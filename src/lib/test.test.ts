/* eslint-disable @typescript-eslint/naming-convention */
import * as unit from './test';
import { ERROR_KEY, EXCEPTION_KEY } from './test';

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

      const actual1 = await testClient.get(TEST_CACHE_NAME, ERROR_KEY);
      expect(actual1.type).toEqual('Error');

      const actual2 = await testClient.set(TEST_CACHE_NAME, ERROR_KEY, TEST_VALUE);
      expect(actual2.type).toEqual('Error');

      const actual3 = await testClient.delete(TEST_CACHE_NAME, ERROR_KEY);
      expect(actual3.type).toEqual('Error');
    });

    it('should work as expected with exception key', async () => {
      const rep: any = {};
      const testClient = unit.MockMomentoClient(rep);

      const actual1 = () => testClient.get(TEST_CACHE_NAME, EXCEPTION_KEY);
      await expect(actual1).rejects.toThrow();

      const actual2 = () => testClient.set(TEST_CACHE_NAME, EXCEPTION_KEY, TEST_VALUE);
      await expect(actual2).rejects.toThrow();

      const actual3 = () => testClient.delete(TEST_CACHE_NAME, EXCEPTION_KEY);
      await expect(actual3).rejects.toThrow();
    });
  });

  describe('mockMomentoClientFactory', () => {
    it('should work as expected', async () => {
      const actual = unit.mockMomentoClientFactory({});
      expect(actual).toBeDefined();
      expect(actual).toBeInstanceOf(Function);
      expect(actual()).toBeDefined();
    });
  });
});
