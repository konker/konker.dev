/**
 * AWS SSM Provider
 *
 * Default provider implementation using AWS SDK (SSM Parameter Store)
 */
import {
  DeleteParameterCommand,
  GetParameterCommand,
  GetParametersByPathCommand,
  type GetParametersByPathCommandOutput,
  type Parameter,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as ParseResult from 'effect/ParseResult';
import * as Schema from 'effect/Schema';

import {
  authenticationFailedError,
  connectionFailedError,
  parameterNotFoundError,
  type ProviderError,
  providerGuardMismatchError,
  writePermissionDeniedError,
} from '../errors.js';
import {
  buildFullPath,
  EncryptionType,
  type EncryptionTypeValue,
  type Provider,
  type ProviderCapabilities,
  type ProviderContext,
  type ProviderKV,
  slashToDotPath,
} from './Provider.js';
import { registerProvider } from './registry.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

const AwsSsmGuardsSchema = Schema.Struct({
  accountId: Schema.optional(Schema.String),
  region: Schema.optional(Schema.String),
});

type AwsSsmProviderGuards = Schema.Schema.Type<typeof AwsSsmGuardsSchema>;

type AwsError = {
  readonly name?: string;
  readonly code?: string;
  readonly Code?: string;
  readonly message?: string;
};

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const ssmClient = new SSMClient({});
const stsClient = new STSClient({});

function readEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getAwsErrorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const maybe = error as AwsError;
  return maybe.name ?? maybe.code ?? maybe.Code;
}

function describeAwsError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function buildServicePath(ctx: ProviderContext): string {
  const prefix = ctx.prefix.endsWith('/') ? ctx.prefix.slice(0, -1) : ctx.prefix;
  return `${prefix}/${ctx.env}/${ctx.service}`;
}

function parseAwsSsmGuards(guards?: unknown): Effect.Effect<AwsSsmProviderGuards | undefined, ProviderError> {
  if (guards === undefined) {
    return Effect.succeed(undefined);
  }

  return pipe(
    Schema.decodeUnknown(AwsSsmGuardsSchema)(guards),
    Effect.mapError((error) => providerGuardMismatchError('aws-ssm', ParseResult.TreeFormatter.formatErrorSync(error))),
    Effect.map((decoded) => (decoded.accountId || decoded.region ? decoded : undefined))
  );
}

function resolveAwsAccountId(): Effect.Effect<string, ProviderError> {
  const envAccountId = readEnvValue(process.env.AWS_ACCOUNT_ID);
  if (envAccountId) {
    return Effect.succeed(envAccountId);
  }

  return Effect.tryPromise({
    try: async () => {
      const result = await stsClient.send(new GetCallerIdentityCommand({}));
      const accountId = result.Account?.trim();
      if (!accountId) {
        return Promise.reject(new Error('Empty AWS account ID'));
      }
      return accountId;
    },
    catch: (error: unknown) =>
      providerGuardMismatchError('aws-ssm', `Unable to resolve AWS account ID: ${describeAwsError(error)}`),
  });
}

function resolveAwsRegion(): Effect.Effect<string, ProviderError> {
  const envRegion = readEnvValue(process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION);
  if (envRegion) {
    return Effect.succeed(envRegion);
  }

  return Effect.tryPromise({
    try: async () => {
      const regionProvider = ssmClient.config.region;
      const region = typeof regionProvider === 'function' ? await regionProvider() : regionProvider;
      if (!region) {
        return Promise.reject(new Error('AWS region not configured'));
      }
      return region;
    },
    catch: (error: unknown) =>
      providerGuardMismatchError('aws-ssm', `Unable to resolve AWS region: ${describeAwsError(error)}`),
  });
}

function classifyAwsError(
  error: unknown,
  ctx: ProviderContext,
  operation: 'fetch' | 'upsert' | 'delete' | 'verify',
  keyPath?: string
): ProviderError {
  const errorName = getAwsErrorName(error);
  const detail = describeAwsError(error);
  const message = errorName ? `${errorName}: ${detail}` : detail;

  if (errorName === 'ParameterNotFound' && keyPath) {
    return parameterNotFoundError(keyPath, buildFullPath(ctx, keyPath));
  }

  if (
    errorName === 'UnrecognizedClientException' ||
    errorName === 'InvalidClientTokenId' ||
    errorName === 'ExpiredToken' ||
    errorName === 'CredentialsError'
  ) {
    return authenticationFailedError('aws-ssm', message);
  }

  if (errorName === 'AccessDeniedException' || errorName === 'AccessDenied' || errorName === 'UnauthorizedOperation') {
    if (operation === 'upsert' || operation === 'delete') {
      return writePermissionDeniedError(keyPath ?? '(unknown)', message);
    }
    return authenticationFailedError('aws-ssm', message);
  }

  if (errorName === 'ThrottlingException' || errorName === 'RequestTimeout' || errorName === 'TimeoutError') {
    return connectionFailedError('aws-ssm', message);
  }

  return connectionFailedError('aws-ssm', message);
}

// --------------------------------------------------------------------------
// Provider Implementation
// --------------------------------------------------------------------------

const capabilities: ProviderCapabilities = {
  secureWrite: true,
  encryptionVerification: true,
  transactions: false,
};

function checkGuards(ctx: ProviderContext, guards?: unknown): Effect.Effect<void, ProviderError> {
  return pipe(
    parseAwsSsmGuards(guards),
    Effect.flatMap((parsed) => {
      if (!parsed) {
        return Effect.void;
      }

      const contextLabel = `${ctx.prefix}/${ctx.env}/${ctx.service}`;
      const accountIdEffect = parsed.accountId ? resolveAwsAccountId() : Effect.succeed(undefined);
      const regionEffect = parsed.region ? resolveAwsRegion() : Effect.succeed(undefined);

      return pipe(
        Effect.all({ accountId: accountIdEffect, region: regionEffect }),
        Effect.flatMap(({ accountId, region }) => {
          const mismatches: Array<string> = [];

          if (parsed.accountId && accountId !== parsed.accountId) {
            mismatches.push(`accountId expected '${parsed.accountId}' but got '${accountId}'`);
          }
          if (parsed.region && region !== parsed.region) {
            mismatches.push(`region expected '${parsed.region}' but got '${region}'`);
          }

          if (mismatches.length > 0) {
            return Effect.fail(
              providerGuardMismatchError('aws-ssm', `${mismatches.join('; ')} (context ${contextLabel})`)
            );
          }

          return Effect.void;
        })
      );
    })
  );
}

function fetch(ctx: ProviderContext): Effect.Effect<ProviderKV, ProviderError> {
  const servicePath = buildServicePath(ctx);
  const basePrefix = servicePath.endsWith('/') ? servicePath : `${servicePath}/`;

  return pipe(
    Effect.tryPromise({
      try: async () => {
        const results: Array<Parameter> = [];
        let nextToken: string | undefined = undefined;

        do {
          const response: GetParametersByPathCommandOutput = await ssmClient.send(
            new GetParametersByPathCommand({
              Path: servicePath,
              Recursive: true,
              WithDecryption: true,
              MaxResults: 10,
              NextToken: nextToken,
            })
          );
          results.push(...(response.Parameters ?? []));
          nextToken = response.NextToken;
        } while (nextToken);

        return results;
      },
      catch: (error: unknown) => classifyAwsError(error, ctx, 'fetch'),
    }),
    Effect.map((parameters) => {
      const kv: ProviderKV = {};

      for (const param of parameters) {
        if (!param.Name) {
          continue;
        }

        if (!param.Name.startsWith(basePrefix)) {
          continue;
        }

        const relativePath = param.Name.slice(basePrefix.length);
        const dotPath = slashToDotPath(relativePath);
        kv[dotPath] = param.Value ?? '';
      }

      return kv;
    })
  );
}

function upsert(ctx: ProviderContext, keyPath: string, value: string): Effect.Effect<void, ProviderError> {
  return Effect.tryPromise({
    try: async () => {
      const fullPath = buildFullPath(ctx, keyPath);
      await ssmClient.send(
        new PutParameterCommand({
          Name: fullPath,
          Value: value,
          Type: 'SecureString',
          Overwrite: true,
        })
      );
    },
    catch: (error: unknown) => classifyAwsError(error, ctx, 'upsert', keyPath),
  });
}

function deleteKey(ctx: ProviderContext, keyPath: string): Effect.Effect<void, ProviderError> {
  return Effect.tryPromise({
    try: async () => {
      const fullPath = buildFullPath(ctx, keyPath);
      await ssmClient.send(new DeleteParameterCommand({ Name: fullPath }));
    },
    catch: (error: unknown) => classifyAwsError(error, ctx, 'delete', keyPath),
  });
}

function verifyEncryption(ctx: ProviderContext, keyPath: string): Effect.Effect<EncryptionTypeValue, ProviderError> {
  return Effect.tryPromise({
    try: async () => {
      const fullPath = buildFullPath(ctx, keyPath);
      const response = await ssmClient.send(new GetParameterCommand({ Name: fullPath }));
      const type = response.Parameter?.Type;
      if (type === 'SecureString') return EncryptionType.SECURE_STRING;
      if (type === 'String') return EncryptionType.STRING;
      return EncryptionType.UNKNOWN;
    },
    catch: (error: unknown) => classifyAwsError(error, ctx, 'verify', keyPath),
  });
}

export const awsSsmProvider: Provider = {
  name: 'aws-ssm',
  capabilities,
  checkGuards,
  fetch,
  upsert,
  delete: deleteKey,
  verifyEncryption,
};

registerProvider('aws-ssm', () => awsSsmProvider);
