/// <reference path="../../.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'aws-serverless-backend-boilerplate-konker-dev',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-west-1',
        },
      },
    };
  },

  async run() {
    const apiFn = new sst.aws.Function('API_backend-boilerplate', {
      dev: false,
      permissions: [],
      link: [],
      handler: '../../src/hono/hono-aws-serverless.handler',
      vpc: {
        securityGroups: ['sg-0791e6a24ea8c2070'],
        privateSubnets: ['subnet-020c328b46fe7f116', 'subnet-009ba0b344a30af37'],
      },
      environment: {
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_SSL: process.env.DATABASE_SSL,
      },
    });

    const api = new sst.aws.ApiGatewayV2('HTTP_API_backend-boilerplate');
    api.route('ANY /', apiFn.arn);
    api.route('ANY /{proxy+}', apiFn.arn);

    return {
      api: api.url,
    };
  },
});
