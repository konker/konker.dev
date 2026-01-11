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
    const api = new sst.aws.Function('API_backend-boilerplate', {
      url: {
        authorization: 'none',
      },
      permissions: [],
      link: [],
      handler: '../../src/hono/hono-aws-serverless.handler',
      environment: {
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME,
      },
    });

    new aws.lambda.Permission('ApiUrlPublic', {
      action: 'lambda:InvokeFunctionUrl',
      function: api.name,
      principal: '*',
      functionUrlAuthType: 'NONE',
    });

    return {
      api: api.url,
    };
  },
});
