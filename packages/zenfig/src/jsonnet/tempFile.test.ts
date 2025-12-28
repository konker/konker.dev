/**
 * Temp File Tests
 */
import * as fs from 'node:fs';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { afterEach, describe, expect, it } from 'vitest';

import { ErrorCode } from '../errors.js';
import { createJsonTempFile, createTempFile, withJsonTempFile, withTempFile } from './tempFile.js';

describe('Temp File Handling', () => {
  const createdFiles: Array<string> = [];

  afterEach(() => {
    // Clean up any created files
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    createdFiles.length = 0;
  });

  describe('createTempFile', () => {
    it('should create a temp file with content', async () => {
      const content = 'test content';

      const tempFile = await Effect.runPromise(createTempFile(content));
      createdFiles.push(tempFile.path);

      expect(fs.existsSync(tempFile.path)).toBe(true);
      expect(fs.readFileSync(tempFile.path, 'utf-8')).toBe(content);
    });

    it('should create file with restrictive permissions (0600)', async () => {
      const tempFile = await Effect.runPromise(createTempFile('secret'));
      createdFiles.push(tempFile.path);

      const stats = fs.statSync(tempFile.path);
      // Check permissions are 0600 (owner read/write only)
      // Mode is in octal, mask with 0o777 to get permission bits
      expect(stats.mode & 0o777).toBe(0o600);
    });

    it('should use custom prefix', async () => {
      const tempFile = await Effect.runPromise(createTempFile('content', 'custom-prefix-'));
      createdFiles.push(tempFile.path);

      expect(tempFile.path).toContain('custom-prefix-');
    });

    it('should generate unique file names', async () => {
      const tempFile1 = await Effect.runPromise(createTempFile('content1'));
      const tempFile2 = await Effect.runPromise(createTempFile('content2'));
      createdFiles.push(tempFile1.path, tempFile2.path);

      expect(tempFile1.path).not.toBe(tempFile2.path);
    });

    it('should provide a cleanup function', async () => {
      const tempFile = await Effect.runPromise(createTempFile('content'));

      expect(fs.existsSync(tempFile.path)).toBe(true);

      await Effect.runPromise(tempFile.cleanup());

      expect(fs.existsSync(tempFile.path)).toBe(false);
    });

    it('cleanup should handle already deleted files', async () => {
      const tempFile = await Effect.runPromise(createTempFile('content'));

      // Delete the file manually
      fs.unlinkSync(tempFile.path);

      // Cleanup should not throw
      await expect(Effect.runPromise(tempFile.cleanup())).resolves.toBeUndefined();
    });

    it('should fail when temp file cannot be written', async () => {
      const exit = await Effect.runPromiseExit(createTempFile('content', 'nonexistent-dir/zenfig-'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS003);
        }
      }
    });
  });

  describe('createJsonTempFile', () => {
    it('should create a temp file with JSON content', async () => {
      const data = { key: 'value', nested: { foo: 'bar' } };

      const tempFile = await Effect.runPromise(createJsonTempFile(data));
      createdFiles.push(tempFile.path);

      const content = fs.readFileSync(tempFile.path, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(data);
    });

    it('should format JSON with indentation', async () => {
      const data = { key: 'value' };

      const tempFile = await Effect.runPromise(createJsonTempFile(data));
      createdFiles.push(tempFile.path);

      const content = fs.readFileSync(tempFile.path, 'utf-8');

      // JSON.stringify with null, 2 produces formatted output
      expect(content).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('withTempFile', () => {
    it('should execute function with temp file path', async () => {
      const content = 'test content';

      const result = await Effect.runPromise(
        withTempFile(content, (filePath) =>
          Effect.sync(() => {
            return fs.readFileSync(filePath, 'utf-8');
          })
        )
      );

      expect(result).toBe(content);
    });

    it('should clean up file after successful execution', async () => {
      let capturedPath = '';

      await Effect.runPromise(
        withTempFile('content', (filePath) =>
          Effect.sync(() => {
            capturedPath = filePath;
            expect(fs.existsSync(filePath)).toBe(true);
          })
        )
      );

      expect(fs.existsSync(capturedPath)).toBe(false);
    });

    it('should clean up file after error', async () => {
      let capturedPath = '';

      const exit = await Effect.runPromiseExit(
        withTempFile('content', (filePath) =>
          pipe(
            Effect.sync(() => {
              capturedPath = filePath;
            }),
            Effect.flatMap(() => Effect.fail(new Error('test error')))
          )
        )
      );

      expect(exit._tag).toBe('Failure');
      expect(fs.existsSync(capturedPath)).toBe(false);
    });

    it('should propagate errors from the function', async () => {
      const testError = new Error('test error');

      const exit = await Effect.runPromiseExit(withTempFile('content', () => Effect.fail(testError)));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error).toBe(testError);
        }
      }
    });
  });

  describe('withJsonTempFile', () => {
    it('should execute function with JSON temp file', async () => {
      const data = { key: 'value' };

      const result = await Effect.runPromise(
        withJsonTempFile(data, (filePath) =>
          Effect.sync(() => {
            const content = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
          })
        )
      );

      expect(result).toEqual(data);
    });

    it('should clean up after execution', async () => {
      let capturedPath = '';

      await Effect.runPromise(
        withJsonTempFile({ foo: 'bar' }, (filePath) =>
          Effect.sync(() => {
            capturedPath = filePath;
          })
        )
      );

      expect(fs.existsSync(capturedPath)).toBe(false);
    });
  });
});
