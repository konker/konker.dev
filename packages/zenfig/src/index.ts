/**
 * Zenfig - Configuration and Secrets Management Tool
 *
 * Main entry point for library usage
 */

// Core types and errors
export * from './errors.js';
export * from './config.js';

// Schema utilities
export * from './schema/index.js';

// Providers
export * from './providers/index.js';

// Lib utilities
export * from './lib/index.js';

// Jsonnet
export * from './jsonnet/index.js';

// Commands (for programmatic usage)
export { executeExport, type ExportOptions, type ExportResult } from './commands/export.js';

export { executeUpsert, type UpsertOptions, type UpsertResult } from './commands/upsert.js';

export { executeValidate, type ValidateOptions, type ValidateResult } from './commands/validate.js';

export { executeDiff, type DiffOptions, type DiffResult, type DiffEntry } from './commands/diff.js';

export { executeDelete, type DeleteOptions, type DeleteResult } from './commands/delete.js';

export {
  executeSnapshotSave,
  executeSnapshotRestore,
  type SnapshotSaveOptions,
  type SnapshotRestoreOptions,
  type SnapshotSaveResult,
  type SnapshotRestoreResult,
  type SnapshotV1,
  type SnapshotMeta,
} from './commands/snapshot.js';

export { executeInit, type InitOptions, type InitResult } from './commands/init.js';

export { executeDoctor, type DoctorOptions, type DoctorResult, type CheckResult } from './commands/doctor.js';
