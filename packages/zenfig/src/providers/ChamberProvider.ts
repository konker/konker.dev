/**
 * Chamber Provider
 *
 * Default provider implementation using Chamber (AWS SSM Parameter Store)
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { execa, type ExecaError } from 'execa';

import {
  authenticationFailedError,
  connectionFailedError,
  parameterNotFoundError,
  type ProviderError,
  writePermissionDeniedError,
} from '../errors.js';
import {
  buildFullPath,
  dotToSlashPath,
  slashToDotPath,
  type Provider,
  type ProviderCapabilities,
  type ProviderContext,
  type ProviderKV,
} from './Provider.js';
import { registerProvider } from './registry.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ChamberExportOutput = Record<string, string>;

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
  fetch,
  upsert,
  delete: deleteKey,
};

// Register the provider
registerProvider('chamber', () => chamberProvider);
