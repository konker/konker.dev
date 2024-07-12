# @konker.dev/effect-ts-prelude

A prelude to conveniently import commonly used modules from [Effect-TS](https://www.effect.website/)

![License](https://img.shields.io/github/license/konkerdotdev/effect-ts-prelude)
[![NPM Version](https://img.shields.io/npm/v/%40konker.dev%2Feffect-ts-prelude)](https://www.npmjs.com/package/@konker.dev/effect-ts-prelude)
[![codecov](https://codecov.io/gh/konkerdotdev/effect-ts-prelude/graph/badge.svg?token=KJWH5965GM)](https://codecov.io/gh/konkerdotdev/effect-ts-prelude)

## Example Usage

```typescript
import * as P from '@konkerdotdev/effect-ts-prelude';

export function strToNum(s: string): P.Effect.Effect<never, Error, number> {
  return P.pipe(s, P.Schema.decode(P.Schema.NumberFromString), P.Effect.mapError(P.toError));
}

P.assert(P.Effect.runSync(strToNum('1')) === 1);
```
