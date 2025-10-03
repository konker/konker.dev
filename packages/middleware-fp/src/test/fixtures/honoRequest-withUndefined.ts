import { honoRequestFactory } from './honoRequestFactory.js';

export const honoRequestWithUndefined = honoRequestFactory('https://example.com/test?param=value&empty=', {});
