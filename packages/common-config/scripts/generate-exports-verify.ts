/* eslint-disable fp/no-unused-expression */
import fs from 'node:fs/promises';
import path from 'node:path';

import { generateExports } from './generate-exports-common.js';

(async function main() {
  // Check args, print usage
  const fullProjectPath = process.argv[2];
  if (!fullProjectPath) {
    console.error(`Usage: ${process.argv[1]} <project_dir>`);
    return process.exit(1);
  }

  // Read in package.json
  const packageJson: Record<string, unknown> = JSON.parse(
    await fs.readFile(path.join(fullProjectPath, 'package.json'), 'utf8')
  );
  const exports: unknown = packageJson.exports;

  // Generate exports
  const generated = await generateExports(fullProjectPath);

  // Compare package.exports with generated exports
  if (JSON.stringify(exports) !== JSON.stringify(generated)) {
    console.error(`ERROR: Exports for ${fullProjectPath} differ from generate-exports output`);
    return process.exit(1);
  }

  console.log(`OK: Exports for ${fullProjectPath} matvh from generate-exports output`);
  return process.exit(0);
})().catch(console.error);
