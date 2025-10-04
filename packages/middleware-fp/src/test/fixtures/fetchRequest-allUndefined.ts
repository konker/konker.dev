/* eslint-disable fp/no-nil,fp/no-class,fp/no-unused-expression,fp/no-mutation,fp/no-this */
export const fetchRequestAllUndefined = (): Request => {
  // In practice, Hono can give a Request with an undefined `headers` property.
  // This subclass is a hack to simulate this.
  class TestRequest extends Request {
    // @ts-ignore
    override headers: undefined;

    constructor(url: string, init?: RequestInit) {
      super(url, init);
      this.headers = undefined;
    }
  }

  return new TestRequest('https://example.com/test') as never;
};
