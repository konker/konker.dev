/**
 * Object Flattening/Unflattening Utilities
 *
 * Converts between nested objects and flat key-value maps
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type FlatObject = Record<string, unknown>;

// --------------------------------------------------------------------------
// Flattening
// --------------------------------------------------------------------------

/**
 * Flatten a nested object to dot-notation paths
 *
 * @param obj - The nested object to flatten
 * @param prefix - Current path prefix (for recursion)
 * @returns Flat object with dot-notation keys
 *
 * @example
 * flatten({ database: { url: "postgres://..." } })
 * // Returns: { "database.url": "postgres://..." }
 */
export const flatten = (obj: Record<string, unknown>, prefix = ''): FlatObject => {
  const result: FlatObject = {};

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested objects
      const nested = flatten(value as Record<string, unknown>, path);
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        result[nestedKey] = nestedValue;
      }
    } else {
      // Leaf value (including arrays)
      result[path] = value;
    }
  }

  return result;
};

/**
 * Unflatten a flat object with dot-notation paths to nested structure
 *
 * @param obj - The flat object to unflatten
 * @returns Nested object
 *
 * @example
 * unflatten({ "database.url": "postgres://..." })
 * // Returns: { database: { url: "postgres://..." } }
 */
export const unflatten = (obj: FlatObject): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(obj)) {
    const segments = path.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      const isLast = i === segments.length - 1;

      if (isLast) {
        current[segment] = value;
      } else {
        if (!(segment in current) || typeof current[segment] !== 'object') {
          current[segment] = {};
        }
        current = current[segment] as Record<string, unknown>;
      }
    }
  }

  return result;
};

// --------------------------------------------------------------------------
// Key Conversion
// --------------------------------------------------------------------------

/**
 * Convert camelCase to SCREAMING_SNAKE_CASE
 *
 * @example
 * camelToScreamingSnake("timeoutMs") // "TIMEOUT_MS"
 * camelToScreamingSnake("enableBeta") // "ENABLE_BETA"
 * camelToScreamingSnake("API") // "API"
 */
export const camelToScreamingSnake = (str: string): string => {
  // Insert underscore before uppercase letters (except at start)
  // Handle consecutive uppercase (e.g., "APIKey" -> "API_KEY")
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toUpperCase();
};

/**
 * Convert a dot-notation path to an environment variable key
 *
 * @param path - Dot-notation path (e.g., "database.url")
 * @param separator - Key separator (default: "_")
 * @returns Environment variable key (e.g., "DATABASE_URL")
 *
 * @example
 * pathToEnvKey("database.url") // "DATABASE_URL"
 * pathToEnvKey("api.timeoutMs") // "API_TIMEOUT_MS"
 * pathToEnvKey("feature.enableBeta") // "FEATURE_ENABLE_BETA"
 */
export const pathToEnvKey = (path: string, separator = '_'): string => {
  return path.split('.').map(camelToScreamingSnake).join(separator);
};

/**
 * Convert SCREAMING_SNAKE_CASE to camelCase
 *
 * @example
 * screamingSnakeToCamel("TIMEOUT_MS") // "timeoutMs"
 * screamingSnakeToCamel("ENABLE_BETA") // "enableBeta"
 */
export const screamingSnakeToCamel = (str: string): string => {
  return str.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
};

/**
 * Convert an environment variable key to a dot-notation path
 *
 * Note: This is a best-effort conversion. Some information is lost in the
 * camelCase to SCREAMING_SNAKE_CASE conversion. For accurate mapping,
 * use pathToEnvKey to generate env keys and match against schema paths.
 *
 * @param envKey - Environment variable key (e.g., "DATABASE_URL")
 * @param separator - Key separator (default: "_")
 * @returns Dot-notation path (e.g., "database.url")
 */
export const envKeyToPath = (envKey: string, separator = '_'): string => {
  // Split by separator (but be careful with consecutive underscores that were part of the word)
  // This is imperfect - we recommend matching against schema instead
  return envKey
    .toLowerCase()
    .split(separator)
    .map((part, i) => (i === 0 ? part : part))
    .join('.');
};

// --------------------------------------------------------------------------
// Batch Operations
// --------------------------------------------------------------------------

/**
 * Convert a nested object to a flat map with env-style keys
 *
 * @param obj - Nested object
 * @param separator - Key separator (default: "_")
 * @returns Flat object with SCREAMING_SNAKE_CASE keys
 */
export const toEnvMap = (obj: Record<string, unknown>, separator = '_'): Record<string, unknown> => {
  const flat = flatten(obj);
  const result: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(flat)) {
    const envKey = pathToEnvKey(path, separator);
    result[envKey] = value;
  }

  return result;
};

/**
 * Get sorted keys from a flat object (case-insensitive sort)
 */
export const getSortedKeys = (obj: FlatObject): ReadonlyArray<string> =>
  Object.keys(obj).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
