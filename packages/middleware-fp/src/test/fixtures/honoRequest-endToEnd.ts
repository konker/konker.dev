import type { HonoRequest } from 'hono';

import { honoRequestFactory } from './honoRequestFactory.js';

export const honoRequestEndToEnd: HonoRequest = honoRequestFactory('https://example.com/test', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
});
