**@konker.dev/neverthrow-r-utils**

***

# `@konker.dev/neverthrow-r-utils`

Sibling utility package to `@konker.dev/tiny-utils-fp`, but implemented with [`neverthrow`](https://github.com/supermacro/neverthrow) and [`@konker.dev/neverthrow-r`](https://www.npmjs.com/package/@konker.dev/neverthrow-r) instead of Effect.

The package keeps the same broad module split as `tiny-utils-fp`:

- `array` for pure byte/string conversion helpers.
- `hash` for synchronous hashing helpers returning `ResultR<unknown, T, Error>`.
- `stream` for stream helpers and classes, including async helpers returning `ResultAsyncR<unknown, T, Error>`.

## Core idea

Pure helpers remain plain functions. Fallible helpers are expressed with `neverthrow-r`:

- sync failures: `ResultR<unknown, T, Error>`
- async failures: `ResultAsyncR<unknown, T, Error>`

Because these utilities do not depend on any environment, their requirement channel is `unknown`. Callers can use them directly:

```ts
import { md5Hex } from '@konker.dev/neverthrow-r-utils/hash';
import { readStreamToBuffer } from '@konker.dev/neverthrow-r-utils/stream';

const digest = md5Hex('test')(undefined);
const bytes = await readStreamToBuffer(stream)(undefined);
```

Or compose them inside a larger `neverthrow-r` pipeline.

## Modules

| Module   | Use when                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `array`  | Converting between strings and `Uint8Array` / `ArrayBuffer` views.                                        |
| `hash`   | Computing MD5, SHA-256, and HMAC SHA-256 digests with normalized `Error` failures.                        |
| `stream` | Reading streams into buffers, waiting for stream completion, and using the bundled stream helper classes. |

See each module page for the full API.
