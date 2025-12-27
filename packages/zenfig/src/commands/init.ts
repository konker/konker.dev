/**
 * Init Command
 *
 * Generate an identity Jsonnet template from a TypeBox schema
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { Kind, type TObject, type TSchema } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import {
  fileNotFoundError,
  permissionDeniedError,
  type SystemError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { getAllLeafPaths, isObjectSchema, isOptionalSchema, unwrapOptional } from '../schema/resolver.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type InitOptions = {
  readonly output?: string | undefined;
  readonly force?: boolean | undefined;
  readonly includeDefaults?: boolean | undefined;
  readonly config: ResolvedConfig;
};

export type InitResult = {
  readonly path: string;
  readonly created: boolean;
};

// --------------------------------------------------------------------------
// Jsonnet Generation
// --------------------------------------------------------------------------

/**
 * Generate Jsonnet code for accessing a schema path
 */
const generatePathAccess = (
  path: string,
  hasDefault: boolean,
  defaultValue: unknown,
  includeDefaults: boolean
): string => {
  const segments = path.split('.');
  const accessor = `s.${segments.join('.')}`;

  if (includeDefaults && hasDefault && defaultValue !== undefined) {
    // Use std.get for default values
    const parentPath = segments.slice(0, -1).join('.');
    const lastSegment = segments[segments.length - 1];
    const parent = parentPath ? `s.${parentPath}` : 's';
    const defaultStr = JSON.stringify(defaultValue);
    return `std.get(${parent}, "${lastSegment}", ${defaultStr})`;
  }

  return accessor;
};

/**
 * Generate Jsonnet object structure from schema
 */
const generateJsonnetObject = (schema: TSchema, includeDefaults: boolean, indent = 2, path = ''): string => {
  const unwrapped = unwrapOptional(schema);
  const spaces = ' '.repeat(indent);

  if (!isObjectSchema(unwrapped)) {
    // Leaf node - shouldn't happen at top level
    return 's';
  }

  const lines: Array<string> = [];
  lines.push('{');

  const entries = Object.entries((unwrapped as TObject).properties);

  for (let i = 0; i < entries.length; i++) {
    const [propName, propSchema] = entries[i]!;
    const propPath = path ? `${path}.${propName}` : propName;
    const propUnwrapped = unwrapOptional(propSchema as TSchema);
    const isLast = i === entries.length - 1;
    const comma = isLast ? '' : ',';

    if (isObjectSchema(propUnwrapped)) {
      // Nested object
      if (isOptionalSchema(propSchema as TSchema)) {
        // Optional object - wrap in conditional
        lines.push(`${spaces}${propName}: if std.objectHas(s${path ? '.' + path : ''}, "${propName}") then`);
        lines.push(`${spaces}  ${generateJsonnetObject(propSchema as TSchema, includeDefaults, indent + 2, propPath)}`);
        lines.push(`${spaces}else {}${comma}`);
      } else {
        lines.push(
          `${spaces}${propName}: ${generateJsonnetObject(propSchema as TSchema, includeDefaults, indent + 2, propPath)}${comma}`
        );
      }
    } else {
      // Leaf node
      const leafInfo = getAllLeafPaths(propSchema as TSchema, propPath).find((l) => l.path === propPath);
      const hasDefault = leafInfo?.hasDefault ?? false;
      const defaultValue = leafInfo?.defaultValue;

      // Add comment for defaults
      if (includeDefaults && hasDefault) {
        lines.push(`${spaces}// Schema default: ${JSON.stringify(defaultValue)}`);
      }

      // Add comment for union types
      if ((propUnwrapped as TSchema)[Kind] === 'Union') {
        lines.push(`${spaces}// Union type`);
      }

      const accessor = generatePathAccess(propPath, hasDefault, defaultValue, includeDefaults);
      lines.push(`${spaces}${propName}: ${accessor}${comma}`);
    }
  }

  lines.push(`${' '.repeat(indent - 2)}}`);

  return lines.join('\n');
};

/**
 * Generate complete Jsonnet template
 */
const generateJsonnetTemplate = (schema: TSchema, includeDefaults: boolean): string => {
  const lines: Array<string> = [];

  lines.push('local s = std.extVar("secrets");');
  lines.push('local env = std.extVar("env");');
  lines.push('');

  const body = generateJsonnetObject(schema, includeDefaults);
  lines.push(body);
  lines.push('');

  return lines.join('\n');
};

// --------------------------------------------------------------------------
// Init Command
// --------------------------------------------------------------------------

/**
 * Execute the init workflow
 */
export const executeInit = (
  options: InitOptions
): Effect.Effect<InitResult, SystemError | ValidationError | ZenfigError> =>
  pipe(
    Effect.sync(() => {
      const { config, force = false, output } = options;
      const outputPath = output ?? config.jsonnet;

      // 1. Check if output file exists
      if (fs.existsSync(outputPath) && !force) {
        console.error(`Error: Output file already exists: ${outputPath}`);
        console.error('Use --force to overwrite');
        return { outputPath, skip: true, includeDefaults: options.includeDefaults ?? false };
      }

      if (fs.existsSync(outputPath) && force) {
        console.warn(`Warning: Overwriting existing file: ${outputPath}`);
      }

      return { outputPath, skip: false, includeDefaults: options.includeDefaults ?? false };
    }),
    Effect.flatMap(
      ({
        includeDefaults,
        outputPath,
        skip,
      }): Effect.Effect<InitResult, SystemError | ValidationError | ZenfigError> => {
        if (skip) {
          return Effect.succeed({ path: outputPath, created: false });
        }

        // 2. Load schema
        return pipe(
          loadSchemaWithDefaults(options.config.schema, options.config.schemaExportName),
          Effect.flatMap(({ schema }) => {
            // 3. Validate schema is an object
            if (!isObjectSchema(unwrapOptional(schema))) {
              return Effect.fail(fileNotFoundError('Schema must be a TypeBox Object type'));
            }

            // 4. Generate Jsonnet template
            const template = generateJsonnetTemplate(schema, includeDefaults);

            // 5. Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            const ensureDir: Effect.Effect<void, SystemError> =
              outputDir && outputDir !== '.'
                ? pipe(
                    Effect.try({
                      try: () => fs.mkdirSync(outputDir, { recursive: true }),
                      catch: () => permissionDeniedError(outputDir, 'create directory'),
                    }),
                    Effect.tap(() => Effect.sync(() => console.log(`Info: Creating directory: ${outputDir}`)))
                  )
                : Effect.void;

            return pipe(
              ensureDir,
              Effect.flatMap(() =>
                // 6. Write template
                Effect.try({
                  try: () => fs.writeFileSync(outputPath, template),
                  catch: () => permissionDeniedError(outputPath, 'write'),
                })
              ),
              Effect.map((): InitResult => {
                console.log(`Generated: ${outputPath}`);
                return { path: outputPath, created: true };
              })
            );
          })
        );
      }
    )
  );

/**
 * Run init command
 */
export const runInit = (options: InitOptions): Effect.Effect<boolean, SystemError | ValidationError | ZenfigError> =>
  pipe(
    executeInit(options),
    Effect.map((result) => result.created)
  );
