export const fetchRequestComplete = (): Request =>
  new Request('https://example.com/test?param=value&other=test', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer token',
    },
    body: 'test body',
  });
