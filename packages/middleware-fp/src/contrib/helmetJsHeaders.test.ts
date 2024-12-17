import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { http200CoreIn } from '../test/test-common.js';
import * as unit from './helmetJsHeaders.js';

export type In = { headers: Record<string, string | undefined> };

const TEST_IN: In = { headers: { FOO: 'foo_value' } };

describe('middleware/helmet-js-headers', () => {
  describe('middleware', () => {
    it('should work as expected with default params', async () => {
      const egHandler = pipe(http200CoreIn, unit.middleware());
      const result = pipe(egHandler(TEST_IN), Effect.runPromise);
      await expect(result).resolves.toMatchObject({
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Resource-Policy': 'same-origin',
          'Origin-Agent-Cluster': '?1',
        },
      });
    });
  });
});
