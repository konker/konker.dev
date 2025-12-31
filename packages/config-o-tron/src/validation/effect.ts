import * as Effect from 'effect/Effect';
import * as Either from 'effect/Either';
import { pipe } from 'effect/Function';
import type * as ParseResult from 'effect/ParseResult';
import * as Schema from 'effect/Schema';
import * as SchemaAST from 'effect/SchemaAST';

import {
  constraintViolationError,
  invalidTypeError,
  keyNotFoundError,
  nullNotAllowedError,
  type ValidationError,
} from '../errors.js';
import { computeHash } from './hash.js';
import { parseBoolean, parseInteger, parseJson, parseNumber } from './parse.js';
import type { ParsedValue, ParseMode, SchemaKeyInfo, ValidatorAdapter } from './types.js';

type Ast = SchemaAST.AST;
type ParseIssue = ParseResult.ParseIssue;

const DEFAULT_TYPE_DESCRIPTION = 'unknown';

type CollectedIssue = {
  readonly path: ReadonlyArray<PropertyKey>;
  readonly ast: Ast | undefined;
  readonly actual: unknown;
  readonly message: string | undefined;
  readonly tag: ParseIssue['_tag'];
};

function astFromSchema(schema: unknown): Ast {
  if (Schema.isSchema(schema)) {
    return schema.ast;
  }

  if (schema && typeof schema === 'object' && '_tag' in (schema as { _tag?: unknown })) {
    return schema as Ast;
  }

  // eslint-disable-next-line fp/no-throw
  throw new Error('Invalid Effect Schema node');
}

function unwrapAst(ast: Ast): Ast {
  if (SchemaAST.isRefinement(ast)) {
    return unwrapAst(ast.from);
  }
  if (SchemaAST.isTransformation(ast)) {
    return unwrapAst(ast.to);
  }
  if (SchemaAST.isSuspend(ast)) {
    return unwrapAst(ast.f());
  }
  return ast;
}

function unwrapOptionalUnion(ast: Ast): Ast {
  if (SchemaAST.isUnion(ast)) {
    const nonUndefined = ast.types.filter((member) => member._tag !== 'UndefinedKeyword');
    if (nonUndefined.length === 1) {
      return nonUndefined[0]!;
    }
  }
  return ast;
}

function normalizeAst(ast: Ast): Ast {
  return unwrapOptionalUnion(unwrapAst(ast));
}

function annotationValue(ast: Ast, key: PropertyKey): unknown {
  const annotations = (ast as { annotations?: Record<PropertyKey, unknown> }).annotations;
  if (!annotations) {
    return undefined;
  }
  return annotations[key];
}

function isIntegerAst(ast: Ast): boolean {
  if (SchemaAST.isRefinement(ast)) {
    const jsonSchema = annotationValue(ast, SchemaAST.JSONSchemaAnnotationId) as { type?: unknown } | undefined;
    if (jsonSchema?.type === 'integer') {
      return true;
    }
    const title = annotationValue(ast, SchemaAST.TitleAnnotationId);
    const description = annotationValue(ast, SchemaAST.DescriptionAnnotationId);
    if (title === 'int' || description === 'an integer') {
      return true;
    }
    return isIntegerAst(ast.from);
  }
  return false;
}

function astAllowsNull(ast: Ast): boolean {
  const normalized = normalizeAst(ast);
  if (SchemaAST.isLiteral(normalized)) {
    return normalized.literal === null;
  }
  if (SchemaAST.isUnion(normalized)) {
    return normalized.types.some((type) => astAllowsNull(type));
  }
  return false;
}

function describeAst(ast: Ast): string {
  if (isIntegerAst(ast)) {
    return 'integer';
  }

  const normalized = normalizeAst(ast);

  switch (normalized._tag) {
    case 'StringKeyword':
      return 'string';
    case 'NumberKeyword':
      return 'number';
    case 'BooleanKeyword':
      return 'boolean';
    case 'TupleType':
      return 'array';
    case 'TypeLiteral':
      return 'object';
    case 'ObjectKeyword':
      return 'object';
    case 'Union':
      return 'union';
    case 'Enums':
      return 'enum';
    case 'Literal':
      return `literal ${JSON.stringify(normalized.literal)}`;
    case 'UnknownKeyword':
      return 'unknown';
    case 'AnyKeyword':
      return 'any';
    default:
      return normalized._tag ?? DEFAULT_TYPE_DESCRIPTION;
  }
}

function collectIssues(issue: ParseIssue, path: Array<PropertyKey> = []): Array<CollectedIssue> {
  switch (issue._tag) {
    case 'Pointer': {
      const pointerPath = Array.isArray(issue.path) ? issue.path : [issue.path];
      return collectIssues(issue.issue, [...path, ...pointerPath]).map((entry) => ({
        ...entry,
        actual: entry.actual ?? issue.actual,
      }));
    }
    case 'Composite': {
      const issues = Array.isArray(issue.issues) ? issue.issues : [issue.issues];
      return issues.flatMap((inner) => collectIssues(inner, path));
    }
    case 'Refinement': {
      return collectIssues(issue.issue, path).map((entry) => ({
        ...entry,
        ast: entry.ast ?? issue.ast,
        actual: entry.actual ?? issue.actual,
      }));
    }
    case 'Transformation': {
      return collectIssues(issue.issue, path).map((entry) => ({
        ...entry,
        ast: entry.ast ?? issue.ast,
        actual: entry.actual ?? issue.actual,
      }));
    }
    case 'Type':
    case 'Missing':
    case 'Unexpected':
    case 'Forbidden': {
      return [
        {
          path,
          ast: 'ast' in issue ? (issue.ast as Ast) : undefined,
          actual: 'actual' in issue ? issue.actual : undefined,
          message: issue.message,
          tag: issue._tag,
        },
      ];
    }
    default: {
      const fallback = issue as ParseIssue;
      return [
        {
          path,
          ast: undefined,
          actual: undefined,
          message: (fallback as { message?: string }).message,
          tag: fallback._tag,
        },
      ];
    }
  }
}

function serializeReceived(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }
  const raw = JSON.stringify(value);
  return (raw ?? String(value)).slice(0, 100);
}

function issueToValidationError(issue: CollectedIssue): ValidationError {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  const expected = issue.ast ? describeAst(issue.ast) : DEFAULT_TYPE_DESCRIPTION;
  const received = serializeReceived(issue.actual);

  if (issue.actual === null && issue.ast && !astAllowsNull(issue.ast)) {
    return nullNotAllowedError(path, expected);
  }

  const isRefinement = issue.ast ? SchemaAST.isRefinement(issue.ast) : false;

  switch (issue.tag) {
    case 'Type':
      return isRefinement
        ? constraintViolationError(path, expected, received, issue.message ?? 'Value does not satisfy constraints')
        : invalidTypeError(path, expected, received);
    case 'Missing':
      return constraintViolationError(path, 'required', received, 'Missing required property');
    case 'Unexpected':
      return constraintViolationError(path, 'no additional properties', received, 'Unknown property not allowed');
    default:
      return constraintViolationError(path, expected, received, issue.message ?? 'Validation failed');
  }
}

function decodeWithAst(
  ast: Ast,
  value: unknown,
  errors: 'first' | 'all'
): Either.Either<unknown, ParseResult.ParseError> {
  const schema = Schema.make(ast);
  const decodeEither = Schema.decodeUnknownEither(schema, { errors });
  return decodeEither(value) as Either.Either<unknown, ParseResult.ParseError>;
}

function validateAst<T>(ast: Ast, value: unknown): Effect.Effect<T, ValidationError> {
  return pipe(
    Effect.sync(() => decodeWithAst(ast, value, 'all')),
    Effect.flatMap((result) => {
      const parsed = result as Either.Either<unknown, ParseResult.ParseError>;
      if (Either.isRight(parsed)) {
        return Effect.succeed(parsed.right as T);
      }

      const issues = collectIssues(parsed.left.issue);
      const first = issues[0];
      if (!first) {
        return Effect.fail(
          constraintViolationError('(root)', DEFAULT_TYPE_DESCRIPTION, serializeReceived(value), 'Invalid')
        );
      }
      return Effect.fail(issueToValidationError(first));
    })
  );
}

export const effectAdapter: ValidatorAdapter = {
  name: 'effect',
  isSchema: Schema.isSchema,
  computeSchemaHash: (schema: unknown) => computeHash(astFromSchema(schema)),
  resolvePath: (schema: unknown, keyPath: string) => {
    const segments = keyPath.split('.');
    let current = astFromSchema(schema);
    const canonicalSegments: Array<string> = [];

    for (const segment of segments) {
      const normalized = normalizeAst(current);
      if (!SchemaAST.isTypeLiteral(normalized)) {
        const availableKeys = canonicalSegments.length > 0 ? [canonicalSegments.join('.')] : undefined;
        return Effect.fail(keyNotFoundError(keyPath, availableKeys));
      }

      const property = normalized.propertySignatures.find(
        (signature) => typeof signature.name === 'string' && signature.name === segment
      );
      if (!property) {
        const availableKeys = normalized.propertySignatures
          .map((signature) => signature.name)
          .filter((name): name is string => typeof name === 'string')
          .map((name) => (canonicalSegments.length > 0 ? `${canonicalSegments.join('.')}.${name}` : name));
        return Effect.fail(keyNotFoundError(keyPath, availableKeys));
      }

      canonicalSegments.push(String(property.name));
      current = property.type;
    }

    return Effect.succeed({
      canonicalPath: canonicalSegments.join('.'),
      schema: current,
      segments: canonicalSegments,
    });
  },
  getAllLeafPaths: (schema: unknown) => {
    const root = astFromSchema(schema);

    const collect = (ast: Ast, prefix: string, optional: boolean): ReadonlyArray<SchemaKeyInfo> => {
      const normalized = normalizeAst(ast);
      if (SchemaAST.isTypeLiteral(normalized)) {
        const results: Array<SchemaKeyInfo> = [];
        for (const signature of normalized.propertySignatures) {
          if (typeof signature.name !== 'string') {
            continue;
          }
          const nextPath = prefix ? `${prefix}.${signature.name}` : signature.name;
          const nestedOptional = optional || signature.isOptional;
          results.push(...collect(signature.type, nextPath, nestedOptional));
        }
        return results;
      }

      return [
        {
          path: prefix,
          schema: normalized,
          isOptional: optional,
          hasDefault: false,
        },
      ];
    };

    return collect(root, '', false);
  },
  describeNode: (schemaNode: unknown) => describeAst(astFromSchema(schemaNode)),
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

    const original = astFromSchema(schemaNode);
    const normalized = normalizeAst(original);

    switch (normalized._tag) {
      case 'StringKeyword':
        return Effect.succeed(value);
      case 'BooleanKeyword':
        return parseBoolean(value, path);
      case 'NumberKeyword':
        return isIntegerAst(original) ? parseInteger(value, path) : parseNumber(value, path);
      case 'Literal': {
        const literal = normalized.literal;
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
      case 'Enums': {
        const enumValues = normalized.enums.map((entry) => entry[1]);
        const allNumbers = enumValues.every((item) => typeof item === 'number');
        if (allNumbers) {
          return parseNumber(value, path);
        }
        return Effect.succeed(value);
      }
      case 'TupleType':
        return parseJson(value, path, 'array');
      case 'TypeLiteral':
      case 'ObjectKeyword':
        return parseJson(value, path, 'object');
      case 'Union': {
        return pipe(
          Effect.reduce(normalized.types, null as ParsedValue | null, (acc, branch) => {
            if (acc !== null) {
              return Effect.succeed(acc);
            }
            return pipe(
              effectAdapter.parseValue(value, branch, path, 'auto'),
              Effect.flatMap((parsed) =>
                pipe(
                  validateAst(branch, parsed),
                  Effect.as(parsed),
                  Effect.catchAll(() => Effect.succeed(null))
                )
              ),
              Effect.catchAll(() => Effect.succeed(null))
            );
          }),
          Effect.map((result) => (result !== null ? result : value))
        );
      }
      default:
        return Effect.succeed(value);
    }
  },
  serializeValue: (value: unknown, schemaNode: unknown) => {
    if (value === null || value === undefined) {
      return '';
    }

    const normalized = normalizeAst(astFromSchema(schemaNode));

    switch (normalized._tag) {
      case 'StringKeyword':
        return String(value);
      case 'BooleanKeyword':
        return value ? 'true' : 'false';
      case 'NumberKeyword':
        return String(value);
      case 'TupleType':
      case 'TypeLiteral':
      case 'ObjectKeyword':
        return JSON.stringify(value);
      default:
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  },
  validate: <T>(value: unknown, schema: unknown) => validateAst<T>(astFromSchema(schema), value),
  validateAll: (value: unknown, schema: unknown) =>
    Effect.sync(() => {
      const ast = astFromSchema(schema);
      const result = decodeWithAst(ast, value, 'all') as Either.Either<unknown, ParseResult.ParseError>;
      if (Either.isRight(result)) {
        return { value, errors: [] };
      }

      const issues = collectIssues(result.left.issue);
      const errors = issues.map(issueToValidationError);
      return { value, errors };
    }),
};
