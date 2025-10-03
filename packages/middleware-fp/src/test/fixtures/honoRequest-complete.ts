import { type HonoRequest } from 'hono';

import { honoRequestFactory } from './honoRequestFactory.js';

export const honoRequestComplete: HonoRequest = honoRequestFactory('https://example.com/test?param=value&other=test', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer token',
  },
  body: 'test body',
});
