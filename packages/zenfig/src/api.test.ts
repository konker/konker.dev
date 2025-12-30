/**
 * Programmatic Export API Tests
 */
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { exportConfig } from './api.js';
import {
  basicParsedConfig,
  createBasicProviderData,
  createTempDir,
  registerMockProviderWithData,
  removeDir,
  schemaBasicPath,
  writeJson,
} from './test/fixtures/index.js';

describe('exportConfig', () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let tempDir: string | undefined;

  const resetEnv = () => {
    process.env = { ...originalEnv };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('ZENFIG_')) {
        // eslint-disable-next-line fp/no-delete
        delete process.env[key];
      }
    }
  };

  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.chdir(originalCwd);
    if (tempDir) {
      removeDir(tempDir);
      tempDir = undefined;
    }
  });

  it('exports config with explicit overrides', async () => {
    const { name } = registerMockProviderWithData(createBasicProviderData('api'));

    const result = await exportConfig({
      service: 'api',
      config: {
        provider: name,
        ssmPrefix: '/zenfig',
        env: 'dev',
        schema: schemaBasicPath,
        schemaExportName: 'ConfigSchema',
        format: 'json',
      },
    });

    expect(result.config).toEqual(basicParsedConfig);
  });

  it('prefers API options over config format', async () => {
    const { name } = registerMockProviderWithData(createBasicProviderData('api'));

    const result = await exportConfig({
      service: 'api',
      format: 'env',
      config: {
        provider: name,
        ssmPrefix: '/zenfig',
        env: 'dev',
        schema: schemaBasicPath,
        schemaExportName: 'ConfigSchema',
        format: 'json',
      },
    });

    expect(result.formatted).toContain('DATABASE_HOST=localhost');
  });

  it('uses explicit sources over config sources', async () => {
    const { name } = registerMockProviderWithData({
      ...createBasicProviderData('api'),
      ...createBasicProviderData('shared', { 'database.port': '1111' }),
      ...createBasicProviderData('extra', { 'database.port': '2222' }),
    });

    const result = await exportConfig({
      service: 'api',
      sources: ['extra'],
      config: {
        provider: name,
        ssmPrefix: '/zenfig',
        env: 'dev',
        schema: schemaBasicPath,
        schemaExportName: 'ConfigSchema',
        sources: ['shared'],
      },
    });

    expect(result.config.database).toEqual({
      ...basicParsedConfig.database,
      port: 2222,
    });
  });

  it('loads zenfigrc.json when config overrides are omitted', async () => {
    tempDir = createTempDir('zenfig-api-test-');
    const { name } = registerMockProviderWithData(
      createBasicProviderData('api', {}, { prefix: '/custom', env: 'dev' })
    );

    writeJson(path.join(tempDir, 'zenfigrc.json'), {
      env: 'dev',
      provider: name,
      ssmPrefix: '/custom',
      schema: schemaBasicPath,
      schemaExportName: 'ConfigSchema',
      format: 'json',
    });

    process.chdir(tempDir);

    const result = await exportConfig({
      service: 'api',
    });

    expect(result.config).toEqual(basicParsedConfig);
    expect(result.formatted.trim().startsWith('{')).toBe(true);
  });
});
