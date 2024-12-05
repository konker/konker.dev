/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import { http200CoreIn } from '../test/test-common';
import * as unit from './helmetJsHeaders';

export type In = { headers: Record<string, string | undefined> };

const TEST_IN: In = { headers: { FOO: 'foo_value' } };

describe('middleware/helmet-js-headers', () => {
  describe('middleware', () => {
    it('should work as expected with default params', async () => {
      const egHandler = P.pipe(http200CoreIn, unit.middleware());
      const result = P.pipe(egHandler(TEST_IN), P.Effect.runPromise);
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
