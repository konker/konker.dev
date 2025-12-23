/// <reference path="../../.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'kubernetes-backend-boilerplate-konker-dev',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-west-1',
        },
        kubernetes: '4.24.1',
      },
    };
  },

  async run() {
    /*[XXX]
    const ssmParamFoo = aws.ssm.Parameter.get(
      'ssmParamFoo',
      '/secrets/development/konkerdotdev-db-development/dbname',
      {}
    );
     */

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
                  { name: 'FOO', value: 'FIXME: config' },
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
  },
});
