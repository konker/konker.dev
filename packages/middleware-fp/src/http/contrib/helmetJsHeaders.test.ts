import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W } from '../RequestW.js';
import * as unit from './helmetJsHeaders.js';

describe('middleware/helmet-js-headers', () => {
  describe('middleware', () => {
    it('should work as expected with default params', async () => {
      const egHandler = pipe(echoCoreIn200W, unit.middleware());

      const result = pipe(egHandler(EMPTY_REQUEST_W), Effect.runPromise);

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
