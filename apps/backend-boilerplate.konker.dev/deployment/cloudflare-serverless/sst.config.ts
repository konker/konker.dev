/// <reference path="../../.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'cloudflare-serverless-backend-boilerplate-konker-dev',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        cloudflare: {},
        aws: {
          region: 'eu-west-1',
        },
      },
    };
  },

  async run() {
    const ssmParamFoo = aws.ssm.Parameter.get(
      'ssmParamFoo',
      '/secrets/development/konkerdotdev-db-development/dbname',
      {}
    );

    const api = new sst.cloudflare.Worker('API_backend.boilerplate.development.konker.dev', {
      url: true,
      link: [],
      handler: './src/hono-cloudflare-serverless.handler',
      environment: {
        FOO: ssmParamFoo.value,
      },
    });
    return {
      api: api.url,
    };
  },
});
