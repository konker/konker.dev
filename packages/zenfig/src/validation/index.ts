import { effectAdapter } from './effect.js';
import type { ValidationKind, ValidatorAdapter } from './types.js';
import { zodAdapter } from './zod.js';

const adapters: Record<ValidationKind, ValidatorAdapter> = {
  effect: effectAdapter,
  zod: zodAdapter,
};

export function getValidatorAdapter(kind: ValidationKind = 'effect'): ValidatorAdapter {
  return adapters[kind];
}

export { effectAdapter, zodAdapter };
export type { ParseMode, ParsedValue, ResolvedPath, SchemaKeyInfo, ValidationKind, ValidatorAdapter } from './types.js';
