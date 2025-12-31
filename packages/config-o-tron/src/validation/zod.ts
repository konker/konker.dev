import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { z, ZodFirstPartyTypeKind, type ZodIssue, ZodType, type ZodTypeAny } from 'zod';

import {
  constraintViolationError,
  formatViolationError,
  invalidTypeError,
  keyNotFoundError,
  nullNotAllowedError,
  type ValidationError,
} from '../errors.js';
import { computeHash } from './hash.js';
import { parseBoolean, parseInteger, parseJson, parseNumber } from './parse.js';
import type { ParsedValue, ParseMode, ResolvedPath, SchemaKeyInfo, ValidatorAdapter } from './types.js';

const DEFAULT_TYPE_DESCRIPTION = 'unknown';

type UnwrappedSchema = {
  readonly schema: ZodTypeAny;
  readonly optional: boolean;
  readonly nullable: boolean;
  readonly hasDefault: boolean;
  readonly defaultValue?: unknown;
};

function isZodSchema(value: unknown): value is ZodTypeAny {
  return value instanceof ZodType;
}

function unwrapZod(schema: ZodTypeAny): UnwrappedSchema {
  let current: ZodTypeAny = schema;
  let optional = false;
  let nullable = false;
  let hasDefault = false;
  let defaultValue: unknown = undefined;

  // Unwrap common wrappers
  while (true) {
    const def = current._def as { typeName: ZodFirstPartyTypeKind; innerType?: ZodTypeAny; schema?: ZodTypeAny };

    switch (def.typeName) {
      case ZodFirstPartyTypeKind.ZodOptional:
        optional = true;
        current = def.innerType!;
        continue;
      case ZodFirstPartyTypeKind.ZodNullable:
        nullable = true;
        current = def.innerType!;
        continue;
      case ZodFirstPartyTypeKind.ZodDefault: {
        hasDefault = true;
        const defaultDef = current._def as { defaultValue: () => unknown; innerType: ZodTypeAny };
        defaultValue = defaultDef.defaultValue();
        current = defaultDef.innerType;
        continue;
      }
      case ZodFirstPartyTypeKind.ZodEffects: {
        const effectsDef = current._def as { schema: ZodTypeAny };
        current = effectsDef.schema;
        continue;
      }
      case ZodFirstPartyTypeKind.ZodCatch: {
        const catchDef = current._def as { innerType: ZodTypeAny };
        current = catchDef.innerType;
        continue;
      }
      default:
        return { schema: current, optional, nullable, hasDefault, defaultValue };
    }
  }
}

function getShape(schema: ZodTypeAny): Record<string, ZodTypeAny> {
  const def = schema._def as { shape?: Record<string, ZodTypeAny> | (() => Record<string, ZodTypeAny>) };
  const shape = def.shape;
  if (!shape) {
    return {};
  }
  return typeof shape === 'function' ? shape() : shape;
}

function zodTypeName(schema: ZodTypeAny): ZodFirstPartyTypeKind {
  return (schema._def as { typeName: ZodFirstPartyTypeKind }).typeName;
}

function isIntegerSchema(schema: ZodTypeAny): boolean {
  if (zodTypeName(schema) !== ZodFirstPartyTypeKind.ZodNumber) {
    return false;
  }
  const def = schema._def as { checks?: ReadonlyArray<{ kind?: string }> };
  return (def.checks ?? []).some((check) => check.kind === 'int');
}

function describeSchema(schema: ZodTypeAny): string {
  const unwrapped = unwrapZod(schema);
  const base = unwrapped.schema;
  const typeName = zodTypeName(base);

  if (typeName === ZodFirstPartyTypeKind.ZodNumber && isIntegerSchema(base)) {
    return 'integer';
  }

  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return 'string';
    case ZodFirstPartyTypeKind.ZodNumber:
      return 'number';
    case ZodFirstPartyTypeKind.ZodBoolean:
      return 'boolean';
    case ZodFirstPartyTypeKind.ZodArray:
      return 'array';
    case ZodFirstPartyTypeKind.ZodObject:
    case ZodFirstPartyTypeKind.ZodRecord:
      return 'object';
    case ZodFirstPartyTypeKind.ZodUnion:
      return 'union';
    case ZodFirstPartyTypeKind.ZodEnum:
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return 'enum';
    case ZodFirstPartyTypeKind.ZodLiteral: {
      const literal = (base._def as { value: unknown }).value;
      return `literal ${JSON.stringify(literal)}`;
    }
    case ZodFirstPartyTypeKind.ZodNull:
      return 'null';
    case ZodFirstPartyTypeKind.ZodUnknown:
      return 'unknown';
    default:
      return DEFAULT_TYPE_DESCRIPTION;
  }
}

function serializeReceived(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }
  const raw = JSON.stringify(value);
  return (raw ?? String(value)).slice(0, 100);
}

function issueToValidationError(issue: ZodIssue): ValidationError {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  const received =
    'received' in issue ? String(issue.received) : serializeReceived((issue as { input?: unknown }).input);

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type: {
      const expected = String(issue.expected);
      if (issue.received === 'null' && expected !== 'null') {
        return nullNotAllowedError(path, expected);
      }
      return invalidTypeError(path, expected, received);
    }
    case z.ZodIssueCode.invalid_string: {
      const validation = issue.validation;
      if (validation === 'email' || validation === 'url' || validation === 'uuid') {
        return formatViolationError(path, `string (${validation} format)`, received);
      }
      return constraintViolationError(path, 'string', received, issue.message);
    }
    case z.ZodIssueCode.too_small:
    case z.ZodIssueCode.too_big: {
      return constraintViolationError(path, DEFAULT_TYPE_DESCRIPTION, received, issue.message);
    }
    case z.ZodIssueCode.invalid_enum_value: {
      const expected = issue.options?.map((option) => JSON.stringify(option)).join(', ') ?? 'enum';
      return constraintViolationError(path, expected, received, issue.message);
    }
    case z.ZodIssueCode.unrecognized_keys:
      return constraintViolationError(path, 'no additional properties', received, issue.message);
    case z.ZodIssueCode.invalid_union:
      return invalidTypeError(path, 'union', received);
    default:
      return constraintViolationError(path, DEFAULT_TYPE_DESCRIPTION, received, issue.message);
  }
}

function hashableZodSchema(schema: ZodTypeAny): unknown {
  const def = schema._def as { typeName: ZodFirstPartyTypeKind; shape?: unknown };
  if (def.typeName === ZodFirstPartyTypeKind.ZodObject) {
    return { ...def, shape: getShape(schema) };
  }
  return def;
}

export const zodAdapter: ValidatorAdapter = {
  name: 'zod',
  isSchema: isZodSchema,
  computeSchemaHash: (schema: unknown) => computeHash(hashableZodSchema(schema as ZodTypeAny)),
  resolvePath: (schema: unknown, keyPath: string) => {
    const segments = keyPath.split('.');
    let current = schema as ZodTypeAny;
    const canonicalSegments: Array<string> = [];

    for (const segment of segments) {
      const unwrapped = unwrapZod(current);
      const base = unwrapped.schema;

      if (zodTypeName(base) !== ZodFirstPartyTypeKind.ZodObject) {
        const availableKeys = canonicalSegments.length > 0 ? [canonicalSegments.join('.')] : undefined;
        return Effect.fail(keyNotFoundError(keyPath, availableKeys));
      }

      const shape = getShape(base);
      const next = shape[segment];
      if (!next) {
        const availableKeys = Object.keys(shape).map((name) =>
          canonicalSegments.length > 0 ? `${canonicalSegments.join('.')}.${name}` : name
        );
        return Effect.fail(keyNotFoundError(keyPath, availableKeys));
      }

      canonicalSegments.push(segment);
      current = next;
    }

    const resolved: ResolvedPath = {
      canonicalPath: canonicalSegments.join('.'),
      schema: current,
      segments: canonicalSegments,
    };

    return Effect.succeed(resolved);
  },
  getAllLeafPaths: (schema: unknown) => {
    const root = schema as ZodTypeAny;

    const collect = (node: ZodTypeAny, prefix: string, optional: boolean): ReadonlyArray<SchemaKeyInfo> => {
      const unwrapped = unwrapZod(node);
      const base = unwrapped.schema;
      const combinedOptional = optional || unwrapped.optional;

      if (zodTypeName(base) === ZodFirstPartyTypeKind.ZodObject) {
        const results: Array<SchemaKeyInfo> = [];
        const shape = getShape(base);
        for (const [key, child] of Object.entries(shape)) {
          const nextPath = prefix ? `${prefix}.${key}` : key;
          results.push(...collect(child, nextPath, combinedOptional));
        }
        return results;
      }

      return [
        {
          path: prefix,
          schema: base,
          isOptional: combinedOptional,
          hasDefault: unwrapped.hasDefault,
          defaultValue: unwrapped.defaultValue,
        },
      ];
    };

    return collect(root, '', false);
  },
  describeNode: (schemaNode: unknown) => describeSchema(schemaNode as ZodTypeAny),
  parseValue: (value: string, schemaNode: unknown, path: string, mode: ParseMode) => {
    if (mode !== 'auto') {
      switch (mode) {
        case 'string':
          return Effect.succeed(value);
        case 'int':
          return parseInteger(value, path);
        case 'float':
          return parseNumber(value, path);
        case 'bool':
          return parseBoolean(value, path);
        case 'json':
          return parseJson(value, path, 'JSON');
      }
    }

    const unwrapped = unwrapZod(schemaNode as ZodTypeAny);
    const base = unwrapped.schema;
    const typeName = zodTypeName(base);

    switch (typeName) {
      case ZodFirstPartyTypeKind.ZodString:
        return Effect.succeed(value);
      case ZodFirstPartyTypeKind.ZodBoolean:
        return parseBoolean(value, path);
      case ZodFirstPartyTypeKind.ZodNumber:
        return isIntegerSchema(base) ? parseInteger(value, path) : parseNumber(value, path);
      case ZodFirstPartyTypeKind.ZodLiteral: {
        const literal = (base._def as { value: unknown }).value;
        if (typeof literal === 'string') {
          return Effect.succeed(value);
        }
        if (typeof literal === 'number') {
          return parseNumber(value, path);
        }
        if (typeof literal === 'boolean') {
          return parseBoolean(value, path);
        }
        if (literal === null) {
          return value.toLowerCase() === 'null'
            ? Effect.succeed(null)
            : Effect.fail(invalidTypeError(path, 'null', `"${value}"`));
        }
        return Effect.succeed(value);
      }
      case ZodFirstPartyTypeKind.ZodEnum:
      case ZodFirstPartyTypeKind.ZodNativeEnum: {
        return Effect.succeed(value);
      }
      case ZodFirstPartyTypeKind.ZodArray:
        return parseJson(value, path, 'array');
      case ZodFirstPartyTypeKind.ZodRecord:
      case ZodFirstPartyTypeKind.ZodObject:
        return parseJson(value, path, 'object');
      case ZodFirstPartyTypeKind.ZodUnion: {
        const options = (base._def as { options: Array<ZodTypeAny> }).options;
        return pipe(
          Effect.reduce(options, null as ParsedValue | null, (acc, option) => {
            if (acc !== null) {
              return Effect.succeed(acc);
            }
            return Effect.catchAll(
              Effect.flatMap(zodAdapter.parseValue(value, option, path, 'auto'), (parsed) => {
                const result = option.safeParse(parsed);
                return result.success ? Effect.succeed(parsed) : Effect.succeed(null);
              }),
              () => Effect.succeed(null)
            );
          }),
          Effect.map((result) => (result !== null ? result : value))
        );
      }
      case ZodFirstPartyTypeKind.ZodNull:
        return value.toLowerCase() === 'null'
          ? Effect.succeed(null)
          : Effect.fail(invalidTypeError(path, 'null', `"${value}"`));
      default:
        return Effect.succeed(value);
    }
  },
  serializeValue: (value: unknown, schemaNode: unknown) => {
    if (value === null || value === undefined) {
      return '';
    }

    const unwrapped = unwrapZod(schemaNode as ZodTypeAny);
    const base = unwrapped.schema;
    const typeName = zodTypeName(base);

    switch (typeName) {
      case ZodFirstPartyTypeKind.ZodString:
        return String(value);
      case ZodFirstPartyTypeKind.ZodBoolean:
        return value ? 'true' : 'false';
      case ZodFirstPartyTypeKind.ZodNumber:
        return String(value);
      case ZodFirstPartyTypeKind.ZodArray:
      case ZodFirstPartyTypeKind.ZodObject:
      case ZodFirstPartyTypeKind.ZodRecord:
        return JSON.stringify(value);
      default:
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  },
  validate: <T>(value: unknown, schema: unknown) =>
    Effect.suspend(() => {
      const result = (schema as ZodTypeAny).safeParse(value);
      if (result.success) {
        return Effect.succeed(result.data as T);
      }

      const issue = result.error.issues[0];
      if (!issue) {
        return Effect.fail(
          constraintViolationError('(root)', DEFAULT_TYPE_DESCRIPTION, serializeReceived(value), 'Validation failed')
        );
      }

      return Effect.fail(issueToValidationError(issue));
    }),
  validateAll: (value: unknown, schema: unknown) =>
    Effect.sync(() => {
      const result = (schema as ZodTypeAny).safeParse(value);
      if (result.success) {
        return { value, errors: [] };
      }

      const errors = result.error.issues.map(issueToValidationError);
      return { value, errors };
    }),
};
