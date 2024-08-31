# @konker.dev/tiny-utils-fp

General utility functions for [Node.js](https://nodejs.org/) based on [Effect-TS](https://www.effect.website/)

![License](https://img.shields.io/github/license/konkerdotdev/node-ts-fp-boilerplate)
[![NPM Version](https://img.shields.io/npm/v/%40konker.dev%2Ftiny-utils-fp)](https://www.npmjs.com/package/@konker.dev/tiny-utils-fp)
[![CI](https://github.com/konkerdotdev/tiny-utils-fp/actions/workflows/ci.yml/badge.svg)](https://github.com/konkerdotdev/tiny-utils-fp/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/konkerdotdev/tiny-utils-fp/graph/badge.svg?token=W3BFLXCWTH)](https://codecov.io/gh/konkerdotdev/tiny-utils-fp)

## Usage

Copy the contents of this repo, and:

- Search and replace files for `YOUR_SRC_DIR_COULD_BE_DOT` and substitute for the desired source directory
- Edit package.json `staticFiles` property as needed
- Run `pnpm install`
- Run `git init`
- Run: `pnpm dlx husky-init && pnpm install`
- Replace this with your actual README.md
- Replace ISC.LICENSE as needed
- Amend .github/workflows/cd.yml to replace `PATH_TO_PACKAGE_JSON`
- Remember:
  - README.md title / content
  - package.json name
  - package.json description

## For An Existing Project

- Copy the following. merging as necessary:
  - .editorconfig
  - .eslintignore
  - .eslintrc.json
  - .madgerc
  - .nvmrc
  - .prettierignore
  - .prettierrc
  - gulpfile.mjs
  - jest.config.ts
    - Replaces jest.config.js if applicable
  - tsconfig.json
- Search and replace for `YOUR_SRC_DIR_COULD_BE_DOT`
- Merge .gitignore
- Copy over dev dependencies not already present
- Copy over dependencies not already present
- LICENSE
