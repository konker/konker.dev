/* eslint-disable @typescript-eslint/consistent-type-definitions */
// import 'vitest';

import type { CustomMatcher } from 'aws-sdk-client-mock-vitest';

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatcher<T> {}
  interface AsymmetricMatchersContaining extends CustomMatcher {}
}
