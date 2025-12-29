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

// Commands (for programmatic usage)
export { executeExport, type ExportOptions, type ExportResult } from './commands/export.js';

export { executeUpsert, type UpsertOptions, type UpsertResult } from './commands/upsert.js';

export { executeValidate, type ValidateOptions, type ValidateResult } from './commands/validate.js';

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
