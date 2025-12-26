/**
 * Output Formatting
 *
 * Converts configuration objects to .env or JSON format
 */
import { flatten, getSortedKeys, pathToEnvKey } from './flatten.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type FormatOptions = {
  readonly separator?: string; // Env key separator (default: "_")
  readonly sortKeys?: boolean; // Sort keys alphabetically (default: true)
};

// --------------------------------------------------------------------------
// Value Serialization
// --------------------------------------------------------------------------

/**
 * Check if a string needs quoting in .env format
 */
const needsQuoting = (value: string): boolean => {
  // Needs quoting if:
  // - Contains spaces, #, =, newlines, or $
  // - Starts or ends with whitespace
  // - Is empty
  if (value.length === 0) return false; // Empty string can be KEY= without quotes
  if (value.startsWith(' ') || value.endsWith(' ')) return true;
  if (/[\s#=$\n]/.test(value)) return true;
  return false;
};

/**
 * Escape a string for double-quoted .env value
 */
const escapeEnvValue = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\') // Backslash first
    .replace(/"/g, '\\"') // Quotes
    .replace(/\n/g, '\\n'); // Newlines
};

/**
 * Serialize a value for .env format
 */
const serializeEnvValue = (value: unknown): string | undefined => {
  if (value === undefined) {
    // Omit undefined values
    return undefined;
  }

  if (value === null) {
    // Omit null values in .env format
    return undefined;
  }

  if (typeof value === 'string') {
    if (needsQuoting(value)) {
      return `"${escapeEnvValue(value)}"`;
    }
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value) || typeof value === 'object') {
    // Arrays and objects are serialized as minified JSON
    const json = JSON.stringify(value);
    // JSON always needs quoting since it contains special chars
    return `"${escapeEnvValue(json)}"`;
  }

  return String(value);
};

// --------------------------------------------------------------------------
// Format Functions
// --------------------------------------------------------------------------

/**
 * Format a configuration object as .env content
 *
 * @param config - The configuration object (nested or flat)
 * @param options - Format options
 * @returns .env file content as string
 */
export const formatEnv = (config: Record<string, unknown>, options: FormatOptions = {}): string => {
  const separator = options.separator ?? '_';
  const sortKeys = options.sortKeys ?? true;

  // Flatten if nested
  const flat = flatten(config);

  // Convert to env keys
  const envMap: Record<string, string> = {};
  for (const [path, value] of Object.entries(flat)) {
    const envKey = pathToEnvKey(path, separator);
    const serialized = serializeEnvValue(value);
    if (serialized !== undefined) {
      envMap[envKey] = serialized;
    }
  }

  // Sort keys
  const keys = sortKeys ? getSortedKeys(envMap) : Object.keys(envMap);

  // Build output
  const lines = keys.map((key) => `${key}=${envMap[key]}`);

  return lines.join('\n') + (lines.length > 0 ? '\n' : '');
};

/**
 * Format a configuration object as JSON content
 *
 * @param config - The configuration object
 * @param pretty - Whether to pretty-print (default: true)
 * @returns JSON content as string
 */
export const formatJson = (config: Record<string, unknown>, pretty = true): string => {
  return pretty ? JSON.stringify(config, null, 2) + '\n' : JSON.stringify(config) + '\n';
};

/**
 * Format a configuration object in the specified format
 *
 * @param config - The configuration object
 * @param format - Output format ("env" or "json")
 * @param options - Format options
 * @returns Formatted content as string
 */
export const formatConfig = (
  config: Record<string, unknown>,
  format: 'env' | 'json',
  options: FormatOptions = {}
): string => {
  switch (format) {
    case 'env':
      return formatEnv(config, options);
    case 'json':
      return formatJson(config);
  }
};

// --------------------------------------------------------------------------
// Parse Functions (for validate command)
// --------------------------------------------------------------------------

/**
 * Parse .env file content
 *
 * @param content - .env file content
 * @returns Flat key-value map
 */
export const parseEnvContent = (content: string): Record<string, string> => {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    // Find the first = sign
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue; // Invalid line, skip
    }

    const key = trimmed.slice(0, eqIndex);
    let value = trimmed.slice(eqIndex + 1);

    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
      // Unescape
      value = value.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    result[key] = value;
  }

  return result;
};

/**
 * Detect file format from content
 */
export const detectFormat = (content: string): 'env' | 'json' | 'unknown' => {
  const trimmed = content.trim();

  // Check for JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }

  // Check for .env format (KEY=VALUE lines)
  const lines = trimmed.split('\n').filter((l) => l.trim() !== '' && !l.trim().startsWith('#'));
  if (lines.length > 0 && lines.every((l) => /^[A-Z_][A-Z0-9_]*=/.test(l.trim()))) {
    return 'env';
  }

  return 'unknown';
};
