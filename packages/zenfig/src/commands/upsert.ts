/**
 * Upsert Command
 *
 * Workflow: Input -> Resolve -> Parse -> Validate -> Serialize -> Push
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import {
  encryptionVerificationFailedError,
  type ProviderError,
  type SystemError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { checkProviderGuards } from '../providers/guards.js';
import { EncryptionType, type ProviderContext } from '../providers/Provider.js';
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
function readFromStdin(): Effect.Effect<string, never> {
  return Effect.promise(async () => {
    const chunks: Array<Buffer> = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks).toString('utf-8').trim();
  });
}

// --------------------------------------------------------------------------
// Upsert Command
// --------------------------------------------------------------------------

/**
 * Execute the upsert workflow
 */
export function executeUpsert(
  options: UpsertOptions
): Effect.Effect<UpsertResult, ProviderError | ValidationError | SystemError | ZenfigError> {
  return pipe(
    // 1. Load schema
    loadSchemaWithDefaults(options.config.schema, options.config.validation),
    Effect.flatMap(({ adapter, schema }) =>
      // 2. Resolve and canonicalize the key path
      pipe(
        resolvePath(schema, options.key, adapter),
        Effect.map((resolved) => ({ resolved, adapter }))
      )
    ),
    Effect.flatMap(({ adapter, resolved }) => {
      const canonicalKey = resolved.canonicalPath;

      // 3. Get the value
      const valueEffect = options.stdin ? readFromStdin() : Effect.succeed(options.value ?? '');

      return pipe(
        valueEffect,
        Effect.flatMap((rawValue) =>
          // 4. Parse the value according to schema
          pipe(
            parseValue(rawValue, resolved.schema, canonicalKey, options.type ?? 'auto', adapter),
            Effect.flatMap((parsedValue) =>
              // 5. Validate the parsed value
              pipe(
                validate(parsedValue, resolved.schema, adapter),
                Effect.map((validatedValue) => ({
                  canonicalKey,
                  validatedValue,
                  resolvedSchema: resolved.schema,
                  adapter,
                }))
              )
            )
          )
        )
      );
    }),
    Effect.flatMap(({ adapter, canonicalKey, resolvedSchema, validatedValue }) => {
      // 6. Serialize back to provider string format
      const serialized = serializeValue(validatedValue, resolvedSchema, adapter);

      const { config, service, skipEncryptionCheck = false } = options;
      const ctx: ProviderContext = {
        prefix: config.ssmPrefix,
        service,
        env: config.env,
      };

      // 7. Get provider and push
      return pipe(
        getProvider(config.provider),
        Effect.flatMap((provider) =>
          pipe(
            checkProviderGuards(provider, ctx, config.providerGuards),
            Effect.flatMap(() => provider.upsert(ctx, canonicalKey, serialized)),
            Effect.flatMap(() => {
              // 8. Verify encryption if supported and not skipped
              if (!skipEncryptionCheck && provider.capabilities.encryptionVerification && provider.verifyEncryption) {
                return pipe(
                  provider.verifyEncryption(ctx, canonicalKey),
                  Effect.map((encType) => {
                    if (encType !== EncryptionType.SECURE_STRING) {
                      console.error(`[zenfig] Warning: ${encryptionVerificationFailedError(canonicalKey).message}`);
                      return false;
                    }
                    return true;
                  })
                );
              }
              return Effect.succeed(true);
            }),
            Effect.map((encrypted) => ({
              canonicalKey,
              value: validatedValue,
              serialized,
              encrypted,
            }))
          )
        )
      );
    })
  );
}

/**
 * Run upsert and print result
 */
export function runUpsert(
  options: UpsertOptions
): Effect.Effect<void, ProviderError | ValidationError | SystemError | ZenfigError> {
  return pipe(
    executeUpsert(options),
    Effect.map((result) => {
      console.log(
        `Successfully wrote ${result.canonicalKey} to ${options.config.ssmPrefix}/${options.config.env}/${options.service}`
      );

      if (!result.encrypted) {
        console.warn('[zenfig] Warning: Value may not be encrypted as SecureString');
      }
    })
  );
}
