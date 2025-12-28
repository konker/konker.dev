/* eslint-disable fp/no-delete */
/**
 * ChamberProvider Tests
 */
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../errors.js';
import { chamberProvider } from './ChamberProvider.js';
import type { ProviderContext } from './Provider.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { execa } from 'execa';

describe('ChamberProvider', () => {
  const ctx: ProviderContext = {
    prefix: '/zenfig',
    service: 'test-service',
    env: 'dev',
  };

  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    // Clear AWS-related env vars
    delete process.env.AWS_ACCOUNT_ID;
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
    delete process.env.ZENFIG_IGNORE_PROVIDER_GUARDS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('chamberProvider properties', () => {
    it('should have name "chamber"', () => {
      expect(chamberProvider.name).toBe('chamber');
    });

    it('should have expected capabilities', () => {
      expect(chamberProvider.capabilities.secureWrite).toBe(true);
      expect(chamberProvider.capabilities.encryptionVerification).toBe(false);
      expect(chamberProvider.capabilities.transactions).toBe(false);
    });

    it('should have checkGuards method', () => {
      expect(chamberProvider.checkGuards).toBeDefined();
    });
  });

  describe('fetch', () => {
    it('should fetch and parse JSON output from chamber export', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: JSON.stringify({
          'database/host': 'localhost',
          'database/port': '5432',
        }),
        stderr: '',
        command: 'chamber export zenfig/test-service/dev --format json',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      const result = await Effect.runPromise(chamberProvider.fetch(ctx));

      expect(execa).toHaveBeenCalledWith('chamber', ['export', 'zenfig/test-service/dev', '--format', 'json']);
      expect(result).toEqual({
        'database.host': 'localhost',
        'database.port': '5432',
      });
    });

    it('should handle empty export result', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        command: 'chamber export zenfig/test-service/dev --format json',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      const result = await Effect.runPromise(chamberProvider.fetch(ctx));

      expect(result).toEqual({});
    });

    it('should strip leading slash from prefix', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        command: 'chamber export zenfig/test-service/dev --format json',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await Effect.runPromise(chamberProvider.fetch(ctx));

      // Should strip leading slash: /zenfig -> zenfig
      expect(execa).toHaveBeenCalledWith('chamber', ['export', 'zenfig/test-service/dev', '--format', 'json']);
    });

    it('should handle prefix without leading slash', async () => {
      const ctxNoSlash: ProviderContext = {
        ...ctx,
        prefix: 'custom-prefix',
      };

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        command: 'chamber export custom-prefix/test-service/dev --format json',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await Effect.runPromise(chamberProvider.fetch(ctxNoSlash));

      expect(execa).toHaveBeenCalledWith('chamber', ['export', 'custom-prefix/test-service/dev', '--format', 'json']);
    });

    it('should fail with connection error when chamber binary not found', async () => {
      const error = new Error('spawn chamber ENOENT') as Error & { code: string };
      error.code = 'ENOENT';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV001);
        }
      }
    });

    it('should fail with authentication error for NoCredentialProviders', async () => {
      const error = new Error('NoCredentialProviders') as Error & { stderr: string };
      error.stderr = 'NoCredentialProviders: no valid providers in chain';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });

    it('should fail with authentication error for AccessDenied', async () => {
      const error = new Error('AccessDenied') as Error & { stderr: string };
      error.stderr = 'AccessDenied: User is not authorized';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });

    it('should fail with authentication error for ExpiredToken', async () => {
      const error = new Error('ExpiredToken') as Error & { stderr: string };
      error.stderr = 'ExpiredToken: The security token included in the request is expired';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });

    it('should fail with authentication error for InvalidAccessKeyId', async () => {
      const error = new Error('InvalidAccessKeyId') as Error & { stderr: string };
      error.stderr = 'InvalidAccessKeyId: The AWS Access Key Id you provided does not exist';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });

    it('should fail with authentication error for SignatureDoesNotMatch', async () => {
      const error = new Error('SignatureDoesNotMatch') as Error & { stderr: string };
      error.stderr = 'SignatureDoesNotMatch: The request signature we calculated does not match';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });

    it('should fail with connection error for invalid JSON output', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'not valid json',
        stderr: '',
        command: 'chamber export zenfig/test-service/dev --format json',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV001);
        }
      }
    });

    it('should fail with connection error for generic errors', async () => {
      const error = new Error('Unknown error') as Error & { stderr: string };
      error.stderr = 'Some unknown error occurred';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV001);
        }
      }
    });

    it('should fail with authentication error for "not authorized" in fetch (no keyPath)', async () => {
      // Fetch does not pass keyPath, so "not authorized" returns PROV002 instead of PROV005
      const error = new Error('not authorized') as Error & { stderr: string };
      error.stderr = 'User is not authorized to access this resource';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.fetch(ctx));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });
  });

  describe('upsert', () => {
    it('should write parameter with chamber write command', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        command: 'chamber write zenfig/test-service/dev database/url postgres://localhost',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await Effect.runPromise(chamberProvider.upsert(ctx, 'database.url', 'postgres://localhost'));

      expect(execa).toHaveBeenCalledWith('chamber', [
        'write',
        'zenfig/test-service/dev',
        'database/url',
        'postgres://localhost',
      ]);
    });

    it('should convert dot notation to slash path', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        command: 'chamber write',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await Effect.runPromise(chamberProvider.upsert(ctx, 'api.timeout.ms', '30000'));

      expect(execa).toHaveBeenCalledWith('chamber', ['write', 'zenfig/test-service/dev', 'api/timeout/ms', '30000']);
    });

    it('should fail with authentication error for AccessDeniedException (contains AccessDenied)', async () => {
      // Note: AccessDeniedException contains 'AccessDenied' which matches the auth error check first
      const error = new Error('AccessDeniedException') as Error & { stderr: string };
      error.stderr = 'AccessDeniedException: User is not authorized to perform ssm:PutParameter';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.upsert(ctx, 'database.url', 'value'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });

    it('should fail with write permission denied for "not authorized"', async () => {
      const error = new Error('not authorized') as Error & { stderr: string };
      error.stderr = 'User is not authorized to access this resource';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.upsert(ctx, 'database.url', 'value'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV005);
        }
      }
    });

    it('should fail with connection error when chamber binary not found', async () => {
      const error = new Error('spawn chamber ENOENT') as Error & { code: string };
      error.code = 'ENOENT';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.upsert(ctx, 'key', 'value'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV001);
        }
      }
    });
  });

  describe('delete', () => {
    it('should delete parameter with chamber delete command', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        command: 'chamber delete zenfig/test-service/dev database/url',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await Effect.runPromise(chamberProvider.delete(ctx, 'database.url'));

      expect(execa).toHaveBeenCalledWith('chamber', ['delete', 'zenfig/test-service/dev', 'database/url']);
    });

    it('should convert dot notation to slash path', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        command: 'chamber delete',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await Effect.runPromise(chamberProvider.delete(ctx, 'api.timeout.ms'));

      expect(execa).toHaveBeenCalledWith('chamber', ['delete', 'zenfig/test-service/dev', 'api/timeout/ms']);
    });

    it('should fail with parameter not found for ParameterNotFound', async () => {
      const error = new Error('ParameterNotFound') as Error & { stderr: string };
      error.stderr = 'ParameterNotFound: Parameter /zenfig/test-service/dev/api/key does not exist';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.delete(ctx, 'api.key'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV003);
        }
      }
    });

    it('should fail with parameter not found for "does not exist"', async () => {
      const error = new Error('does not exist') as Error & { stderr: string };
      error.stderr = 'secret does not exist';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.delete(ctx, 'api.key'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV003);
        }
      }
    });

    it('should fail with authentication error for AccessDeniedException (contains AccessDenied)', async () => {
      // Note: AccessDeniedException contains 'AccessDenied' which matches the auth error check first
      const error = new Error('AccessDeniedException') as Error & { stderr: string };
      error.stderr = 'AccessDeniedException: User is not authorized to perform ssm:DeleteParameter';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.delete(ctx, 'database.url'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV002);
        }
      }
    });
  });

  describe('checkGuards', () => {
    it('should succeed when no guards provided', async () => {
      await expect(Effect.runPromise(chamberProvider.checkGuards!(ctx, undefined))).resolves.toBeUndefined();
    });

    it('should succeed when guards is empty object', async () => {
      await expect(Effect.runPromise(chamberProvider.checkGuards!(ctx, {}))).resolves.toBeUndefined();
    });

    it('should succeed when accountId matches env var', async () => {
      process.env.AWS_ACCOUNT_ID = '123456789012';

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { accountId: '123456789012' }))
      ).resolves.toBeUndefined();
    });

    it('should succeed when region matches AWS_REGION env var', async () => {
      process.env.AWS_REGION = 'us-east-1';

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { region: 'us-east-1' }))
      ).resolves.toBeUndefined();
    });

    it('should succeed when region matches AWS_DEFAULT_REGION env var', async () => {
      process.env.AWS_DEFAULT_REGION = 'eu-west-1';

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { region: 'eu-west-1' }))
      ).resolves.toBeUndefined();
    });

    it('should prefer AWS_REGION over AWS_DEFAULT_REGION', async () => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_DEFAULT_REGION = 'eu-west-1';

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { region: 'us-east-1' }))
      ).resolves.toBeUndefined();
    });

    it('should fail when accountId does not match', async () => {
      process.env.AWS_ACCOUNT_ID = '111111111111';

      const exit = await Effect.runPromiseExit(chamberProvider.checkGuards!(ctx, { accountId: '999999999999' }));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });

    it('should fail when region does not match', async () => {
      process.env.AWS_REGION = 'us-west-2';

      const exit = await Effect.runPromiseExit(chamberProvider.checkGuards!(ctx, { region: 'eu-central-1' }));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });

    it('should fail when both accountId and region do not match', async () => {
      process.env.AWS_ACCOUNT_ID = '111111111111';
      process.env.AWS_REGION = 'us-west-2';

      const exit = await Effect.runPromiseExit(
        chamberProvider.checkGuards!(ctx, { accountId: '999999999999', region: 'eu-central-1' })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });

    it('should resolve accountId from AWS CLI when env var not set', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '123456789012',
        stderr: '',
        command: 'aws sts get-caller-identity',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { accountId: '123456789012' }))
      ).resolves.toBeUndefined();

      expect(execa).toHaveBeenCalledWith('aws', [
        'sts',
        'get-caller-identity',
        '--query',
        'Account',
        '--output',
        'text',
      ]);
    });

    it('should resolve region from AWS CLI when env vars not set', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'us-east-1',
        stderr: '',
        command: 'aws configure get region',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { region: 'us-east-1' }))
      ).resolves.toBeUndefined();

      expect(execa).toHaveBeenCalledWith('aws', ['configure', 'get', 'region']);
    });

    it('should fail when AWS CLI fails to resolve accountId', async () => {
      const error = new Error('Unable to locate credentials') as Error & { stderr: string };
      error.stderr = 'Unable to locate credentials';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.checkGuards!(ctx, { accountId: '123456789012' }));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });

    it('should fail when AWS CLI returns empty accountId', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        command: 'aws sts get-caller-identity',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      const exit = await Effect.runPromiseExit(chamberProvider.checkGuards!(ctx, { accountId: '123456789012' }));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });

    it('should fail when AWS CLI not found for accountId resolution', async () => {
      const error = new Error('spawn aws ENOENT') as Error & { code: string };
      error.code = 'ENOENT';
      vi.mocked(execa).mockRejectedValueOnce(error);

      const exit = await Effect.runPromiseExit(chamberProvider.checkGuards!(ctx, { accountId: '123456789012' }));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });

    it('should fail for invalid guard schema', async () => {
      const exit = await Effect.runPromiseExit(
        chamberProvider.checkGuards!(ctx, { invalidProperty: 'some-value', accountId: 123 })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });

    it('should handle whitespace-only env var values as undefined', async () => {
      process.env.AWS_ACCOUNT_ID = '   ';

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '123456789012',
        stderr: '',
        command: 'aws sts get-caller-identity',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { accountId: '123456789012' }))
      ).resolves.toBeUndefined();

      // Should fall back to AWS CLI since env var is whitespace
      expect(execa).toHaveBeenCalled();
    });

    it('should check both accountId and region when both provided', async () => {
      process.env.AWS_ACCOUNT_ID = '123456789012';
      process.env.AWS_REGION = 'us-east-1';

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { accountId: '123456789012', region: 'us-east-1' }))
      ).resolves.toBeUndefined();
    });

    it('should resolve both from AWS CLI when needed', async () => {
      // First call for account ID
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '123456789012',
        stderr: '',
        command: 'aws sts get-caller-identity',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      // Second call for region
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'us-east-1',
        stderr: '',
        command: 'aws configure get region',
        exitCode: 0,
        failed: false,
        timedOut: false,
        killed: false,
      } as never);

      await expect(
        Effect.runPromise(chamberProvider.checkGuards!(ctx, { accountId: '123456789012', region: 'us-east-1' }))
      ).resolves.toBeUndefined();

      expect(execa).toHaveBeenCalledTimes(2);
    });

    it('should handle non-Error exceptions from AWS CLI', async () => {
      // Throw a string (non-Error) to cover the String(error) fallback in describeAwsCliError
      vi.mocked(execa).mockRejectedValueOnce('string error');

      const exit = await Effect.runPromiseExit(chamberProvider.checkGuards!(ctx, { accountId: '123456789012' }));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV006);
        }
      }
    });
  });
});
