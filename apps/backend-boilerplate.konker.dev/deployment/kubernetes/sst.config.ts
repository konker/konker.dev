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
    const namespace = new kubernetes.core.v1.Namespace('namespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'backend-boilerplate', labels: { 'image-source': 'ecr' } },
    });

    new kubernetes.core.v1.Secret(`backend-boilerplate-secrets`, {
      metadata: {
        name: 'backend-boilerplate-secrets',
        namespace: 'backend-boilerplate',
      },
      type: 'Opaque',
      stringData: {
        DATABASE_URL: process.env.DATABASE_URL,
      },
    });

    const service = new kubernetes.core.v1.Service('service', {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'backend-boilerplatedotkonkerdotdev', namespace: 'backend-boilerplate' },
      spec: {
        selector: { app: 'backend-boilerplatedotkonkerdotdev' },
        ports: [{ name: 'http', port: 3000, targetPort: 3000 }],
        type: 'ClusterIP',
      },
    });

    const deployment = new kubernetes.apps.v1.Deployment('deployment', {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'backend-boilerplatedotkonkerdotdev',
        namespace: 'backend-boilerplate',
        annotations: {
          'pulumi.com/patchForce': 'true',
        },
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
                image: `047719649582.dkr.ecr.eu-west-1.amazonaws.com/backend-boilerplate.konker.dev:${process.env.IMAGE_TAG || 'latest'}`,
                ports: [{ containerPort: 3000 }],
                env: [
                  { name: 'NODE_ENV', value: 'production' },
                  {
                    name: 'DATABASE_URL',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'backend-boilerplate-secrets',
                        key: 'DATABASE_URL',
                      },
                    },
                  },
                ],
                livenessProbe: {
                  httpGet: { path: '/ping', port: 3000 },
                  initialDelaySeconds: 15,
                  periodSeconds: 10,
                  timeoutSeconds: 5,
                  failureThreshold: 3,
                },
                readinessProbe: {
                  httpGet: { path: '/ping', port: 3000 },
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
      namespace,
      service,
      deployment,
    };
  },
});
