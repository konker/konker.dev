import * as del from 'del';
import { execa } from 'execa';
import gulp from 'gulp';
import H from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import readFiles from 'read-vinyl-file-stream';
import tmp from 'tmp-promise';
import unslug from 'unslug';
import File from 'vinyl';

// --------------------------------------------------------------------------
export const ASTRO_REF_DOCS_CONFIG = [
  {
    name: '@konker.dev/tiny-event-fp',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/tiny-event-fp',
    dest: `./src/content/projects/konker.dev-tiny-event-fp/reference`,
    tmpDir: await tmp.dir(),
  },
  {
    name: '@konker.dev/tiny-rules-fp',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/tiny-rules-fp',
    dest: `./src/content/projects/konker.dev-tiny-rules-fp/reference`,
    tmpDir: await tmp.dir(),
  },
];

// --------------------------------------------------------------------------
export const ASTRO_FRONT_MATTER_TEMPLATE_SRC = `---
title: {{{title}}}
author: {{{author}}}
description: {{{description}}}
type: reference
---
`;

export const ASTRO_INDEX_MARKDOWN_TEMPLATE_SRC = `---
title: {{{title}}}
author: {{{author}}}
description: {{{description}}}
type: reference-reference
---
`;

export const ASTRO_FRONT_MATTER_TEMPLATE = H.compile(ASTRO_FRONT_MATTER_TEMPLATE_SRC);
export const ASTRO_INDEX_MARKDOWN_TEMPLATE = H.compile(ASTRO_INDEX_MARKDOWN_TEMPLATE_SRC);
export const INDEX_SOURCE_FILE_NAME = 'index.md';

// --------------------------------------------------------------------------
// Globals
export const _global_IndexSourceFileAcc = [];

// --------------------------------------------------------------------------
function createAstroMarkdownContent(config, contents, file) {
  const h1 = contents.match(/[^#]?# (.+)/);
  if (!h1 || h1.length < 2) {
    callback(`ERROR: ${file.path}: Could not extract H1`);
  }
  const frontMatter = ASTRO_FRONT_MATTER_TEMPLATE({
    title: `'${h1[1]}'`,
    author: `'${config.author}'`,
    description: 'FIXME-DESC',
  });

  return frontMatter + contents;
}

// --------------------------------------------------------------------------
function createMarkdownContentForIndex(config, indexRelPath) {
  const dir = path.dirname(indexRelPath);
  return ASTRO_INDEX_MARKDOWN_TEMPLATE({
    title: unslug(dir),
    author: `'${config.author}'`,
    description: `FIXME-INDEX-DESC`,
  });
}

// --------------------------------------------------------------------------
async function CleanTmpDirs() {
  for (const config of ASTRO_REF_DOCS_CONFIG) {
    return del.deleteAsync(config.tmpDir.path, { force: true });
  }
}

// --------------------------------------------------------------------------
function GulpExecEnsureIndexMarkdownForAstro(config) {
  return gulp
    .src(`${config.dest}/**/*.md`)
    .pipe(
      readFiles(function (contents, file, stream, cb) {
        const dir = path.dirname(file.path);
        const indexFilePath = path.join(dir, INDEX_SOURCE_FILE_NAME);
        const indexExists = fs.existsSync(indexFilePath);
        if (!indexExists && !_global_IndexSourceFileAcc.includes(indexFilePath)) {
          _global_IndexSourceFileAcc.push(indexFilePath);

          const indexRelPath = path.relative(config.dest, indexFilePath);
          const indexFileContent = createMarkdownContentForIndex(config, indexRelPath);
          stream.push(
            new File({
              path: indexRelPath,
              contents: Buffer.from(indexFileContent),
            })
          );
        }
        cb();
      })
    )
    .pipe(gulp.dest(config.dest));
}

// --------------------------------------------------------------------------
function GulpExecConvertMarkdownForAstro(config) {
  console.log(`Converting markdown: ${config.name}: ${config.tmpDir.path}...`);
  return gulp
    .src(`${config.tmpDir.path}/**/*.md`)
    .pipe(
      readFiles((contents, file, stream, cb) => {
        const newContent = createAstroMarkdownContent(config, contents, file);
        cb(null, newContent);
      })
    )
    .pipe(gulp.dest(config.dest));
}

// --------------------------------------------------------------------------
async function ExecCleanMarkdownForAstro(config) {
  console.log(`Cleaning markdown: ${config.name}...`);
  return del.deleteAsync(config.dest);
}

// --------------------------------------------------------------------------
async function ExecGenerateTypedocMarkdown(config) {
  console.log(`Generating markdown.for ${config.name}..`);

  // Run typedoc tool with very specific parameters
  await execa('npx', [
    'typedoc',
    '--readme',
    'none',
    '--plugin',
    'typedoc-plugin-markdown',
    '--hideBreadcrumbs',
    'true',
    '--hidePageHeader',
    'true',
    '--hidePageTitle',
    'false',
    '--excludeGroups',
    'false',
    '--indexFormat',
    'table',
    '--useCodeBlocks',
    'true',
    // '--flattenOutputFiles',
    '--entryPointStrategy',
    'resolve',
    '--entryFileName',
    'index',
    /*
        '--membersWithOwnFile',
        'Enum',
        '--membersWithOwnFile',
        'Variable',
        '--membersWithOwnFile',
        'Function',
        '--membersWithOwnFile',
        'Class',
        '--membersWithOwnFile',
        'Interface',
        '--membersWithOwnFile',
        'TypeAlias',
        */
    // '--outputFileStrategy',
    // 'modules',
    '--tsconfig',
    `${config.src}/tsconfig.json`,
    '--out',
    config.tmpDir.path,
    `${config.src}/src`,
  ]);
}

// --------------------------------------------------------------------------
export const buildAstroReferenceDocs = gulp.series(
  ...ASTRO_REF_DOCS_CONFIG.flatMap((config) => [
    () => ExecGenerateTypedocMarkdown(config),
    () => ExecCleanMarkdownForAstro(config),
    () => GulpExecConvertMarkdownForAstro(config),
    () => GulpExecEnsureIndexMarkdownForAstro(config),
  ]),

  CleanTmpDirs
);

// eslint-disable-next-line import/no-default-export
export default async function defaultTask() {
  return buildAstroReferenceDocs();
}
