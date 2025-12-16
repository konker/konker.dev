/// <reference path="./.sst/platform/config.d.ts" />
export const DEPLOYMENT_AWS_SERVERLESS = 'aws_serverless' as const;
export const DEPLOYMENT_AWS_CONTAINER = 'aws_container' as const;
export const DEPLOYMENT_CLOUDFLARE_SERVERLESS = 'cloudflare_serverless' as const;
export const DEPLOYMENT_KUBERNETES = 'kubernetes' as const;
export async function runAwsServerless() {
  const api = new sst.aws.Function('API_ip.boilerplate.development.konker.dev', {
    url: true,
    link: [],
    handler: './src/hono-aws-serverless.handler',
  });
  return {
    api: api.url,
  };
}
export async function runAwsContainer() {
  const vpc = new sst.aws.Vpc('VPC_ip.boilerplate.development.konker.dev');
  const cluster = new sst.aws.Cluster('CLUSTER_ip.boilerplate.development.konker.dev', { vpc });
  new sst.aws.Service('SERVICE_ip.boilerplate.development.konker.dev', {
    cluster,
    link: [],
    loadBalancer: {
      ports: [{ listen: '80/http', forward: '3000/http' }],
    },
    dev: {
      command: 'pnpm run dev',
    },
  });
}

export async function runCloudflareServerless() {
  const api = new sst.cloudflare.Worker('API_ip.boilerplate.development.konker.dev', {
    url: true,
    link: [],
    handler: './src/hono-cloudflare-serverless.handler',
  });
  return {
    api: api.url,
  };
}
export async function runKubernetes() {
  /*[XXX]
    const aws_deployment = new aws.Provider('aws_deployment', {
      region: 'eu-west-1',
      profile: 'AdministratorAccess-mws-deployment',
      // accessKey: process.env.AWS_ACCESS_KEY_ID,
    });
    */
  const ssmParamFoo = aws.ssm.Parameter.get(
    'ssmParamFoo',
    '/secrets/development/konkerdotdev-db-development/dbname',
    {}
    // { provider: aws_deployment }
  );
  /*[TODO]
    const namespace = new kubernetes.core.v1.Namespace('namespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'backend-boilerplate', labels: { 'image-source': 'ecr' } },
    });
    const service = new kubernetes.core.v1.Service('service', {});
    // const ingressRoute = new kubernetes.networking.traefik.v1.('ingressRoute', {});
    */
  const deployment = new kubernetes.apps.v1.Deployment('deployment', {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'backend-boilerplatedotkonkerdotdev',
      namespace: 'backend-boilerplate',
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: { app: 'backend-boilerplatedotkonkerdotdev' },
      },
      template: {
        metadata: {
          labels: { app: 'backend-boilerplatedotkonkerdotdev' },
        },
        spec: {
          nodeSelector: { 'node-type': 'worker' },
          imagePullSecrets: [{ name: 'ecr-secret' }],
          containers: [
            {
              name: 'backend-boilerplatedotkonkerdotdev',
              image: '047719649582.dkr.ecr.eu-west-1.amazonaws.com/backend-boilerplate.konker.dev:latest',
              ports: [{ containerPort: 3000 }],
              env: [
                { name: 'NODE_ENV', value: 'production' },
                { name: 'FOO', value: ssmParamFoo.value },
              ],
              livenessProbe: {
                httpGet: { path: '/health', port: 3000 },
                initialDelaySeconds: 15,
                periodSeconds: 10,
                timeoutSeconds: 5,
                failureThreshold: 3,
              },
              readinessProbe: {
                httpGet: { path: '/health', port: 3000 },
                initialDelaySeconds: 5,
                periodSeconds: 5,
                timeoutSeconds: 3,
                failureThreshold: 2,
              },
            },
          ],
        },
      },
    },
  });
  return {
    deployment,
  };
}
export default $config({
  app(input) {
    return {
      name: 'backend-boilerplate-konker-dev',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-west-1',
        },
        kubernetes: '4.24.1',
        cloudflare: '6.11.0',
      },
    };
  },
  async run() {
    const DEPLOYMENT = process.env.DEPLOYMENT;
    switch (DEPLOYMENT) {
      case DEPLOYMENT_AWS_SERVERLESS:
        return runAwsServerless();
      case DEPLOYMENT_AWS_CONTAINER:
        return runAwsContainer();
      case DEPLOYMENT_CLOUDFLARE_SERVERLESS:
        return runCloudflareServerless();
      case DEPLOYMENT_KUBERNETES:
        return runKubernetes();
      default:
        throw new Error(`[sst.config] Unknown or missing DEPLOYMENT: ${DEPLOYMENT}`);
    }
  },
});
