/// <reference path="./.sst/platform/config.d.ts" />

export const DEPLOYMENT_AWS_SERVERLESS = 'aws_serverless' as const;
export const DEPLOYMENT_AWS_CONTAINER = 'aws_container' as const;
export const DEPLOYMENT_CLOUDFLARE_SERVERLESS = 'cloudflare_serverless' as const;
export const DEPLOYMENT_HETZNER_CONTAINER = 'hetzner_container' as const;

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

export async function runHetznerContainer() {
  return {};
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
      case DEPLOYMENT_HETZNER_CONTAINER:
        return runHetznerContainer();
      default:
        throw new Error(`[sst.config] Unknown or missing DEPLOYMENT: ${DEPLOYMENT}`);
    }
  },
});
