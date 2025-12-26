/**
 * Value Redaction
 *
 * Utilities for redacting sensitive values in logs and output
 */

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

export const REDACTED = '<redacted>';
export const NOT_SET = '(not set)';
export const REMOVED = '(removed)';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type RedactOptions = {
  readonly showValues?: boolean; // If true, show actual values
  readonly maxLength?: number; // Truncate values longer than this
};

// --------------------------------------------------------------------------
// Redaction Functions
// --------------------------------------------------------------------------

/**
 * Redact a value if showValues is false
 */
export const redactValue = (value: unknown, options: RedactOptions = {}): string => {
  const { showValues = false, maxLength = 50 } = options;

  if (value === undefined) {
    return NOT_SET;
  }

  if (value === null) {
    return showValues ? 'null' : REDACTED;
  }

  if (!showValues) {
    return REDACTED;
  }

  // Convert to string representation
  let str: string;
  if (typeof value === 'string') {
    str = value;
  } else if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // Truncate if needed
  if (str.length > maxLength) {
    return `${str.slice(0, maxLength)}...`;
  }

  return str;
};

/**
 * Redact all values in an object
 */
export const redactObject = (
  obj: Record<string, unknown>,
  options: RedactOptions = {}
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[key] = redactValue(value, options);
  }

  return result;
};

/**
 * Check if showing values is safe (TTY check)
 */
export const isSafeToShowValues = (showValues: boolean, unsafeShowValues: boolean): boolean => {
  if (unsafeShowValues) {
    return true;
  }

  if (showValues && process.stdout.isTTY) {
    return true;
  }

  return false;
};

/**
 * Create redact options from CLI flags
 */
export const createRedactOptions = (
  showValues?: boolean,
  unsafeShowValues?: boolean,
  maxLength?: number
): RedactOptions => ({
  showValues: isSafeToShowValues(showValues ?? false, unsafeShowValues ?? false),
  maxLength: maxLength ?? 50,
});
