/**
 * Zenfig Error System
 *
 * Error codes and types as defined in the specification:
 * - VAL (Validation): VAL001-VAL005
 * - PROV (Provider): PROV001-PROV006
 * - CLI (Command-line): CLI001-CLI003
 * - SYS (System): SYS001-SYS003
 */
/* eslint-disable fp/no-class,fp/no-this */
import * as Data from 'effect/Data';

// --------------------------------------------------------------------------
// Exit Codes
// --------------------------------------------------------------------------
export const EXIT_SUCCESS = 0;
export const EXIT_VALIDATION_ERROR = 1;
export const EXIT_CONFIG_ERROR = 2;
export const EXIT_FILE_ERROR = 3;
export const EXIT_AUTH_ERROR = 4;
export const EXIT_SCHEMA_MISMATCH = 5;

export type ExitCode =
  | typeof EXIT_SUCCESS
  | typeof EXIT_VALIDATION_ERROR
  | typeof EXIT_CONFIG_ERROR
  | typeof EXIT_FILE_ERROR
  | typeof EXIT_AUTH_ERROR
  | typeof EXIT_SCHEMA_MISMATCH;

// --------------------------------------------------------------------------
// Error Codes
// --------------------------------------------------------------------------
export const ErrorCode = {
  // Validation Errors
  VAL001: 'VAL001', // Invalid Type
  VAL002: 'VAL002', // Format Violation
  VAL003: 'VAL003', // Constraint Violation
  VAL004: 'VAL004', // Key Not Found
  VAL005: 'VAL005', // Null Not Allowed

  // Provider Errors
  PROV001: 'PROV001', // Connection Failed
  PROV002: 'PROV002', // Authentication Failed
  PROV003: 'PROV003', // Parameter Not Found
  PROV004: 'PROV004', // Encryption Verification Failed (Warning)
  PROV005: 'PROV005', // Write Permission Denied
  PROV006: 'PROV006', // Provider Guard Mismatch

  // CLI Errors
  CLI001: 'CLI001', // Invalid Flag
  CLI002: 'CLI002', // Missing Required Argument
  CLI003: 'CLI003', // Conflicting Flags

  // System Errors
  SYS001: 'SYS001', // File Not Found
  SYS002: 'SYS002', // Permission Denied
  SYS003: 'SYS003', // Snapshot Schema Mismatch
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// --------------------------------------------------------------------------
// Error Code to Exit Code Mapping
// --------------------------------------------------------------------------
export function errorCodeToExitCode(code: ErrorCodeType): ExitCode {
  switch (code) {
    case ErrorCode.CLI001:
    case ErrorCode.CLI002:
    case ErrorCode.CLI003:
      return EXIT_CONFIG_ERROR;

    case ErrorCode.SYS001:
    case ErrorCode.SYS002:
      return EXIT_FILE_ERROR;

    case ErrorCode.PROV001:
    case ErrorCode.PROV002:
    case ErrorCode.PROV005:
      return EXIT_AUTH_ERROR;

    case ErrorCode.PROV006:
      return EXIT_CONFIG_ERROR;

    case ErrorCode.SYS003:
      return EXIT_SCHEMA_MISMATCH;

    default:
      return EXIT_VALIDATION_ERROR;
  }
}

// --------------------------------------------------------------------------
// Base Error Types
// --------------------------------------------------------------------------
export type ZenfigErrorContext = {
  readonly code: ErrorCodeType;
  readonly path?: string | undefined;
  readonly expected?: string | undefined;
  readonly received?: string | undefined;
  readonly problem?: string | undefined;
  readonly remediation?: string | undefined;
  readonly example?: string | undefined;
  readonly location?: string | undefined; // Optional location info (file:line:col)
  readonly availableKeys?: ReadonlyArray<string> | undefined;
};

// --------------------------------------------------------------------------
// Error Classes using Effect's Data.TaggedError
// --------------------------------------------------------------------------

export class ZenfigError extends Data.TaggedError('ZenfigError')<{
  readonly message: string;
  readonly context: ZenfigErrorContext;
}> {
  get exitCode(): ExitCode {
    return errorCodeToExitCode(this.context.code);
  }
}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string;
  readonly context: ZenfigErrorContext;
}> {
  get exitCode(): ExitCode {
    return errorCodeToExitCode(this.context.code);
  }
}

export class ProviderError extends Data.TaggedError('ProviderError')<{
  readonly message: string;
  readonly context: ZenfigErrorContext;
}> {
  get exitCode(): ExitCode {
    return errorCodeToExitCode(this.context.code);
  }
}

export class CLIError extends Data.TaggedError('CLIError')<{
  readonly message: string;
  readonly context: ZenfigErrorContext;
}> {
  get exitCode(): ExitCode {
    return errorCodeToExitCode(this.context.code);
  }
}

export class SystemError extends Data.TaggedError('SystemError')<{
  readonly message: string;
  readonly context: ZenfigErrorContext;
}> {
  get exitCode(): ExitCode {
    return errorCodeToExitCode(this.context.code);
  }
}

// --------------------------------------------------------------------------
// Error Factory Functions
// --------------------------------------------------------------------------

// Validation Errors
export function invalidTypeError(path: string, expected: string, received: string): ValidationError {
  return new ValidationError({
    message: 'Value does not match expected type',
    context: {
      code: ErrorCode.VAL001,
      path,
      expected,
      received,
      problem: 'Value must be of the expected type',
      remediation: `Provide a valid ${expected} value`,
    },
  });
}

export function formatViolationError(
  path: string,
  expected: string,
  received: string,
  example?: string
): ValidationError {
  return new ValidationError({
    message: 'Value does not match required format',
    context: {
      code: ErrorCode.VAL002,
      path,
      expected,
      received,
      problem: `Value must be a valid ${expected}`,
      remediation: `Provide a valid ${expected}`,
      example,
    },
  });
}

export function constraintViolationError(
  path: string,
  expected: string,
  received: string,
  problem: string
): ValidationError {
  return new ValidationError({
    message: 'Value violates schema constraints',
    context: {
      code: ErrorCode.VAL003,
      path,
      expected,
      received,
      problem,
      remediation: `Provide a value that satisfies the constraint: ${expected}`,
    },
  });
}

export function keyNotFoundError(path: string, availableKeys?: ReadonlyArray<string>): ValidationError {
  return new ValidationError({
    message: 'Key path does not exist in schema',
    context: {
      code: ErrorCode.VAL004,
      path,
      problem: `Key '${path}' not found in schema`,
      remediation: 'Check schema for available keys',
      availableKeys,
    },
  });
}

export function invalidKeyPathError(path: string, problem: string): ValidationError {
  return new ValidationError({
    message: 'Invalid key path',
    context: {
      code: ErrorCode.VAL004,
      path,
      problem,
      remediation: 'Use dot notation with segments matching ^[A-Za-z0-9_-]+$',
    },
  });
}

export function unknownKeysError(keys: ReadonlyArray<string>): ValidationError {
  const sample = keys[0] ?? '(unknown)';
  return new ValidationError({
    message: 'Unknown keys not allowed in strict mode',
    context: {
      code: ErrorCode.VAL004,
      path: sample,
      problem: `Unknown keys: ${keys.join(', ')}`,
      remediation: 'Remove unknown keys or update the schema',
    },
  });
}

export function nullNotAllowedError(path: string, expected: string): ValidationError {
  return new ValidationError({
    message: 'Null value not permitted for this key',
    context: {
      code: ErrorCode.VAL005,
      path,
      expected,
      received: 'null',
      problem: 'This field cannot be null',
      remediation: 'Provide a non-null value or use Type.Union([Type.Null(), ...]) in schema',
    },
  });
}

// Provider Errors
export function connectionFailedError(provider: string, details?: string): ProviderError {
  return new ProviderError({
    message: 'Failed to connect to provider',
    context: {
      code: ErrorCode.PROV001,
      problem: details ?? `Could not connect to ${provider}`,
      remediation: 'Check network connectivity, verify AWS credentials, and ensure region is configured',
    },
  });
}

export function authenticationFailedError(provider: string, details?: string): ProviderError {
  return new ProviderError({
    message: 'Provider authentication failed',
    context: {
      code: ErrorCode.PROV002,
      problem: details ?? `Authentication failed for ${provider}`,
      remediation:
        'For AWS: Check AWS_PROFILE, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. Verify IAM permissions (ssm:GetParameters, ssm:PutParameter, ssm:DeleteParameter). Check region configuration.',
    },
  });
}

export function parameterNotFoundError(path: string, fullPath: string): ProviderError {
  return new ProviderError({
    message: 'SSM parameter does not exist',
    context: {
      code: ErrorCode.PROV003,
      path,
      problem: `Parameter not found: ${fullPath}`,
      remediation: 'Verify parameter path, check --env flag matches expected environment',
    },
  });
}

export function encryptionVerificationFailedError(path: string): ProviderError {
  return new ProviderError({
    message: 'Parameter is not encrypted as SecureString',
    context: {
      code: ErrorCode.PROV004,
      path,
      problem: 'Parameter may not be encrypted',
      remediation:
        'Manually update parameter type in AWS SSM console, or use --skip-encryption-check (not recommended)',
    },
  });
}

export function writePermissionDeniedError(path: string, details?: string): ProviderError {
  return new ProviderError({
    message: 'Insufficient permissions to write parameter',
    context: {
      code: ErrorCode.PROV005,
      path,
      problem: details ?? 'Write permission denied',
      remediation:
        'Check IAM policy includes ssm:PutParameter action, verify resource ARN matches target parameter path',
    },
  });
}

export function providerGuardMismatchError(provider: string, details: string): ProviderError {
  return new ProviderError({
    message: 'Provider guard check failed',
    context: {
      code: ErrorCode.PROV006,
      problem: `Provider '${provider}': ${details}`,
      remediation: 'Verify providerGuards configuration, or set ZENFIG_IGNORE_PROVIDER_GUARDS=1 for emergency override',
    },
  });
}

// CLI Errors
export function invalidFlagError(flag: string): CLIError {
  return new CLIError({
    message: 'Unknown or invalid command-line flag',
    context: {
      code: ErrorCode.CLI001,
      problem: `Unknown flag: ${flag}`,
      remediation: 'Run zenfig <command> --help for available flags',
    },
  });
}

export function missingRequiredArgumentError(argument: string, command: string): CLIError {
  return new CLIError({
    message: 'Required argument not provided',
    context: {
      code: ErrorCode.CLI002,
      problem: `Missing required argument: ${argument}`,
      remediation: `Check command syntax: zenfig ${command} --help`,
    },
  });
}

export function conflictingFlagsError(flags: ReadonlyArray<string>): CLIError {
  return new CLIError({
    message: 'Incompatible flags used together',
    context: {
      code: ErrorCode.CLI003,
      problem: `Conflicting flags: ${flags.join(', ')}`,
      remediation: 'Use only one of the conflicting flags',
    },
  });
}

// System Errors
export function fileNotFoundError(path: string): SystemError {
  return new SystemError({
    message: 'Required file does not exist',
    context: {
      code: ErrorCode.SYS001,
      path,
      problem: `File not found: ${path}`,
      remediation: 'Check file path is correct, verify file permissions (readable)',
    },
  });
}

export function permissionDeniedError(path: string, operation: string): SystemError {
  return new SystemError({
    message: 'Insufficient filesystem permissions',
    context: {
      code: ErrorCode.SYS002,
      path,
      problem: `Permission denied for ${operation}: ${path}`,
      remediation: 'Check file/directory permissions',
    },
  });
}

export function snapshotSchemaMismatchError(expectedHash: string, actualHash: string): SystemError {
  return new SystemError({
    message: 'Snapshot schema hash does not match current schema',
    context: {
      code: ErrorCode.SYS003,
      expected: expectedHash,
      received: actualHash,
      problem: 'Schema has changed since snapshot was created',
      remediation:
        'Review schema changes since snapshot was created, use --force-schema-mismatch to restore anyway (may cause validation errors), or regenerate snapshot with current schema',
    },
  });
}

// --------------------------------------------------------------------------
// Error Formatting
// --------------------------------------------------------------------------
export type ZenfigErrorLike = ZenfigError | ValidationError | ProviderError | CLIError | SystemError;

export function formatError(error: ZenfigErrorLike): string {
  const { context, message } = error;
  const lines: Array<string> = [];

  // Header
  const errorType = error._tag.replace('Error', ' Error');
  lines.push(`${errorType} [${context.code}]${context.path ? `: ${context.path}` : ''}`);
  lines.push('');

  // Message
  lines.push(`  Message: ${message}`);

  // Details
  if (context.expected) {
    lines.push(`  Expected: ${context.expected}`);
  }
  if (context.received) {
    lines.push(`  Received: ${context.received}`);
  }
  if (context.problem) {
    lines.push(`  Problem:  ${context.problem}`);
  }
  if (context.location) {
    lines.push(`  Location: ${context.location}`);
  }
  lines.push('');

  // Remediation
  if (context.remediation) {
    lines.push(`  Remediation: ${context.remediation}`);
  }
  if (context.example) {
    lines.push(`  Example:     ${context.example}`);
  }
  if (context.availableKeys && context.availableKeys.length > 0) {
    lines.push(`  Available keys:`);
    for (const key of context.availableKeys.slice(0, 10)) {
      lines.push(`    - ${key}`);
    }
    if (context.availableKeys.length > 10) {
      lines.push(`    ... and ${context.availableKeys.length - 10} more`);
    }
  }

  return lines.join('\n');
}
