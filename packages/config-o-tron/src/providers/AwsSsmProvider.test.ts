/* eslint-disable fp/no-delete */
/**
 * AwsSsmProvider Tests
 */
import 'aws-sdk-client-mock-vitest';

import {
  DeleteParameterCommand,
  GetParameterCommand,
  GetParametersByPathCommand,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ErrorCode } from '../errors.js';
import { awsSsmProvider } from './AwsSsmProvider.js';
import { EncryptionType, type ProviderContext } from './Provider.js';

describe('AwsSsmProvider', () => {
  const ssmMock = mockClient(SSMClient);
  const stsMock = mockClient(STSClient);
  const ctx: ProviderContext = { prefix: '/config-o-tron', env: 'prod', service: 'api' };
  const originalEnv = process.env;

  beforeEach(() => {
    ssmMock.reset();
    stsMock.reset();
    process.env = { ...originalEnv };
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
    delete process.env.AWS_ACCOUNT_ID;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should expose expected provider metadata', () => {
    expect(awsSsmProvider.name).toBe('aws-ssm');
    expect(awsSsmProvider.capabilities.secureWrite).toBe(true);
    expect(awsSsmProvider.capabilities.encryptionVerification).toBe(true);
    expect(awsSsmProvider.capabilities.transactions).toBe(false);
  });

  it('should fetch and normalize parameters to dot paths', async () => {
    ssmMock.on(GetParametersByPathCommand).callsFake(async (input) => {
      if (!input.NextToken) {
        return {
          Parameters: [
            { Name: '/config-o-tron/prod/api/database/url', Value: 'postgres://db' },
            { Name: '/config-o-tron/prod/api/feature/enableBeta', Value: 'true' },
            { Value: 'missing-name' },
          ],
          NextToken: 'next',
        };
      }

      return {
        Parameters: [
          { Name: '/config-o-tron/prod/api/database/timeout', Value: '30' },
          { Name: '/config-o-tron/prod/other/ignore', Value: 'nope' },
        ],
        NextToken: undefined,
      };
    });

    const result = await Effect.runPromise(awsSsmProvider.fetch(ctx));

    expect(result).toEqual({
      'database.url': 'postgres://db',
      'feature.enableBeta': 'true',
      'database.timeout': '30',
    });
    expect(ssmMock.commandCalls(GetParametersByPathCommand)).toHaveLength(2);
  });

  it('should upsert with SecureString parameters', async () => {
    ssmMock.on(PutParameterCommand).resolves({});

    await Effect.runPromise(awsSsmProvider.upsert(ctx, 'database.url', 'postgres://db'));

    const upsertCall = ssmMock.commandCalls(PutParameterCommand)[0];
    expect(upsertCall?.args[0].input).toEqual({
      Name: '/config-o-tron/prod/api/database/url',
      Value: 'postgres://db',
      Type: 'SecureString',
      Overwrite: true,
    });
  });

  it('should delete parameters by full path', async () => {
    ssmMock.on(DeleteParameterCommand).resolves({});

    await Effect.runPromise(awsSsmProvider.delete(ctx, 'database.url'));

    const deleteCall = ssmMock.commandCalls(DeleteParameterCommand)[0];
    expect(deleteCall?.args[0].input).toEqual({
      Name: '/config-o-tron/prod/api/database/url',
    });
  });

  it('should verify encryption types', async () => {
    ssmMock.on(GetParameterCommand).resolves({ Parameter: { Type: 'SecureString' } });
    const secure = await Effect.runPromise(awsSsmProvider.verifyEncryption!(ctx, 'database.url'));
    expect(secure).toBe(EncryptionType.SECURE_STRING);

    ssmMock.on(GetParameterCommand).resolves({ Parameter: { Type: 'String' } });
    const plain = await Effect.runPromise(awsSsmProvider.verifyEncryption!(ctx, 'database.url'));
    expect(plain).toBe(EncryptionType.STRING);

    ssmMock.on(GetParameterCommand).resolves({ Parameter: { Type: undefined } });
    const unknown = await Effect.runPromise(awsSsmProvider.verifyEncryption!(ctx, 'database.url'));
    expect(unknown).toBe(EncryptionType.UNKNOWN);
  });

  it('should validate provider guards and detect mismatches', async () => {
    stsMock.on(GetCallerIdentityCommand).resolves({ Account: '222222222222' });
    process.env.AWS_REGION = 'us-east-1';

    const exit = await Effect.runPromiseExit(
      awsSsmProvider.checkGuards?.(ctx, { accountId: '111111111111', region: 'us-west-2' }) ?? Effect.void
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV006);
    }
  });

  it('should no-op when provider guards are empty', async () => {
    await Effect.runPromise(awsSsmProvider.checkGuards?.(ctx, {}) ?? Effect.void);
  });

  it('should no-op when provider guards are undefined', async () => {
    await Effect.runPromise(awsSsmProvider.checkGuards?.(ctx, undefined) ?? Effect.void);
  });

  it('should accept matching provider guards', async () => {
    stsMock.on(GetCallerIdentityCommand).resolves({ Account: '111111111111' });
    process.env.AWS_REGION = 'us-east-1';

    await Effect.runPromise(
      awsSsmProvider.checkGuards?.(ctx, { accountId: '111111111111', region: 'us-east-1' }) ?? Effect.void
    );
  });

  it('should honor AWS_ACCOUNT_ID when present', async () => {
    process.env.AWS_ACCOUNT_ID = ' 123456789012 ';
    process.env.AWS_REGION = 'us-east-1';

    await Effect.runPromise(
      awsSsmProvider.checkGuards?.(ctx, { accountId: '123456789012', region: 'us-east-1' }) ?? Effect.void
    );
  });

  it('should fail when AWS account ID cannot be resolved', async () => {
    stsMock.on(GetCallerIdentityCommand).rejects(new Error('sts down'));

    const exit = await Effect.runPromiseExit(
      awsSsmProvider.checkGuards?.(ctx, { accountId: '123456789012' }) ?? Effect.void
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV006);
    }
  });

  it('should fail when AWS account ID is empty', async () => {
    stsMock.on(GetCallerIdentityCommand).resolves({ Account: '   ' });

    const exit = await Effect.runPromiseExit(
      awsSsmProvider.checkGuards?.(ctx, { accountId: '123456789012' }) ?? Effect.void
    );

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV006);
    }
  });

  it('should fail when AWS region cannot be resolved', async () => {
    const exit = await Effect.runPromiseExit(awsSsmProvider.checkGuards?.(ctx, { region: 'us-east-1' }) ?? Effect.void);

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV006);
    }
  });

  it('should reject invalid provider guard shape', async () => {
    const exit = await Effect.runPromiseExit(awsSsmProvider.checkGuards?.(ctx, { accountId: 123 }) ?? Effect.void);

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV006);
    }
  });

  it('should map AWS errors to authentication failures', async () => {
    ssmMock.on(GetParametersByPathCommand).rejects({ name: 'UnrecognizedClientException', message: 'bad' });

    const exit = await Effect.runPromiseExit(awsSsmProvider.fetch(ctx));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV002);
    }
  });

  it('should map access denied on fetch to authentication failures', async () => {
    ssmMock.on(GetParametersByPathCommand).rejects({ name: 'AccessDeniedException', message: 'denied' });

    const exit = await Effect.runPromiseExit(awsSsmProvider.fetch(ctx));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV002);
    }
  });

  it('should map access denied on upsert to write permission errors', async () => {
    ssmMock.on(PutParameterCommand).rejects({ name: 'AccessDeniedException', message: 'denied' });

    const exit = await Effect.runPromiseExit(awsSsmProvider.upsert(ctx, 'database.url', 'value'));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV005);
    }
  });

  it('should map parameter not found to provider error', async () => {
    ssmMock.on(GetParameterCommand).rejects({ name: 'ParameterNotFound', message: 'missing' });

    const exit = await Effect.runPromiseExit(awsSsmProvider.verifyEncryption!(ctx, 'database.url'));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV003);
    }
  });

  it('should map throttling errors to connection failures', async () => {
    ssmMock.on(DeleteParameterCommand).rejects({ name: 'ThrottlingException', message: 'slow down' });

    const exit = await Effect.runPromiseExit(awsSsmProvider.delete(ctx, 'database.url'));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV001);
    }
  });

  it('should map unknown errors to connection failures', async () => {
    ssmMock.on(GetParametersByPathCommand).callsFake(async () => {
      throw 'kaboom';
    });

    const exit = await Effect.runPromiseExit(awsSsmProvider.fetch(ctx));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.PROV001);
    }
  });
});
