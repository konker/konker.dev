/**
 * Zenfig Error System
 *
 * Error codes and types as defined in the specification:
 * - VAL (Validation): VAL001-VAL005
 * - PROV (Provider): PROV001-PROV005
 * - JSON (Jsonnet): JSON001-JSON004
 * - CLI (Command-line): CLI001-CLI003
 * - SYS (System): SYS001-SYS004
 */
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

  // Jsonnet Errors
  JSON001: 'JSON001', // Syntax Error
  JSON002: 'JSON002', // Runtime Error
  JSON003: 'JSON003', // Invalid Output
  JSON004: 'JSON004', // Missing External Variable

  // CLI Errors
  CLI001: 'CLI001', // Invalid Flag
  CLI002: 'CLI002', // Missing Required Argument
  CLI003: 'CLI003', // Conflicting Flags

  // System Errors
  SYS001: 'SYS001', // Binary Not Found
  SYS002: 'SYS002', // File Not Found
  SYS003: 'SYS003', // Permission Denied
  SYS004: 'SYS004', // Snapshot Schema Mismatch
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// --------------------------------------------------------------------------
// Error Code to Exit Code Mapping
// --------------------------------------------------------------------------
export const errorCodeToExitCode = (code: ErrorCodeType): ExitCode => {
  switch (code) {
    case ErrorCode.CLI001:
    case ErrorCode.CLI002:
    case ErrorCode.CLI003:
      return EXIT_CONFIG_ERROR;

    case ErrorCode.SYS001:
    case ErrorCode.SYS002:
    case ErrorCode.SYS003:
      return EXIT_FILE_ERROR;

    case ErrorCode.PROV001:
    case ErrorCode.PROV002:
    case ErrorCode.PROV005:
      return EXIT_AUTH_ERROR;

    case ErrorCode.SYS004:
      return EXIT_SCHEMA_MISMATCH;

    default:
      return EXIT_VALIDATION_ERROR;
  }
};

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
  readonly location?: string | undefined; // For Jsonnet errors: file:line:col
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

export class JsonnetError extends Data.TaggedError('JsonnetError')<{
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
export const invalidTypeError = (path: string, expected: string, received: string): ValidationError =>
  new ValidationError({
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

export const formatViolationError = (
  path: string,
  expected: string,
  received: string,
  example?: string
): ValidationError =>
  new ValidationError({
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

export const constraintViolationError = (path: string, expected: string, received: string, problem: string): ValidationError =>
  new ValidationError({
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

export const keyNotFoundError = (path: string, availableKeys?: ReadonlyArray<string>): ValidationError =>
  new ValidationError({
    message: 'Key path does not exist in schema',
    context: {
      code: ErrorCode.VAL004,
      path,
      problem: `Key '${path}' not found in schema`,
      remediation: 'Check schema for available keys',
      availableKeys,
    },
  });

export const nullNotAllowedError = (path: string, expected: string): ValidationError =>
  new ValidationError({
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

// Provider Errors
export const connectionFailedError = (provider: string, details?: string): ProviderError =>
  new ProviderError({
    message: 'Failed to connect to provider',
    context: {
      code: ErrorCode.PROV001,
      problem: details ?? `Could not connect to ${provider}`,
      remediation: `Check network connectivity, verify AWS credentials (for chamber/SSM), check provider binary is in PATH`,
    },
  });

export const authenticationFailedError = (provider: string, details?: string): ProviderError =>
  new ProviderError({
    message: 'Provider authentication failed',
    context: {
      code: ErrorCode.PROV002,
      problem: details ?? `Authentication failed for ${provider}`,
      remediation:
        'For AWS: Check AWS_PROFILE, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. Verify IAM permissions (ssm:GetParameters, ssm:PutParameter, ssm:DeleteParameter). Check region configuration.',
    },
  });

export const parameterNotFoundError = (path: string, fullPath: string): ProviderError =>
  new ProviderError({
    message: 'SSM parameter does not exist',
    context: {
      code: ErrorCode.PROV003,
      path,
      problem: `Parameter not found: ${fullPath}`,
      remediation: 'Verify parameter path, check --env flag matches expected environment',
    },
  });

export const encryptionVerificationFailedError = (path: string): ProviderError =>
  new ProviderError({
    message: 'Parameter is not encrypted as SecureString',
    context: {
      code: ErrorCode.PROV004,
      path,
      problem: 'Parameter may not be encrypted',
      remediation: 'Manually update parameter type in AWS SSM console, or use --skip-encryption-check (not recommended)',
    },
  });

export const writePermissionDeniedError = (path: string, details?: string): ProviderError =>
  new ProviderError({
    message: 'Insufficient permissions to write parameter',
    context: {
      code: ErrorCode.PROV005,
      path,
      problem: details ?? 'Write permission denied',
      remediation:
        'Check IAM policy includes ssm:PutParameter action, verify resource ARN matches target parameter path',
    },
  });

// Jsonnet Errors
export const jsonnetSyntaxError = (location: string, problem: string): JsonnetError =>
  new JsonnetError({
    message: 'Jsonnet template has syntax error',
    context: {
      code: ErrorCode.JSON001,
      location,
      problem,
      remediation: 'Fix syntax error in Jsonnet template',
    },
  });

export const jsonnetRuntimeError = (location: string, problem: string): JsonnetError =>
  new JsonnetError({
    message: 'Jsonnet template failed during evaluation',
    context: {
      code: ErrorCode.JSON002,
      location,
      problem,
      remediation: 'Check logic in Jsonnet template',
    },
  });

export const jsonnetInvalidOutputError = (received: string): JsonnetError =>
  new JsonnetError({
    message: 'Jsonnet did not return a valid object',
    context: {
      code: ErrorCode.JSON003,
      expected: 'JSON object',
      received,
      problem: 'Jsonnet must evaluate to an object, not a primitive',
      remediation: 'Ensure Jsonnet returns { ... } object structure',
    },
  });

export const jsonnetMissingVariableError = (variable: string): JsonnetError =>
  new JsonnetError({
    message: 'Required external variable not provided',
    context: {
      code: ErrorCode.JSON004,
      problem: `Missing external variable: ${variable}`,
      remediation: 'Ensure secrets and env are passed via --ext-code, check temp file creation succeeded',
    },
  });

// CLI Errors
export const invalidFlagError = (flag: string): CLIError =>
  new CLIError({
    message: 'Unknown or invalid command-line flag',
    context: {
      code: ErrorCode.CLI001,
      problem: `Unknown flag: ${flag}`,
      remediation: 'Run zenfig <command> --help for available flags',
    },
  });

export const missingRequiredArgumentError = (argument: string, command: string): CLIError =>
  new CLIError({
    message: 'Required argument not provided',
    context: {
      code: ErrorCode.CLI002,
      problem: `Missing required argument: ${argument}`,
      remediation: `Check command syntax: zenfig ${command} --help`,
    },
  });

export const conflictingFlagsError = (flags: ReadonlyArray<string>): CLIError =>
  new CLIError({
    message: 'Incompatible flags used together',
    context: {
      code: ErrorCode.CLI003,
      problem: `Conflicting flags: ${flags.join(', ')}`,
      remediation: 'Use only one of the conflicting flags',
    },
  });

// System Errors
export const binaryNotFoundError = (binary: string): SystemError =>
  new SystemError({
    message: 'Required binary not found in PATH',
    context: {
      code: ErrorCode.SYS001,
      problem: `Binary not found: ${binary}`,
      remediation:
        binary === 'jsonnet'
          ? 'Install jsonnet: brew install go-jsonnet or build from source'
          : binary === 'chamber'
            ? 'Install chamber: go install github.com/segmentio/chamber/v2@latest'
            : `Install ${binary} and ensure it is in PATH`,
    },
  });

export const fileNotFoundError = (path: string): SystemError =>
  new SystemError({
    message: 'Required file does not exist',
    context: {
      code: ErrorCode.SYS002,
      path,
      problem: `File not found: ${path}`,
      remediation: 'Check file path is correct, verify file permissions (readable)',
    },
  });

export const permissionDeniedError = (path: string, operation: string): SystemError =>
  new SystemError({
    message: 'Insufficient filesystem permissions',
    context: {
      code: ErrorCode.SYS003,
      path,
      problem: `Permission denied for ${operation}: ${path}`,
      remediation: 'Check file/directory permissions',
    },
  });

export const snapshotSchemaMismatchError = (expectedHash: string, actualHash: string): SystemError =>
  new SystemError({
    message: 'Snapshot schema hash does not match current schema',
    context: {
      code: ErrorCode.SYS004,
      expected: expectedHash,
      received: actualHash,
      problem: 'Schema has changed since snapshot was created',
      remediation:
        'Review schema changes since snapshot was created, use --force-schema-mismatch to restore anyway (may cause validation errors), or regenerate snapshot with current schema',
    },
  });

// --------------------------------------------------------------------------
// Error Formatting
// --------------------------------------------------------------------------
export type ZenfigErrorLike = ZenfigError | ValidationError | ProviderError | JsonnetError | CLIError | SystemError;

export const formatError = (error: ZenfigErrorLike): string => {
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
};
