import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export const apiGatewayProxyEventV2AllUndefined: Omit<APIGatewayProxyEventV2, 'headers'> = {
  version: '2.0',
  routeKey: 'GET /test',
  rawPath: '/test',
  rawQueryString: '',
  isBase64Encoded: false,
  requestContext: {
    accountId: '123456789',
    apiId: 'api123',
    domainName: 'api.example.com',
    domainPrefix: 'api',
    http: {
      method: 'GET',
      path: '/test',
      protocol: 'HTTP/1.1',
      sourceIp: '192.168.1.1',
      userAgent: 'test-agent',
    },
    requestId: 'req123',
    routeKey: 'GET /test',
    stage: 'dev',
    time: '01/Jan/2023:00:00:00 +0000',
    timeEpoch: 1672531200000,
  },
};
