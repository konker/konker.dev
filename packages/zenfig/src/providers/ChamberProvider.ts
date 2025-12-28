/**
 * Chamber Provider
 *
 * Default provider implementation using Chamber (AWS SSM Parameter Store)
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as ParseResult from 'effect/ParseResult';
import * as Schema from 'effect/Schema';
import { execa, type ExecaError } from 'execa';

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
  dotToSlashPath,
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

type ChamberExportOutput = Record<string, string>;

const ChamberGuardsSchema = Schema.Struct({
  accountId: Schema.optional(Schema.String),
  region: Schema.optional(Schema.String),
});

type ChamberProviderGuards = Schema.Schema.Type<typeof ChamberGuardsSchema>;

type ErrorWithCode = {
  readonly code?: string;
};

const isErrorWithCode = (error: unknown): error is ErrorWithCode =>
  typeof error === 'object' && error !== null && 'code' in error;

const readEnvValue = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseChamberGuards = (guards?: unknown): Effect.Effect<ChamberProviderGuards | undefined, ProviderError> => {
  if (guards === undefined) {
    return Effect.succeed(undefined);
  }

  return pipe(
    Schema.decodeUnknown(ChamberGuardsSchema)(guards),
    Effect.mapError((error) => providerGuardMismatchError('chamber', ParseResult.TreeFormatter.formatErrorSync(error))),
    Effect.map((decoded) => (decoded.accountId || decoded.region ? decoded : undefined))
  );
};

const describeAwsCliError = (error: unknown): string => {
  if (isErrorWithCode(error) && error.code === 'ENOENT') {
    return 'AWS CLI not found in PATH';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const resolveAwsCliValue = (
  args: ReadonlyArray<string>,
  failureMessage: string
): Effect.Effect<string, ProviderError> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const { stdout } = await execa('aws', args);
        return stdout.trim();
      },
      catch: (error: unknown) =>
        providerGuardMismatchError('chamber', `${failureMessage}: ${describeAwsCliError(error)}`),
    }),
    Effect.flatMap((value) => {
      if (!value) {
        return Effect.fail(providerGuardMismatchError('chamber', `${failureMessage}: empty AWS CLI response`));
      }
      return Effect.succeed(value);
    })
  );

const resolveAwsAccountId = (): Effect.Effect<string, ProviderError> => {
  const envAccountId = readEnvValue(process.env.AWS_ACCOUNT_ID);
  if (envAccountId) {
    return Effect.succeed(envAccountId);
  }

  return resolveAwsCliValue(
    ['sts', 'get-caller-identity', '--query', 'Account', '--output', 'text'],
    'Unable to resolve AWS account ID for provider guards'
  );
};

const resolveAwsRegion = (): Effect.Effect<string, ProviderError> => {
  const envRegion = readEnvValue(process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION);
  if (envRegion) {
    return Effect.succeed(envRegion);
  }

  return resolveAwsCliValue(['configure', 'get', 'region'], 'Unable to resolve AWS region for provider guards');
};

// --------------------------------------------------------------------------
// Error Classification
// --------------------------------------------------------------------------

const classifyChamberError = (error: ExecaError, ctx: ProviderContext, keyPath?: string): ProviderError => {
  const stderrRaw = error.stderr ?? error.message ?? '';
  const stderr = String(stderrRaw);

  // Check for binary not found - return connection error since we need ProviderError
  if (error.code === 'ENOENT') {
    return connectionFailedError('chamber', 'chamber binary not found in PATH');
  }

  // Check for authentication errors
  if (
    stderr.includes('NoCredentialProviders') ||
    stderr.includes('AccessDenied') ||
    stderr.includes('ExpiredToken') ||
    stderr.includes('InvalidAccessKeyId') ||
    stderr.includes('SignatureDoesNotMatch')
  ) {
    return authenticationFailedError('chamber', stderr);
  }

  // Check for permission denied
  if (stderr.includes('AccessDeniedException') || stderr.includes('not authorized')) {
    if (keyPath) {
      return writePermissionDeniedError(keyPath, stderr);
    }
    return authenticationFailedError('chamber', stderr);
  }

  // Check for parameter not found
  if (stderr.includes('ParameterNotFound') || stderr.includes('does not exist')) {
    if (keyPath) {
      return parameterNotFoundError(keyPath, buildFullPath(ctx, keyPath));
    }
  }

  // Default to connection error
  return connectionFailedError('chamber', stderr);
};

// --------------------------------------------------------------------------
// Chamber Provider Implementation
// --------------------------------------------------------------------------

const capabilities: ProviderCapabilities = {
  secureWrite: true, // Chamber writes as SecureString by default
  encryptionVerification: false, // Would need AWS SDK for this
  transactions: false, // No atomic operations
};

/**
 * Build the chamber service path: prefix/service/env
 */
const buildServicePath = (ctx: ProviderContext): string => {
  // Remove leading slash from prefix if present for chamber
  const prefix = ctx.prefix.startsWith('/') ? ctx.prefix.slice(1) : ctx.prefix;
  return `${prefix}/${ctx.service}/${ctx.env}`;
};

const checkGuards = (ctx: ProviderContext, guards?: unknown): Effect.Effect<void, ProviderError> =>
  pipe(
    parseChamberGuards(guards),
    Effect.flatMap((parsed) => {
      if (!parsed) {
        return Effect.void;
      }

      const contextLabel = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
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
              providerGuardMismatchError('chamber', `${mismatches.join('; ')} (context ${contextLabel})`)
            );
          }

          return Effect.void;
        })
      );
    })
  );

/**
 * Fetch all parameters for a service using chamber export
 */
const fetch = (ctx: ProviderContext): Effect.Effect<ProviderKV, ProviderError> =>
  pipe(
    Effect.tryPromise({
      try: async () => {
        const servicePath = buildServicePath(ctx);
        const { stdout } = await execa('chamber', ['export', servicePath, '--format', 'json']);
        return stdout;
      },
      catch: (error: unknown) => classifyChamberError(error as ExecaError, ctx),
    }),
    Effect.flatMap((result) =>
      // Parse the JSON output
      Effect.try({
        try: () => JSON.parse(result) as ChamberExportOutput,
        catch: () => connectionFailedError('chamber', 'Invalid JSON output from chamber export'),
      })
    ),
    Effect.map((parsed) => {
      // Convert keys from SCREAMING_SNAKE_CASE to dot notation
      // Chamber exports as uppercase env-style keys
      // We need to convert back to canonical dot paths
      // Note: This is a simplification - full implementation would need schema lookup
      const kv: ProviderKV = {};

      for (const [key, value] of Object.entries(parsed)) {
        // Chamber uses slash paths internally, convert to dots
        // The key from export is usually the full path after service/env
        const dotPath = slashToDotPath(key);
        kv[dotPath] = value;
      }

      return kv;
    })
  );

/**
 * Write a single parameter using chamber write
 */
const upsert = (ctx: ProviderContext, keyPath: string, value: string): Effect.Effect<void, ProviderError> =>
  Effect.tryPromise({
    try: async () => {
      const servicePath = buildServicePath(ctx);
      const slashPath = dotToSlashPath(keyPath);
      // Chamber write: chamber write <service> <key> <value>
      // The key should be the path after the service
      await execa('chamber', ['write', servicePath, slashPath, value]);
    },
    catch: (error: unknown) => classifyChamberError(error as ExecaError, ctx, keyPath),
  });

/**
 * Delete a single parameter using chamber delete
 */
const deleteKey = (ctx: ProviderContext, keyPath: string): Effect.Effect<void, ProviderError> =>
  Effect.tryPromise({
    try: async () => {
      const servicePath = buildServicePath(ctx);
      const slashPath = dotToSlashPath(keyPath);
      // Chamber delete: chamber delete <service> <key>
      await execa('chamber', ['delete', servicePath, slashPath]);
    },
    catch: (error: unknown) => classifyChamberError(error as ExecaError, ctx, keyPath),
  });

/**
 * The Chamber provider instance
 */
export const chamberProvider: Provider = {
  name: 'chamber',
  capabilities,
  checkGuards,
  fetch,
  upsert,
  delete: deleteKey,
};

// Register the provider
registerProvider('chamber', () => chamberProvider);
