# @konker.dev/effect-ts-prelude

A prelude to conveniently import commonly used modules from [Effect-TS](https://www.effect.website/)

[![jest tested](https://github.com/konkerdotdev/effect-ts-prelude/actions/workflows/ci.yml/badge.svg)](https://github.com/konkerdotdev/effect-ts-prelude/actions/workflows/ci.yml)
![GitHub](https://img.shields.io/github/license/konkerdotdev/effect-ts-prelude)

## Example Usage

```typescript
import * as P from '@konkerdotdev/effect-ts-prelude';

export function strToNum(s: string): P.Effect.Effect<never, Error, number> {
  return P.pipe(s, P.Schema.decode(P.Schema.NumberFromString), P.Effect.mapError(P.toError));
}

P.assert(P.Effect.runSync(strToNum('1')) === 1);
```
