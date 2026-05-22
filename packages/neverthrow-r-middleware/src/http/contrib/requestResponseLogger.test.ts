import { describe, expect, it } from 'vitest';

import { echoHandler, recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { middleware as requestResponseLogger, TAG } from './requestResponseLogger.js';

describe('requestResponseLogger', () => {
  it('emits IN/REQUEST/RESPONSE/OUT in order', async () => {
    const { calls, logger } = recordingLogger();
    const wrapped = requestResponseLogger()(echoHandler());
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isOk() && result.value.statusCode).toBe(200);
    expect(calls.map((c) => ({ level: c.level, label: c.args[0] }))).toEqual([
      { level: 'debug', label: `[${TAG}] IN` },
      { level: 'info', label: `[${TAG}] REQUEST` },
      { level: 'info', label: `[${TAG}] RESPONSE` },
      { level: 'debug', label: `[${TAG}] OUT` },
    ]);
  });
});
