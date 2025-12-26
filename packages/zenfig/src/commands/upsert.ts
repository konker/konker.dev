/**
 * Upsert Command
 *
 * Workflow: Input -> Resolve -> Parse -> Validate -> Serialize -> Push
 */
import * as Effect from 'effect/Effect';

import { type ResolvedConfig } from '../config.js';
import {
  type ProviderError,
  type SystemError,
  type ValidationError,
  type ZenfigError,
  encryptionVerificationFailedError,
} from '../errors.js';
import { type ProviderContext, EncryptionType } from '../providers/Provider.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { type ParseMode, parseValue, serializeValue } from '../schema/parser.js';
import { resolvePath } from '../schema/resolver.js';
import { validate } from '../schema/validator.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type UpsertOptions = {
  readonly service: string;
  readonly key: string;
  readonly value?: string | undefined; // If not provided, read from stdin
  readonly stdin?: boolean | undefined;
  readonly type?: ParseMode | undefined;
  readonly skipEncryptionCheck?: boolean | undefined;
  readonly config: ResolvedConfig;
};

export type UpsertResult = {
  readonly canonicalKey: string;
  readonly value: unknown;
  readonly serialized: string;
  readonly encrypted: boolean;
};

// --------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------

/**
 * Read value from stdin
 */
const readFromStdin = (): Effect.Effect<string, never> =>
  Effect.promise(async () => {
    const chunks: Array<Buffer> = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks).toString('utf-8').trim();
  });

// --------------------------------------------------------------------------
// Upsert Command
// --------------------------------------------------------------------------

/**
 * Execute the upsert workflow
 */
export const executeUpsert = (
  options: UpsertOptions
): Effect.Effect<UpsertResult, ProviderError | ValidationError | SystemError | ZenfigError> =>
  Effect.gen(function* () {
    const { service, key, type = 'auto', skipEncryptionCheck = false, config } = options;

    // 1. Load schema
    const { schema } = yield* loadSchemaWithDefaults(config.schema, config.schemaExportName);

    // 2. Resolve and canonicalize the key path
    const resolved = yield* resolvePath(schema, key);
    const canonicalKey = resolved.canonicalPath;

    // 3. Get the value
    const rawValue = options.stdin
      ? yield* readFromStdin()
      : options.value ?? '';

    // 4. Parse the value according to schema
    const parsedValue = yield* parseValue(rawValue, resolved.schema, canonicalKey, type);

    // 5. Validate the parsed value
    const validatedValue = yield* validate(parsedValue, resolved.schema);

    // 6. Serialize back to provider string format
    const serialized = serializeValue(validatedValue, resolved.schema);

    // 7. Get provider
    const provider = yield* getProvider(config.provider);

    // 8. Push to provider
    const ctx: ProviderContext = {
      prefix: config.ssmPrefix,
      service,
      env: config.env,
    };

    yield* provider.upsert(ctx, canonicalKey, serialized);

    // 9. Verify encryption if supported and not skipped
    let encrypted = true;
    if (!skipEncryptionCheck && provider.capabilities.encryptionVerification && provider.verifyEncryption) {
      const encType = yield* provider.verifyEncryption(ctx, canonicalKey);
      if (encType !== EncryptionType.SECURE_STRING) {
        encrypted = false;
        console.error(`[zenfig] Warning: ${encryptionVerificationFailedError(canonicalKey).message}`);
      }
    }

    return {
      canonicalKey,
      value: validatedValue,
      serialized,
      encrypted,
    };
  });

/**
 * Run upsert and print result
 */
export const runUpsert = (
  options: UpsertOptions
): Effect.Effect<void, ProviderError | ValidationError | SystemError | ZenfigError> =>
  Effect.gen(function* () {
    const result = yield* executeUpsert(options);

    console.log(`Successfully wrote ${result.canonicalKey} to ${options.config.ssmPrefix}/${options.service}/${options.config.env}`);

    if (!result.encrypted) {
      console.warn('[zenfig] Warning: Value may not be encrypted as SecureString');
    }
  });
