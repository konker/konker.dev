import { describe, expect, it } from 'vitest';

import { echoHandler, sampleRequestW } from '../../test/test-common.js';
import { middleware as identity } from './identity.js';

describe('identity middleware', () => {
  it('returns the wrapped handler unchanged', async () => {
    const handler = echoHandler();
    const wrapped = identity()(handler);
    const result = await wrapped(sampleRequestW)(undefined);
    expect(result.isOk() && result.value.statusCode).toBe(200);
  });
});
