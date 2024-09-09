export const TEST_JWT_NOW_MS = 1671573808123;
export const TEST_JWT_ISS = 'test-iss';
export const TEST_JWT_SUB = 'test-sub';
export const TEST_JWT_SIGNING_SECRET = 'shhhhh';
export const TEST_JWT_PAYLOAD = { foo: 'bar', sub: 'test-sub' };
export const TEST_SIGNED_PAYLOAD = {
  foo: 'bar',
  iat: Math.floor(TEST_JWT_NOW_MS / 1000),
  exp: Math.floor(TEST_JWT_NOW_MS / 1000) + 3600,
  iss: TEST_JWT_ISS,
  sub: TEST_JWT_SUB,
};
