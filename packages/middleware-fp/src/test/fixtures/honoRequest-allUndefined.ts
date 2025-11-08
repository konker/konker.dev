import type { HonoRequest } from 'hono';

import { honoRequestFactory } from './honoRequestFactory.js';

export const honoRequestAllUndefined: HonoRequest = honoRequestFactory('https://example.com/test', {});
