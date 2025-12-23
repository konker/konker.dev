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
    const aws_deployment = new aws.Provider('aws_deployment', {
      region: 'eu-west-1',
      // assumeRole: 'arn:aws:iam::898403669204:role/infra/eso-cross-account-role',
    });

    const ssmParamFoo = aws.ssm.Parameter.get(
      'ssmParamFoo',
      '/secrets/development/konkerdotdev-db-development/dbname',
      {},
      { provider: aws_deployment }
    );

    const api = new sst.aws.Function('API_backend-boilerplate.development.konker.dev', {
      url: true,
      link: [],
      handler: './src/hono-aws-serverless.handler',
      environment: {
        FOO: ssmParamFoo.value,
      },
    });
    return {
      api: api.url,
    };
  },
});
