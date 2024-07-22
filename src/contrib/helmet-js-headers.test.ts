/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import { Deps, echoCoreInDeps } from '../test/test-common';
import * as unit from './helmet-js-headers';

export type In = { headers: Record<string, string | undefined> };

const TEST_IN: In = { headers: { FOO: 'foo_value' } };
const TEST_DEPS: Deps = { bar: 'bar' };

describe('middleware/helmet-js-headers', () => {
  describe('middleware', () => {
    it('should work as expected with default params', async () => {
      const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
      const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
      await expect(result).resolves.toMatchObject({
        bar: 'bar',
        headers: {
          FOO: 'foo_value',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Resource-Policy': 'same-origin',
          'Origin-Agent-Cluster': '?1',
        },
      });
    });
  });
});
