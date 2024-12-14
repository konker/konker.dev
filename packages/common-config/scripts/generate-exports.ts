/* eslint-disable fp/no-unused-expression,fp/no-nil */
import path from 'node:path';

import { generateExports } from './generate-exports-common.js';

(async function main() {
  // Check args, print usage
  const projectPath = process.argv[2];
  if (!projectPath) {
    console.error(`Usage: ${process.argv[1]} <project_dir>`);
    return process.exit(1);
  }
  const fullProjectPath = path.join(import.meta.dirname, '..', '..', '..', '..', projectPath);

  const exports = await generateExports(fullProjectPath);

  console.log(JSON.stringify(exports, null, 2));
  return process.exit(0);
})().catch(console.error);
