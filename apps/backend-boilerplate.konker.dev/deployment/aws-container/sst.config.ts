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
    /*[XXX]
    const aws_deployment = new aws.Provider('aws_deployment', {
      region: 'eu-west-1',
      profile: 'AdministratorAccess-mws-deployment',
      allowedAccountIds: [''],
    });

    const ssmParamFoo = aws.ssm.Parameter.get(
      'ssmParamFoo',
      '/secrets/development/konkerdotdev-db-development/dbname',
      {},
      { provider: aws_deployment }
    );
     */

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
        FOO: 'FIXME: config',
      },
    });
  },
});
