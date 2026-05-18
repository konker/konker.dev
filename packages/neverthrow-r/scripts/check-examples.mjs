#!/usr/bin/env node
// Extracts ```ts / ```typescript fences from JSDoc @example blocks in src/*.ts,
// writes each to .examples-check/<module>-<n>.ts, and runs tsc --noEmit.

import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');
const srcDir = join(pkgRoot, 'src');
const outDir = join(pkgRoot, '.examples-check');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const sourceFiles = readdirSync(srcDir)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

const JSDOC = /\/\*\*([\s\S]*?)\*\//g;
// After stripping the leading " * " line prefixes, an @example block runs from
// the @example tag's line until the next @-tag at line start (or end of body).
const EXAMPLE_FENCE = /^@example[^\n]*\n([\s\S]*?)(?=^@\w|\Z)/gm;
const CODE_FENCE = /```(?:ts|typescript)\s*\n([\s\S]*?)```/g;

let total = 0;
for (const file of sourceFiles) {
  const moduleName = file.replace(/\.ts$/, '');
  const text = readFileSync(join(srcDir, file), 'utf8');
  let n = 0;
  for (const [, body] of text.matchAll(JSDOC)) {
    // Strip leading " * " from each line of the JSDoc body.
    const stripped = body.replace(/^[ \t]*\*[ \t]?/gm, '');
    for (const [, exampleBody] of stripped.matchAll(EXAMPLE_FENCE)) {
      for (const [, code] of exampleBody.matchAll(CODE_FENCE)) {
        const outFile = join(outDir, `${moduleName}-${n}.ts`);
        writeFileSync(outFile, code);
        n += 1;
        total += 1;
      }
    }
  }
}

if (total === 0) {
  console.log('check-examples: no @example fences found, skipping tsc.');
  process.exit(0);
}

console.log(`check-examples: extracted ${total} example(s), running tsc...`);
try {
  execSync('npx tsc -p tsconfig.examples.json', {
    cwd: pkgRoot,
    stdio: 'inherit',
  });
  console.log('check-examples: OK');
} catch {
  console.error('check-examples: FAILED');
  process.exit(1);
}
