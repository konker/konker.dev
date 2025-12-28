/**
 * Jsonnet Executor Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../errors.js';
import { checkJsonnetBinary, evaluateTemplate, executeJsonnet } from './executor.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { execa } from 'execa';

describe('Jsonnet Executor', () => {
  let tempDir: string;
  const createdFiles: Array<string> = [];

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-jsonnet-test-'));
  });

  afterEach(() => {
    // Clean up temp files
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch {
        // Ignore
      }
    }
    createdFiles.length = 0;

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('checkJsonnetBinary', () => {
    it('should succeed when jsonnet is available', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '/usr/bin/jsonnet',
        stderr: '',
        exitCode: 0,
      } as never);

      const result = await Effect.runPromise(checkJsonnetBinary());

      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('which', ['jsonnet']);
    });

    it('should fail when jsonnet is not found', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('not found'));

      const exit = await Effect.runPromiseExit(checkJsonnetBinary());

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS001);
        }
      }
    });
  });

  describe('executeJsonnet', () => {
    it('should fail when template file does not exist', async () => {
      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath: '/nonexistent/template.jsonnet' }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      }
    });

    it('should execute jsonnet and return parsed output', async () => {
      // Create a temp jsonnet file
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{ key: "value" }');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: JSON.stringify({ key: 'value' }),
        stderr: '',
        exitCode: 0,
      } as never);

      const result = await Effect.runPromise(
        executeJsonnet(
          { secrets: { secret: 'value' }, env: 'dev' },
          { templatePath }
        )
      );

      expect(result).toEqual({ key: 'value' });
    });

    it('should pass secrets via temp file and env as ext-str', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      } as never);

      await Effect.runPromise(
        executeJsonnet(
          { secrets: { dbPassword: 'secret123' }, env: 'prod' },
          { templatePath }
        )
      );

      expect(execa).toHaveBeenCalledWith(
        'jsonnet',
        expect.arrayContaining([
          '--ext-code-file',
          expect.stringMatching(/^secrets=/),
          '--ext-str',
          'env=prod',
          templatePath,
        ]),
        expect.any(Object)
      );
    });

    it('should pass defaults as ext-code when provided', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      } as never);

      await Effect.runPromise(
        executeJsonnet(
          { secrets: {}, env: 'dev', defaults: { timeout: 30 } },
          { templatePath }
        )
      );

      expect(execa).toHaveBeenCalledWith(
        'jsonnet',
        expect.arrayContaining([
          '--ext-code',
          expect.stringContaining('defaults='),
        ]),
        expect.any(Object)
      );
    });

    it('should use custom timeout', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      } as never);

      await Effect.runPromise(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath, timeoutMs: 60000 }
        )
      );

      expect(execa).toHaveBeenCalledWith(
        'jsonnet',
        expect.any(Array),
        expect.objectContaining({ timeout: 60000 })
      );
    });

    it('should fail with runtime error for timeout', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      const timeoutError = new Error('Timeout') as Error & { timedOut: boolean };
      timeoutError.timedOut = true;
      vi.mocked(execa).mockRejectedValueOnce(timeoutError);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath, timeoutMs: 100 }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON002);
        }
      }
    });

    it('should fail with binary not found error for ENOENT', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      const enoentError = new Error('ENOENT') as Error & { code: string };
      enoentError.code = 'ENOENT';
      vi.mocked(execa).mockRejectedValueOnce(enoentError);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS001);
        }
      }
    });

    it('should fail with syntax error for STATIC ERROR', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      const syntaxError = new Error('STATIC ERROR') as Error & { stderr: string };
      syntaxError.stderr = 'STATIC ERROR: config.jsonnet:1:5 Expected } but got ,';
      vi.mocked(execa).mockRejectedValueOnce(syntaxError);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON001);
        }
      }
    });

    it('should fail with missing variable error for Undefined external variable', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      const varError = new Error('Undefined external variable') as Error & { stderr: string };
      varError.stderr = 'Undefined external variable: myVar';
      vi.mocked(execa).mockRejectedValueOnce(varError);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON004);
        }
      }
    });

    it('should fail with runtime error for RUNTIME ERROR', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      const runtimeError = new Error('RUNTIME ERROR') as Error & { stderr: string };
      runtimeError.stderr = 'RUNTIME ERROR: Division by zero';
      vi.mocked(execa).mockRejectedValueOnce(runtimeError);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON002);
        }
      }
    });

    it('should fail for invalid JSON output', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'not valid json',
        stderr: '',
        exitCode: 0,
      } as never);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON003);
        }
      }
    });

    it('should fail when output is not an object', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '"just a string"',
        stderr: '',
        exitCode: 0,
      } as never);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON003);
        }
      }
    });

    it('should fail when output is an array', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '[1, 2, 3]',
        stderr: '',
        exitCode: 0,
      } as never);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON003);
        }
      }
    });

    it('should fail when output is null', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'null',
        stderr: '',
        exitCode: 0,
      } as never);

      const exit = await Effect.runPromiseExit(
        executeJsonnet(
          { secrets: {}, env: 'dev' },
          { templatePath }
        )
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.JSON003);
        }
      }
    });
  });

  describe('evaluateTemplate', () => {
    it('should be a convenience wrapper for executeJsonnet', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{ "result": "success" }',
        stderr: '',
        exitCode: 0,
      } as never);

      const result = await Effect.runPromise(
        evaluateTemplate({ secret: 'value' }, 'prod', templatePath)
      );

      expect(result).toEqual({ result: 'success' });
    });

    it('should use default timeout of 30000ms', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      } as never);

      await Effect.runPromise(evaluateTemplate({}, 'dev', templatePath));

      expect(execa).toHaveBeenCalledWith(
        'jsonnet',
        expect.any(Array),
        expect.objectContaining({ timeout: 30000 })
      );
    });

    it('should use custom timeout when provided', async () => {
      const templatePath = path.join(tempDir, 'config.jsonnet');
      fs.writeFileSync(templatePath, '{}');
      createdFiles.push(templatePath);

      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '{}',
        stderr: '',
        exitCode: 0,
      } as never);

      await Effect.runPromise(evaluateTemplate({}, 'dev', templatePath, 5000));

      expect(execa).toHaveBeenCalledWith(
        'jsonnet',
        expect.any(Array),
        expect.objectContaining({ timeout: 5000 })
      );
    });
  });
});
