import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ResolvedConfig } from '../../config.js';
import { createMockProvider } from '../../providers/MockProvider.js';
import type { ProviderKV } from '../../providers/Provider.js';
import { registerProvider } from '../../providers/registry.js';

const fixturesDir = path.dirname(fileURLToPath(import.meta.url));

let providerCounter = 0;

export const schemaBasicPath = path.join(fixturesDir, 'schema.basic.ts');

export const basicProviderKv: ProviderKV = {
  'database.host': 'localhost',
  'database.port': '5432',
  'database.url': 'https://example.com',
  'api.timeout': '30000',
  'feature.enableBeta': 'true',
  tags: '["alpha","beta"]',
};

export const basicParsedConfig = {
  database: {
    host: 'localhost',
    port: 5432,
    url: 'https://example.com',
  },
  api: {
    timeout: 30000,
  },
  feature: {
    enableBeta: true,
  },
  tags: ['alpha', 'beta'],
};

export const basicEnvContent = [
  'DATABASE_HOST=localhost',
  'DATABASE_PORT=5432',
  'DATABASE_URL=https://example.com',
  'API_TIMEOUT=30000',
  'FEATURE_ENABLE_BETA=true',
  'TAGS=["alpha","beta"]',
].join('\n');

export function createTempDir(prefix = 'zenfig-test-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function removeDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

export function writeJson(filePath: string, value: unknown): void {
  writeFile(filePath, JSON.stringify(value));
}

export function createProviderData(
  service: string,
  kv: ProviderKV,
  options: { readonly prefix?: string; readonly env?: string } = {}
): Record<string, ProviderKV> {
  const prefix = options.prefix ?? '/zenfig';
  const env = options.env ?? 'dev';
  return { [`${prefix}/${env}/${service}`]: kv };
}

export function createBasicProviderData(
  service = 'api',
  overrides: Record<string, string> = {},
  options: { readonly prefix?: string; readonly env?: string } = {}
): Record<string, ProviderKV> {
  return createProviderData(service, { ...basicProviderKv, ...overrides }, options);
}

export function createTestConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    env: 'dev',
    provider: 'mock',
    ssmPrefix: '/zenfig',
    schema: schemaBasicPath,
    schemaExportName: 'ConfigSchema',
    sources: [],
    format: 'env',
    separator: '_',
    cache: undefined,
    ci: false,
    strict: false,
    providerGuards: {},
    ...overrides,
  };
}

export function registerMockProviderWithData(initialData?: Record<string, ProviderKV>): {
  readonly name: string;
  readonly provider: ReturnType<typeof createMockProvider>;
} {
  const provider = createMockProvider(initialData);
  const name = `mock-test-${providerCounter++}`;
  registerProvider(name, () => provider);
  return { name, provider };
}
