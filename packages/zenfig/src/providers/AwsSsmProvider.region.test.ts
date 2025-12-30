/* eslint-disable fp/no-delete,fp/no-class */
/**
 * AwsSsmProvider Region Resolution Tests
 */
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../errors.js';
import { type ProviderContext } from './Provider.js';

describe('AwsSsmProvider region resolution', () => {
  it('should fail when region provider returns empty', async () => {
    vi.resetModules();
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
    vi.doMock('@aws-sdk/client-ssm', () => {
      class SSMClient {
        config = {
          region: async () => undefined,
        };
      }

      return {
        SSMClient,
        GetParametersByPathCommand: class {},
        GetParameterCommand: class {},
        PutParameterCommand: class {},
        DeleteParameterCommand: class {},
      };
    });
    vi.doMock('@aws-sdk/client-sts', () => {
      class STSClient {
        send() {
          return Promise.resolve({ Account: '123456789012' });
        }
      }

      return {
        STSClient,
        GetCallerIdentityCommand: class {},
      };
    });

    const { awsSsmProvider } = await import('./AwsSsmProvider.js');

    const ctx: ProviderContext = { prefix: '/zenfig', env: 'prod', service: 'api' };
    const exit = await Effect.runPromiseExit(awsSsmProvider.checkGuards?.(ctx, { region: 'us-east-1' }) ?? Effect.void);

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV006);
    }

    vi.resetModules();
    vi.doUnmock('@aws-sdk/client-ssm');
    vi.doUnmock('@aws-sdk/client-sts');
  });
});
