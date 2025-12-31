/**
 * ConfigOTron - Configuration and Secrets Management Tool
 *
 * Main entry point for programmatic export usage
 */

export * from './errors.js';
export type { ResolvedConfig } from './config.js';
export type { MergeConflict } from './lib/merge.js';
export { exportConfig, type ExportApiOptions, type ExportApiResult } from './api.js';
