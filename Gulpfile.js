/* eslint-disable @typescript-eslint/naming-convention */
import * as del from 'del';
import { execa } from 'execa';
import gulp from 'gulp';
import prettier from 'gulp-prettier';
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
    _enabled: true,
    name: '@konker.dev/tiny-event-fp',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/tiny-event-fp',
    dest: `./src/content/projects/konker.dev-tiny-event-fp/reference`,
    basePath: 'konkerdev-tiny-event-fp/reference',
    tmpDir: await tmp.dir(),
    sectionTitle: 'Reference',
  },
  {
    _enabled: true,
    name: '@konker.dev/tiny-filesystem-fp',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/tiny-filesystem-fp',
    dest: `./src/content/projects/konker.dev-tiny-filesystem-fp/reference`,
    basePath: 'konkerdev-tiny-filesystem-fp/reference',
    tmpDir: await tmp.dir(),
    sectionTitle: 'Reference',
  },
  {
    _enabled: true,
    name: '@konker.dev/tiny-treecrawler-fp',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/tiny-treecrawler-fp',
    dest: `./src/content/projects/konker.dev-tiny-treecrawler-fp/reference`,
    basePath: 'konkerdev-tiny-treecrawler-fp/reference',
    tmpDir: await tmp.dir(),
    sectionTitle: 'Reference',
  },
  {
    _enabled: true,
    name: '@konker.dev/tiny-rules-fp',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/tiny-rules-fp',
    dest: `./src/content/projects/konker.dev-tiny-rules-fp/reference`,
    basePath: 'konkerdev-tiny-rules-fp/reference',
    tmpDir: await tmp.dir(),
    sectionTitle: 'Reference',
  },
  {
    _enabled: true,
    name: '@konker.dev/aws-client-effect-dynamodb',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/aws-client-effect-dynamodb',
    dest: `./src/content/projects/konker.dev-aws-client-effect-dynamodb/reference`,
    basePath: 'konkerdev-aws-client-effect-dynamodb/reference',
    tmpDir: await tmp.dir(),
    sectionTitle: 'Reference',
  },
  {
    _enabled: true,
    name: '@konker.dev/aws-client-effect-s3',
    author: 'Konrad Markus',
    src: '/home/konker/WORKING/konker/@konker.dev/aws-client-effect-s3',
    dest: `./src/content/projects/konker.dev-aws-client-effect-s3/reference`,
    basePath: 'konkerdev-aws-client-effect-s3/reference',
    tmpDir: await tmp.dir(),
    sectionTitle: 'Reference',
  },
];

// --------------------------------------------------------------------------
export const DEFAULT_REFERENCE_ORDERING = 5;
export const REFERENCE_ORDERING_LOOKUP = {
  functions: 6,
  'type-aliases': 5,
  index: 4,
};

// --------------------------------------------------------------------------
export const ASTRO_FRONT_MATTER_TEMPLATE_SRC = `---
title: '{{{title}}}'
author: '{{{author}}}'
description: '{{{description}}}'
order: {{{order}}}
kind: reference
---
`;

export const ASTRO_INDEX_MARKDOWN_TEMPLATE_SRC = `---
title: '{{{title}}}'
author: '{{{author}}}'
description: '{{{description}}}'
order: {{{order}}}
kind: reference
navigable: false
---
`;

export const ASTRO_FRONT_MATTER_TEMPLATE = H.compile(ASTRO_FRONT_MATTER_TEMPLATE_SRC);
export const ASTRO_INDEX_MARKDOWN_TEMPLATE = H.compile(ASTRO_INDEX_MARKDOWN_TEMPLATE_SRC);
export const FILE_EXT = '.md';
export const INDEX_SOURCE_FILE_NAME = `index${FILE_EXT}`;
export const SANITIZE_TITLE_REGEXPS = [/^Function:\s/, /^Type alias:\s/, /\\<[^>]+>$/];
export const MARKDOWN_LINK_REGEXP = /[(](\/\S+\.md)[)]/g;

// --------------------------------------------------------------------------
// Globals
// eslint-disable-next-line @typescript-eslint/naming-convention
export const _global_IndexSourceFileAcc = [];

// --------------------------------------------------------------------------
function sanitizeTitle(title) {
  return SANITIZE_TITLE_REGEXPS.reduce((acc, val) => acc.replace(val, ''), title);
}

// --------------------------------------------------------------------------
function slugify(p) {
  const slugPath = p.endsWith(FILE_EXT) ? p.slice(0, -FILE_EXT.length) : p;
  return slugPath.toLowerCase();
}

function relPath(config, file) {
  return path.relative(config.tmpDir.path, file.path);
}

function slugifyFile(config, file) {
  const slugPath = path.join(config.basePath, relPath(config, file));
  return slugify(slugPath);
}

// --------------------------------------------------------------------------
export function lookupReferenceOrdering(config, p) {
  const k = Object.keys(REFERENCE_ORDERING_LOOKUP).find((x) => p.startsWith(x));
  const o = REFERENCE_ORDERING_LOOKUP[k];

  return o ?? DEFAULT_REFERENCE_ORDERING;
}

export function lookupReferenceOrderingForFile(config, file) {
  const p = relPath(config, file);
  return lookupReferenceOrdering(config, p);
}

// --------------------------------------------------------------------------
function amendMarkdownLinks(config, file, contents) {
  return contents.replaceAll(MARKDOWN_LINK_REGEXP, (m) => {
    // Drop surrounding parens, as can't seem to do that via the regexp itself
    const inner = m.slice(1, -1);
    const newLink = slugify(inner);

    // Add back parens
    return `(${newLink})`;
  });
}

// --------------------------------------------------------------------------
function createAstroMarkdownContent(config, contents, file) {
  const h1 = contents.match(/[^#]?# (.+)/);
  if (!h1 || h1.length < 2) {
    callback(`ERROR: ${file.path}: Could not extract H1`);
  }

  const title = h1[1] === config.name ? config.sectionTitle : h1[1];
  const sanitizedTitle = sanitizeTitle(title);
  const frontMatter = ASTRO_FRONT_MATTER_TEMPLATE({
    title: sanitizedTitle,
    slug: slugifyFile(config, file),
    author: config.author,
    description: 'FIXME-DESC',
    order: lookupReferenceOrderingForFile(config, file),
  });

  const contentsWithTitle = contents.replace(h1[1], sanitizedTitle);
  const contentsWithAmendedLinks = amendMarkdownLinks(config, file, contentsWithTitle);

  return frontMatter + contentsWithAmendedLinks;
}

// --------------------------------------------------------------------------
function createMarkdownContentForIndex(config, indexRelPath) {
  const dir = path.dirname(indexRelPath);
  return ASTRO_INDEX_MARKDOWN_TEMPLATE({
    title: unslug(dir),
    author: config.author,
    description: 'FIXME-INDEX-DESC',
    order: lookupReferenceOrdering(config, indexRelPath),
  });
}

// --------------------------------------------------------------------------
async function CleanTmpDirs() {
  for (const config of ASTRO_REF_DOCS_CONFIG) {
    if (config._enabled) {
      await del.deleteAsync(config.tmpDir.path, { force: true });
    }
  }
}

// --------------------------------------------------------------------------
function GulpExecEnsureIndexMarkdownForAstro(config) {
  return gulp
    .src(`${config.dest}/**/*${FILE_EXT}`)
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
    .src(`${config.tmpDir.path}/**/*${FILE_EXT}`)
    .pipe(
      readFiles((contents, file, stream, cb) => {
        const newContent = createAstroMarkdownContent(config, contents, file);
        cb(null, newContent);
      })
    )
    .pipe(gulp.dest(config.dest));
}

// --------------------------------------------------------------------------
function GulpExecPrettier(config) {
  console.log(`Prettifying markdown: ${config.name}: ${config.tmpDir.path}...`);
  return gulp
    .src(`${config.dest}/**/*${FILE_EXT}`)
    .pipe(prettier({ singleQuote: true }))
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
    '--fileExtension',
    FILE_EXT,
    '--publicPath',
    `/projects/${config.basePath}`,
    '--entryPointStrategy',
    'resolve',
    '--entryFileName',
    'index',
    /*
        '--membersWithOwnFile',
        'Variable',
    */
    '--membersWithOwnFile',
    'Enum',
    '--membersWithOwnFile',
    'Function',
    '--membersWithOwnFile',
    'Class',
    '--membersWithOwnFile',
    'Interface',
    '--membersWithOwnFile',
    'TypeAlias',
    // '--flattenOutputFiles',
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
  ...ASTRO_REF_DOCS_CONFIG.filter((x) => x._enabled).flatMap((config) => [
    () => ExecGenerateTypedocMarkdown(config),
    () => ExecCleanMarkdownForAstro(config),
    () => GulpExecConvertMarkdownForAstro(config),
    () => GulpExecEnsureIndexMarkdownForAstro(config),
    () => GulpExecPrettier(config),
  ]),

  CleanTmpDirs
);

// eslint-disable-next-line import/no-default-export
export default async function defaultTask() {
  return buildAstroReferenceDocs();
}
