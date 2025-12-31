import type * as Effect from 'effect/Effect';

import type { ValidationError } from '../errors.js';

export type ValidationKind = 'effect' | 'zod';

export type ParsedValue = unknown;

export type ParseMode = 'auto' | 'string' | 'int' | 'float' | 'bool' | 'json';

export type ResolvedPath = {
  readonly canonicalPath: string;
  readonly schema: unknown;
  readonly segments: ReadonlyArray<string>;
};

export type SchemaKeyInfo = {
  readonly path: string;
  readonly schema: unknown;
  readonly isOptional: boolean;
  readonly hasDefault: boolean;
  readonly defaultValue?: unknown;
};

export type ValidatorAdapter = {
  readonly name: ValidationKind;
  readonly isSchema: (value: unknown) => boolean;
  readonly computeSchemaHash: (schema: unknown) => string;
  readonly resolvePath: (schema: unknown, keyPath: string) => Effect.Effect<ResolvedPath, ValidationError>;
  readonly getAllLeafPaths: (schema: unknown) => ReadonlyArray<SchemaKeyInfo>;
  readonly describeNode: (schemaNode: unknown) => string;
  readonly parseValue: (
    value: string,
    schemaNode: unknown,
    path: string,
    mode: ParseMode
  ) => Effect.Effect<ParsedValue, ValidationError>;
  readonly serializeValue: (value: unknown, schemaNode: unknown) => string;
  readonly validate: <T>(value: unknown, schema: unknown) => Effect.Effect<T, ValidationError>;
  readonly validateAll: (
    value: unknown,
    schema: unknown
  ) => Effect.Effect<{ readonly value: unknown; readonly errors: ReadonlyArray<ValidationError> }, never>;
};
