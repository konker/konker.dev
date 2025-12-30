/**
 * Provider Interface
 *
 * Defines the contract for configuration providers (AWS SSM, AWS Secrets Manager, Vault, etc.)
 */
import type { Effect } from 'effect';

import type { ProviderError } from '../errors.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/**
 * Context for provider operations
 */
export type ProviderContext = {
  readonly prefix: string; // e.g., "/zenfig"
  readonly service: string; // e.g., "api"
  readonly env: string; // e.g., "prod"
};

/**
 * Key-value map using canonical key paths (dot notation) to raw provider strings
 * Example: { "database.url": "postgres://...", "api.timeoutMs": "6500" }
 */
export type ProviderKV = Record<string, string>;

/**
 * Encryption type for stored values
 */
export const EncryptionType = {
  SECURE_STRING: 'SecureString',
  STRING: 'String',
  UNKNOWN: 'Unknown',
} as const;

export type EncryptionTypeValue = (typeof EncryptionType)[keyof typeof EncryptionType];

/**
 * Provider capabilities
 */
export type ProviderCapabilities = {
  readonly secureWrite?: boolean; // Can write as SecureString
  readonly encryptionVerification?: boolean; // Can verify encryption type
  readonly transactions?: boolean; // Supports atomic multi-key operations
};

/**
 * Provider interface
 *
 * All providers must implement fetch, upsert, and delete.
 * Optional: verifyEncryption if capabilities.encryptionVerification is true.
 */
export type Provider = {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Optional provider-specific guard check
   */
  readonly checkGuards?: (ctx: ProviderContext, guards?: unknown) => Effect.Effect<void, ProviderError>;

  /**
   * Fetch all key-value pairs for the given context
   * Returns canonical key paths (dot notation) mapped to string values
   */
  readonly fetch: (ctx: ProviderContext) => Effect.Effect<ProviderKV, ProviderError>;

  /**
   * Upsert a single key-value pair
   * keyPath is in canonical dot notation (e.g., "database.url")
   * value is the string-encoded value
   */
  readonly upsert: (ctx: ProviderContext, keyPath: string, value: string) => Effect.Effect<void, ProviderError>;

  /**
   * Delete a single key
   * keyPath is in canonical dot notation
   */
  readonly delete: (ctx: ProviderContext, keyPath: string) => Effect.Effect<void, ProviderError>;

  /**
   * Verify encryption type for a key (optional)
   * Only available if capabilities.encryptionVerification is true
   */
  readonly verifyEncryption?: (
    ctx: ProviderContext,
    keyPath: string
  ) => Effect.Effect<EncryptionTypeValue, ProviderError>;
};

// --------------------------------------------------------------------------
// Utility Functions
// --------------------------------------------------------------------------

/**
 * Convert canonical dot path to SSM slash path
 * Example: "database.url" -> "database/url"
 */
export function dotToSlashPath(dotPath: string): string {
  return dotPath.replace(/\./g, '/');
}

/**
 * Convert SSM slash path to canonical dot path
 * Example: "database/url" -> "database.url"
 */
export function slashToDotPath(slashPath: string): string {
  return slashPath.replace(/\//g, '.');
}

/**
 * Build the full SSM parameter path
 * Example: buildFullPath({ prefix: "/zenfig", service: "api", env: "prod" }, "database.url")
 *          -> "/zenfig/prod/api/database/url"
 */
export function buildFullPath(ctx: ProviderContext, keyPath: string): string {
  const prefix = ctx.prefix.endsWith('/') ? ctx.prefix.slice(0, -1) : ctx.prefix;
  const slashKeyPath = dotToSlashPath(keyPath);
  return `${prefix}/${ctx.env}/${ctx.service}/${slashKeyPath}`;
}

/**
 * Extract the key path from a full SSM parameter path
 * Example: extractKeyPath("/zenfig/prod/api/database/url", { prefix: "/zenfig", service: "api", env: "prod" })
 *          -> "database.url"
 */
export function extractKeyPath(fullPath: string, ctx: ProviderContext): string {
  const prefix = ctx.prefix.endsWith('/') ? ctx.prefix.slice(0, -1) : ctx.prefix;
  const basePrefix = `${prefix}/${ctx.env}/${ctx.service}/`;
  if (fullPath.startsWith(basePrefix)) {
    return slashToDotPath(fullPath.slice(basePrefix.length));
  }
  return slashToDotPath(fullPath);
}
