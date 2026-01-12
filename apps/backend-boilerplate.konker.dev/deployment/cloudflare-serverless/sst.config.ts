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
    const api = new sst.cloudflare.Worker('API_backend.boilerplate.development.konker.dev', {
      url: true,
      link: [],
      handler: './src/hono-cloudflare-serverless.handler',
      environment: {
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME,
      },
    });
    return {
      api: api.url,
    };
  },
});
