/**
 * Deep Merge Utilities
 *
 * Merges configuration objects with conflict detection
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type MergeConflict = {
  readonly path: string;
  readonly sourceA: string;
  readonly sourceB: string;
  readonly valueA: unknown;
  readonly valueB: unknown;
  readonly type: 'type-mismatch' | 'override';
};

export type MergeResult<T> = {
  readonly merged: T;
  readonly conflicts: ReadonlyArray<MergeConflict>;
};

export type MergeOptions = {
  readonly strictMerge?: boolean | undefined; // Treat type conflicts as errors
  readonly warnOnOverride?: boolean | undefined; // Log all overrides
};

// --------------------------------------------------------------------------
// Type Checking
// --------------------------------------------------------------------------

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getTypeName = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

// --------------------------------------------------------------------------
// Deep Merge
// --------------------------------------------------------------------------

/**
 * Deep merge two objects, tracking conflicts
 *
 * @param base - Base object (lower priority)
 * @param overlay - Overlay object (higher priority, wins on conflict)
 * @param sourceBase - Name of base source (for conflict reporting)
 * @param sourceOverlay - Name of overlay source (for conflict reporting)
 * @param pathPrefix - Current path prefix (for nested paths)
 */
const deepMergeWithConflicts = (
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
  sourceBase: string,
  sourceOverlay: string,
  pathPrefix = ''
): MergeResult<Record<string, unknown>> => {
  const conflicts: Array<MergeConflict> = [];
  const result: Record<string, unknown> = { ...base };

  for (const [key, overlayValue] of Object.entries(overlay)) {
    const path = pathPrefix ? `${pathPrefix}.${key}` : key;
    const baseValue = base[key];

    if (baseValue === undefined) {
      // New key, just add it
      result[key] = overlayValue;
    } else if (isObject(baseValue) && isObject(overlayValue)) {
      // Both are objects, recurse
      const nested = deepMergeWithConflicts(baseValue, overlayValue, sourceBase, sourceOverlay, path);
      result[key] = nested.merged;
      conflicts.push(...nested.conflicts);
    } else if (Array.isArray(baseValue) || Array.isArray(overlayValue)) {
      // Arrays are replaced entirely
      if (Array.isArray(baseValue) && Array.isArray(overlayValue)) {
        conflicts.push({
          path,
          sourceA: sourceBase,
          sourceB: sourceOverlay,
          valueA: baseValue,
          valueB: overlayValue,
          type: 'override',
        });
      } else {
        // Type mismatch: one is array, other is not
        conflicts.push({
          path,
          sourceA: sourceBase,
          sourceB: sourceOverlay,
          valueA: baseValue,
          valueB: overlayValue,
          type: 'type-mismatch',
        });
      }
      result[key] = overlayValue;
    } else if (getTypeName(baseValue) !== getTypeName(overlayValue)) {
      // Type mismatch
      conflicts.push({
        path,
        sourceA: sourceBase,
        sourceB: sourceOverlay,
        valueA: baseValue,
        valueB: overlayValue,
        type: 'type-mismatch',
      });
      result[key] = overlayValue;
    } else {
      // Same type, override
      if (baseValue !== overlayValue) {
        conflicts.push({
          path,
          sourceA: sourceBase,
          sourceB: sourceOverlay,
          valueA: baseValue,
          valueB: overlayValue,
          type: 'override',
        });
      }
      result[key] = overlayValue;
    }
  }

  return { merged: result, conflicts };
};

/**
 * Merge multiple configuration objects in order
 *
 * @param sources - Array of [sourceName, sourceObject] pairs
 * @param options - Merge options
 */
export const mergeConfigs = (
  sources: ReadonlyArray<readonly [string, Record<string, unknown>]>,
  options: MergeOptions = {}
): Effect.Effect<MergeResult<Record<string, unknown>>, Error> =>
  pipe(
    Effect.sync(() => {
      if (sources.length === 0) {
        return { merged: {} as Record<string, unknown>, conflicts: [] as Array<MergeConflict>, lastSourceName: '' };
      }

      const allConflicts: Array<MergeConflict> = [];
      let merged: Record<string, unknown> = {};
      let lastSourceName = '';

      for (const [sourceName, sourceObject] of sources) {
        if (Object.keys(merged).length === 0) {
          merged = { ...sourceObject };
          lastSourceName = sourceName;
          continue;
        }

        const result = deepMergeWithConflicts(merged, sourceObject, lastSourceName, sourceName);
        merged = result.merged;
        allConflicts.push(...result.conflicts);
        lastSourceName = sourceName;
      }

      return { merged, conflicts: allConflicts, lastSourceName };
    }),
    Effect.flatMap(({ merged, conflicts }) => {
      // Check for type mismatches in strict mode
      if (options.strictMerge) {
        const typeMismatches = conflicts.filter((c) => c.type === 'type-mismatch');
        if (typeMismatches.length > 0) {
          const messages = typeMismatches.map(
            (c) =>
              `${c.path}: ${getTypeName(c.valueA)} (from ${c.sourceA}) vs ${getTypeName(c.valueB)} (from ${c.sourceB})`
          );
          return Effect.fail(new Error(`Type conflicts during merge:\n${messages.join('\n')}`));
        }
      }

      return Effect.succeed({ merged, conflicts });
    })
  );

/**
 * Filter conflicts to only include type mismatches
 */
export const getTypeMismatches = (conflicts: ReadonlyArray<MergeConflict>): ReadonlyArray<MergeConflict> =>
  conflicts.filter((c) => c.type === 'type-mismatch');

/**
 * Filter conflicts to only include overrides
 */
export const getOverrides = (conflicts: ReadonlyArray<MergeConflict>): ReadonlyArray<MergeConflict> =>
  conflicts.filter((c) => c.type === 'override');

/**
 * Format conflicts for logging
 */
export const formatConflicts = (conflicts: ReadonlyArray<MergeConflict>, redact = true): string => {
  if (conflicts.length === 0) return '';

  const lines = conflicts.map((c) => {
    const valueA = redact ? '<redacted>' : JSON.stringify(c.valueA);
    const valueB = redact ? '<redacted>' : JSON.stringify(c.valueB);
    const typeLabel = c.type === 'type-mismatch' ? '[TYPE MISMATCH]' : '[OVERRIDE]';
    return `  ${typeLabel} ${c.path}: ${valueA} (${c.sourceA}) -> ${valueB} (${c.sourceB})`;
  });

  return lines.join('\n');
};
