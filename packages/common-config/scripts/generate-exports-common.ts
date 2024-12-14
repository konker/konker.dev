import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

export async function generateExports(fullProjectPath: string) {
  // Execute find command, read in output, and split into an array
  const fullProjectSourcePath = path.join(fullProjectPath, 'src');
  const sourceFilesStr = await promisify(exec)(
    `find ${fullProjectSourcePath} -type f -name '*.ts' ! -name '*.test.ts' -printf "%P\\n"`
  );
  const sourceFiles = sourceFilesStr.stdout.replaceAll(path.sep, '/').split('\n');

  // Sort the source file paths, such that index.ts is at the top
  // then files in the root directory,
  // then the other files in lexical order
  const sortedSourceFiles = sourceFiles
    .filter((x) => x !== '')
    .toSorted((a, b) => {
      if (a === 'index.ts') {
        return -1;
      }
      if (b === 'index.ts') {
        return 1;
      }
      if (a.includes('/') && b.includes('/')) {
        return a.localeCompare(b, 'en-US');
      }
      if (a.includes('/')) {
        return -1;
      }
      if (b.includes('/')) {
        return 1;
      }
      return a.localeCompare(b, 'en-US');
    });

  const processedSourceFiles = sortedSourceFiles.map((file) => {
    const baseFile = file.substring(0, file.length - path.extname(file).length);
    const exportName = (() => {
      if (baseFile === 'index') {
        return '.';
      }
      if (baseFile.endsWith('/index')) {
        return `./${baseFile.substring(0, baseFile.length - 6)}`;
      }
      return `./${baseFile}`;
    })();
    return { file, baseFile, exportName };
  });

  return processedSourceFiles.reduce(
    (acc, val) => {
      return {
        ...acc,
        [val.exportName]: {
          types: `./dist/${val.baseFile}.d.ts`,
          import: `./dist/${val.baseFile}.js`,
        },
      };
    },
    {
      './package.json': './package.json',
    }
  );
}
