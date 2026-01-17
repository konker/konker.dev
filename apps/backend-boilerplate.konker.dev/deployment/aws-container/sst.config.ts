/// <reference path="../../.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'aws-container-backend-boilerplate-konker-dev',
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
    const vpc = new sst.aws.Vpc('VPC_backend-boilerplate.development.konker.dev');
    const cluster = new sst.aws.Cluster('CLUSTER_backend-boilerplate.development.konker.dev', { vpc });
    new sst.aws.Service('SERVICE_backend-boilerplate.development.konker.dev', {
      cluster,
      link: [],
      loadBalancer: {
        ports: [{ listen: '80/http', forward: '3000/http' }],
      },
      dev: {
        command: 'pnpm run dev',
      },
      environment: {
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_USER: process.env.DATABASE_USER,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        DATABASE_NAME: process.env.DATABASE_NAME,
      },
    });
  },
});
