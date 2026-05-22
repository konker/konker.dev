import { describe, expect, it } from 'vitest';

import { echoHandler, recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { middleware as trivial, TAG } from './trivial.js';

describe('trivial middleware', () => {
  it('calls the wrapped handler and emits IN/OUT debug logs', async () => {
    const { calls, logger } = recordingLogger();
    const wrapped = trivial()(echoHandler());
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isOk() && result.value.statusCode).toBe(200);
    expect(calls.map((c) => c.args[0])).toEqual([`[${TAG}] IN`, `[${TAG}] OUT`]);
    expect(calls.every((c) => c.level === 'debug')).toBe(true);
  });
});
